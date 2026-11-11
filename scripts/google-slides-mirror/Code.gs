/* Native Google Slides mirror. Source is read only in this code.
 * Separate project and consent from the older PDF/GitHub exporter.
 * Configure exact STUDENT file pairs in private Script Properties, not here.
 */
const MIRROR_CONFIG_KEY = 'MIRROR_PAIRS';
const MIRROR_HANDLER = 'syncMirrors';
const MIRROR_MIME = 'application/vnd.google-apps.presentation';
const MIRROR_RUN_MS = 240000;
const MIRROR_MAX_OPERATIONS = 120;

function previewMirrors() {
  const pairs = mirrorPairs_();
  return pairs.map(pair => {
    const files = mirrorFiles_(pair);
    const source = SlidesApp.openById(pair.sourceId);
    const target = SlidesApp.openById(pair.targetId);
    mirrorDimensions_(source, target);
    const result = { id: pair.id, source: files.source.getName(),
      target: files.target.getName(), sourceSlides: source.getSlides().length,
      targetSlides: target.getSlides().length, targetOwner: pair.targetOwner,
      mode: 'Preview only; no presentation writes or trigger installed' };
    console.log(JSON.stringify(result));
    return result;
  });
}

function setupMirrors() {
  const result = syncMirrors();
  if (!result.complete) throw new Error('Initial mirror incomplete. Run syncMirrors again before setup.');
  stopMirrors();
  ScriptApp.newTrigger(MIRROR_HANDLER).timeBased().everyMinutes(15).create();
  console.log('Installed one 15-minute mirror trigger.');
}

function stopMirrors() {
  ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === MIRROR_HANDLER)
    .forEach(t => ScriptApp.deleteTrigger(t));
}

function syncMirrors() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) return { complete: false, reason: 'Another mirror run is active' };
  try {
    const pairs = mirrorPairs_();
    const properties = PropertiesService.getScriptProperties();
    const budget = { started: Date.now(), operations: 0 };
    const start = Number(properties.getProperty('MIRROR_CURSOR') || 0) % pairs.length;
    let completed = 0;
    for (let offset = 0; offset < pairs.length; offset++) {
      const index = (start + offset) % pairs.length;
      try {
        mirrorPair_(pairs[index], properties, budget);
        completed++;
        properties.setProperty('MIRROR_CURSOR', String((index + 1) % pairs.length));
      } catch (error) {
        properties.setProperty('MIRROR_CURSOR', String(index));
        if (error.message === 'MIRROR_BUDGET') {
          console.log('Bounded run paused; next run resumes this pair.');
          return { complete: false, completed: completed };
        }
        // Do not advance the source checkpoint on failed/partial writes.
        throw new Error('Mirror ' + pairs[index].id + ': ' + error.message);
      }
    }
    return { complete: true, completed: completed };
  } finally {
    lock.releaseLock();
  }
}

function mirrorPairs_() {
  const raw = PropertiesService.getScriptProperties().getProperty(MIRROR_CONFIG_KEY);
  const pairs = raw ? JSON.parse(raw) : [];
  if (!Array.isArray(pairs) || !pairs.length) throw new Error('No approved student mirror pairs configured.');
  const ids = new Set(), sources = new Set(), targets = new Set();
  for (const pair of pairs) {
    if (!pair || !/^[a-z0-9-]+$/.test(pair.id || '') || ids.has(pair.id) ||
        pair.approvedStudent !== true || pair.replaceTargetContent !== true ||
        !/^[A-Za-z0-9_-]{20,}$/.test(pair.sourceId || '') ||
        !/^[A-Za-z0-9_-]{20,}$/.test(pair.targetId || '') ||
        !pair.sourceOwner || !pair.targetOwner || targets.has(pair.targetId)) {
      throw new Error('Invalid, duplicate or unapproved mirror pair.');
    }
    ids.add(pair.id); sources.add(pair.sourceId); targets.add(pair.targetId);
  }
  // Also reject chains/cycles where any target could modify another source.
  for (const id of sources) if (targets.has(id)) throw new Error('A source must never be a mirror target.');
  return pairs;
}

function mirrorFiles_(pair) {
  const source = DriveApp.getFileById(pair.sourceId);
  const target = DriveApp.getFileById(pair.targetId);
  for (const [file, owner] of [[source, pair.sourceOwner], [target, pair.targetOwner]]) {
    if (file.getMimeType() !== MIRROR_MIME || file.isTrashed() ||
        !file.getOwner() || file.getOwner().getEmail().toLowerCase() !== owner.toLowerCase()) {
      throw new Error('File type, owner or trash state does not match the approved pair.');
    }
    if (/(teacher|answer\s*(sheet|edition))/i.test(file.getName())) {
      throw new Error('Teacher/answer editions are excluded from student mirrors.');
    }
  }
  return { source: source, target: target };
}

function mirrorDimensions_(source, target) {
  if (source.getPageWidth() !== target.getPageWidth() || source.getPageHeight() !== target.getPageHeight()) {
    throw new Error('Presentation dimensions differ. Create the school copy from the exact student source.');
  }
}

function mirrorOperation_(budget, action) {
  if (Date.now() - budget.started >= MIRROR_RUN_MS || budget.operations >= MIRROR_MAX_OPERATIONS) {
    throw new Error('MIRROR_BUDGET');
  }
  budget.operations++;
  return action();
}

function mirrorPair_(pair, properties, budget) {
  const files = mirrorFiles_(pair);
  // Include the source, target and owners so changing config cannot reuse an old checkpoint.
  const key = 'MIRROR_' + pair.id;
  const identity = [pair.sourceId, pair.targetId, pair.sourceOwner, pair.targetOwner].join('|');
  const modified = String(files.source.getLastUpdated().getTime());
  const checkpoint = JSON.stringify({ identity: identity, modified: modified });
  if (properties.getProperty(key) === checkpoint) return;
  const source = SlidesApp.openById(pair.sourceId);
  const target = SlidesApp.openById(pair.targetId);
  mirrorDimensions_(source, target);
  const sourceSlides = source.getSlides();
  if (!sourceSlides.length || sourceSlides.length > 180) throw new Error('Source slide count outside 1–180.');
  const progressKey = key + '_PROGRESS';
  const progress = JSON.parse(properties.getProperty(progressKey) || '{}');
  const resumed = progress.identity === identity && progress.modified === modified ? progress.completed : 0;
  let completed = 0;

  try {
    const existing = new Map();
    target.getSlides().forEach(slide => {
      if (slide.getSlideLinkingMode() === SlidesApp.SlideLinkingMode.LINKED &&
          slide.getSourcePresentationId() === pair.sourceId &&
          !existing.has(slide.getSourceSlideObjectId())) {
        existing.set(slide.getSourceSlideObjectId(), slide);
      }
    });
    const desired = [];
    for (const [index, slide] of sourceSlides.entries()) {
      let copy = existing.get(slide.getObjectId());
      if (!copy) {
        copy = mirrorOperation_(budget, () => target.appendSlide(slide, SlidesApp.SlideLinkingMode.LINKED));
      } else if (index >= resumed) {
        mirrorOperation_(budget, () => copy.refreshSlide());
      }
      desired.push(copy);
      completed = index + 1;
    }
    // Re-read metadata before removing old target slides. An edit during the
    // import leaves the checkpoint unset; the next run tries the new source.
    if (String(files.source.getLastUpdated().getTime()) !== modified) throw new Error('Source changed during mirroring; retry.');
    const keep = new Set(desired.map(slide => slide.getObjectId()));
    // Complete imports before deleting originals. Native writes are not atomic;
    // a failed run may leave appended/partly refreshed slides until resumed.
    for (const slide of target.getSlides()) {
      if (!keep.has(slide.getObjectId())) mirrorOperation_(budget, () => slide.remove());
    }
    desired.forEach((slide, index) => {
      const current = target.getSlides()[index];
      if (!current || current.getObjectId() !== slide.getObjectId()) {
        mirrorOperation_(budget, () => slide.move(index));
      }
    });
    if (JSON.stringify(target.getSlides().map(s => s.getObjectId())) !== JSON.stringify(desired.map(s => s.getObjectId()))) {
      throw new Error('Target order readback failed.');
    }
  } finally {
    target.saveAndClose();
    // Save progress only after Google's save succeeds. This lets a bounded run
    // finish decks larger than one operation budget without repeating every
    // earlier refresh forever. A new source timestamp invalidates the cursor.
    properties.setProperty(progressKey, JSON.stringify({ identity: identity, modified: modified, completed: completed }));
  }
  if (String(files.source.getLastUpdated().getTime()) !== modified) throw new Error('Source changed before checkpoint; retry.');
  properties.setProperty(key, checkpoint);
  properties.deleteProperty(progressKey);
  console.log('Mirrored ' + pair.id + ': ' + sourceSlides.length + ' native slides.');
}
