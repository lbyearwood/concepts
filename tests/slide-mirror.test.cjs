// Actual mirror code with simulated Google boundaries; no account credentials.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const code = fs.readFileSync(path.join(__dirname, '../scripts/google-slides-mirror/Code.gs'), 'utf8');
const sourceId = 'source_student_fixture_12345';
const targetId = 'target_student_fixture_12345';

function harness(options = {}) {
  const pair = { id: 'gcse-1-1', sourceId, targetId, sourceOwner: 'personal@example.com',
    targetOwner: 'school@example.edu', approvedStudent: true, replaceTargetContent: true, ...options.pair };
  const saved = { MIRROR_PAIRS: JSON.stringify([pair]), ...options.saved };
  const calls = { appended: 0, refreshed: 0, removed: 0, saved: 0, opened: [], timers: 0, released: 0 };
  let modified = 1000;
  const sourceSlides = Array.from({ length: options.count || 3 }, (_, i) => ({
    getObjectId: () => 's' + i, value: 'original-' + i
  }));
  const targetSlides = [];
  const slide = (id, source = null) => ({
    getObjectId: () => id,
    getSourceSlideObjectId: () => source,
    getSourcePresentationId: () => sourceId,
    getSlideLinkingMode: () => source ? 'LINKED' : 'NOT_LINKED',
    refreshSlide() {
      calls.refreshed++;
      if (options.failRefresh) throw new Error('Refresh failed');
      this.value = sourceSlides.find(s => s.getObjectId() === source).value;
    },
    remove() { calls.removed++; targetSlides.splice(targetSlides.indexOf(this), 1); },
    move(index) { targetSlides.splice(targetSlides.indexOf(this), 1); targetSlides.splice(index, 0, this); }
  });
  targetSlides.push(slide('old1'), slide('old2'));
  const dimensions = { getPageWidth: () => 960, getPageHeight: () => 540 };
  const source = { ...dimensions, getSlides: () => sourceSlides.slice() };
  const target = { ...dimensions, getSlides: () => targetSlides.slice(),
    appendSlide(s, mode) {
      assert.equal(mode, 'LINKED');
      calls.appended++;
      if (options.failAppendAt === calls.appended) throw new Error('Import failed');
      if (options.editDuringImport) modified = 2000;
      const copy = slide('copy' + calls.appended, s.getObjectId());
      copy.value = s.value; targetSlides.push(copy); return copy;
    },
    saveAndClose() { calls.saved++; if (options.failSave) throw new Error('Save failed'); }
  };
  const properties = { getProperty: key => saved[key] || null,
    setProperty: (key, value) => { saved[key] = value; }, deleteProperty: key => { delete saved[key]; } };
  const context = {
    console: { log() {} },
    PropertiesService: { getScriptProperties: () => properties },
    LockService: { getScriptLock: () => ({ tryLock: () => !options.locked, releaseLock: () => calls.released++ }) },
    DriveApp: { getFileById: id => ({
      getMimeType: () => 'application/vnd.google-apps.presentation', isTrashed: () => false,
      getName: () => options.teacher ? 'Lesson (Teacher edition)' : 'Student lesson',
      getOwner: () => ({ getEmail: () => id === sourceId ? 'personal@example.com' : (options.wrongOwner ? 'other@example.edu' : 'school@example.edu') }),
      getLastUpdated: () => new Date(modified)
    }) },
    SlidesApp: { SlideLinkingMode: { LINKED: 'LINKED' }, openById: id => {
      calls.opened.push(id); return id === sourceId ? source : target;
    } },
    ScriptApp: { getProjectTriggers: () => [], deleteTrigger() {}, newTrigger: () => ({ timeBased: () => ({
      everyMinutes: n => ({ create: () => { assert.equal(n, 15); calls.timers++; } })
    }) }) }
  };
  vm.createContext(context); vm.runInContext(code, context);
  return { context, calls, saved, options, targetSlides, sourceSlides,
    change: () => { modified += 1000; } };
}

test('missing config and same-file targets fail without writes', () => {
  const a = harness({ saved: { MIRROR_PAIRS: '[]' } });
  assert.throws(() => a.context.syncMirrors(), /No approved/);
  const b = harness({ pair: { targetId: sourceId } });
  assert.throws(() => b.context.syncMirrors(), /source must never/);
  assert.equal(a.calls.appended + b.calls.appended, 0);
});
test('Teacher editions, wrong owners and unapproved targets are rejected', () => {
  for (const options of [{ teacher: true }, { wrongOwner: true }, { pair: { approvedStudent: false } },
    { pair: { replaceTargetContent: false } }]) {
    const h = harness(options); assert.throws(() => h.context.syncMirrors());
    assert.equal(h.calls.appended + h.calls.removed, 0);
  }
});
test('preview reads only; first sync imports all slides and preserves source', () => {
  const h = harness(); h.context.previewMirrors(); assert.equal(h.calls.appended, 0);
  h.context.syncMirrors();
  assert.equal(h.calls.appended, 3); assert.equal(h.calls.removed, 2);
  assert.deepEqual(h.targetSlides.map(s => s.value), h.sourceSlides.map(s => s.value));
  assert.deepEqual(h.sourceSlides.map(s => s.getObjectId()), ['s0', 's1', 's2']);
  assert.ok(h.saved['MIRROR_gcse-1-1']);
});
test('unchanged source skips presentation opens and writes', () => {
  const h = harness(); h.context.syncMirrors(); h.calls.opened.length = 0;
  h.context.syncMirrors(); assert.equal(h.calls.opened.length, 0); assert.equal(h.calls.refreshed, 0);
});
test('source edit refreshes in place and preserves the target slide IDs', () => {
  const h = harness(); h.context.syncMirrors(); const ids = h.targetSlides.map(s => s.getObjectId());
  h.sourceSlides[1].value = 'intended edit'; h.change(); h.context.syncMirrors();
  assert.equal(h.targetSlides[1].value, 'intended edit');
  assert.deepEqual(h.targetSlides.map(s => s.getObjectId()), ids); assert.equal(h.calls.appended, 3);
});
test('source insert, deletion and reordering reconcile without duplicates', () => {
  const h = harness(); h.context.syncMirrors();
  h.sourceSlides.splice(1, 1); h.sourceSlides.reverse();
  h.sourceSlides.push({ getObjectId: () => 'new-slide', value: 'new' });
  h.change(); h.context.syncMirrors();
  assert.deepEqual(h.targetSlides.map(s => s.getSourceSlideObjectId()), ['s2', 's0', 'new-slide']);
});
test('failed initial import keeps original slides; retry finds partial imports', () => {
  const h = harness({ failAppendAt: 2 }); assert.throws(() => h.context.setupMirrors(), /Import failed/);
  assert.equal(h.calls.removed, 0); assert.equal(h.calls.timers, 0); assert.equal(h.saved['MIRROR_gcse-1-1'], undefined);
  delete h.options.failAppendAt; h.context.syncMirrors();
  assert.equal(h.targetSlides.length, 3); assert.equal(new Set(h.targetSlides.map(s => s.getSourceSlideObjectId())).size, 3);
});
test('save failure cannot record progress or a success checkpoint', () => {
  const h = harness({ failSave: true }); assert.throws(() => h.context.syncMirrors(), /Save failed/);
  assert.equal(h.saved['MIRROR_gcse-1-1'], undefined); assert.equal(h.saved['MIRROR_gcse-1-1_PROGRESS'], undefined);
});
test('source edit during copy prevents deletions and checkpoint', () => {
  const h = harness({ editDuringImport: true }); assert.throws(() => h.context.syncMirrors(), /Source changed/);
  assert.equal(h.calls.removed, 0); assert.equal(h.saved['MIRROR_gcse-1-1'], undefined);
});
test('180-slide bounded initial copy and later refresh make forward progress', () => {
  const h = harness({ count: 180 });
  assert.equal(h.context.syncMirrors().complete, false);
  assert.equal(h.context.syncMirrors().complete, true);
  assert.equal(h.targetSlides.length, 180); assert.equal(h.calls.appended, 180);
  h.change(); assert.equal(h.context.syncMirrors().complete, false);
  assert.equal(h.context.syncMirrors().complete, true); assert.equal(h.calls.refreshed, 180);
});
test('overlapping run skips; setup installs a timer only after success', () => {
  const h = harness({ locked: true }); assert.equal(h.context.syncMirrors().complete, false);
  assert.equal(h.calls.appended, 0);
  const a = harness(); a.context.setupMirrors(); assert.equal(a.calls.timers, 1); assert.equal(a.calls.released, 1);
});
