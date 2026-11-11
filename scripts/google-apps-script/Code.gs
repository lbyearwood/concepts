/** CSRevision: read approved student Slides; upload PDFs, never edit Google files.
 * Install appsscript.json too. GITHUB_TOKEN belongs only in Script Properties.
 * A successful upload is not proof of a successful Pages deployment.
 */
const SLIDE_SYNC = Object.freeze({
  owner: 'lbyearwood', repository: 'concepts', branch: 'main',
  configPath: 'data/slide-sync.json', intervalMinutes: 15,
  runBudgetMs: 240000, maxUploadsPerRun: 6, maxPdfBytes: 10 * 1024 * 1024
});

function setup() {
  // Prove access/export/upload first; failure must not install a new trigger.
  syncSlides();
  stopSync();
  ScriptApp.newTrigger('syncSlides').timeBased().everyMinutes(SLIDE_SYNC.intervalMinutes).create();
  console.log('Installed one 15-minute trigger. Check GitHub Actions and the live viewer.');
}

function stopSync() {
  for (const trigger of ScriptApp.getProjectTriggers()) {
    if (trigger.getHandlerFunction() === 'syncSlides') ScriptApp.deleteTrigger(trigger);
  }
}

function syncSlides() { runSync_(false); }
// Recovery/on-demand export; identical GitHub PDF still produces no commit.
function forceSyncSlides() { runSync_(true); }

function runSync_(force) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) throw new Error('Another sync is running; try again later.');
  try {
    const started = Date.now();
    const props = PropertiesService.getScriptProperties();
    const token = (props.getProperty('GITHUB_TOKEN') || '').trim();
    if (!token) throw new Error('Set GITHUB_TOKEN in Script Properties, never in source code.');
    const headers = { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28' };
    const configResult = githubGet_(SLIDE_SYNC.configPath, headers);
    if (configResult.getResponseCode() !== 200) failGithub_('configuration read', configResult);
    const configFile = JSON.parse(configResult.getContentText());
    const config = JSON.parse(Utilities.newBlob(Utilities.base64Decode(configFile.content)).getDataAsString());
    const decks = validateDecks_(config);
    let cursor = Number(props.getProperty('SYNC_CURSOR') || 0) % decks.length;
    if (!Number.isInteger(cursor) || cursor < 0) cursor = 0;
    let uploads = 0;
    const failed = [];
    for (let checked = 0; checked < decks.length; checked++) {
      if (Date.now() - started > SLIDE_SYNC.runBudgetMs || uploads >= SLIDE_SYNC.maxUploadsPerRun) {
        console.log('Batch budget reached; next trigger resumes at the saved cursor.');
        break;
      }
      const deck = decks[cursor];
      try {
        if (syncDeck_(deck, props, headers, force)) uploads++;
      } catch (error) {
        console.error(deck.key + ': ' + error.message);
        failed.push(deck.key);
      }
      cursor = (cursor + 1) % decks.length;
      props.setProperty('SYNC_CURSOR', String(cursor));
    }
    if (failed.length) throw new Error('Sync failed for ' + failed.join(', ') + '; checkpoints retained for retry. See execution log.');
  } finally { lock.releaseLock(); }
}

function validateDecks_(config) {
  if (!Array.isArray(config.decks) || !config.decks.length || config.decks.length > 100) {
    throw new Error('Expected 1–100 explicitly approved student decks.');
  }
  const keys = new Set(), paths = new Set();
  for (const deck of config.decks) {
    if (deck.approvedStudent !== true || !/^[a-z0-9-]+$/.test(deck.key || '') ||
        !/^[A-Za-z0-9_-]{20,}$/.test(deck.googleFileId || '') ||
        !/^assets\/slide-decks\/[a-z0-9-]+\/bootstrap\.pdf$/.test(deck.sourcePdf || '') ||
        deck.output !== deck.sourcePdf.slice(0, -'/bootstrap.pdf'.length) ||
        !deck.title || keys.has(deck.key) || paths.has(deck.sourcePdf)) {
      throw new Error('Invalid or unapproved student deck configuration; no exports attempted.');
    }
    keys.add(deck.key); paths.add(deck.sourcePdf);
  }
  return config.decks;
}

function syncDeck_(deck, props, headers, force) {
  const prefix = 'SYNC_' + deck.key + '_';
  const file = DriveApp.getFileById(deck.googleFileId);
  if (file.getMimeType() !== MimeType.GOOGLE_SLIDES) throw new Error('Source must be a native Google Slides presentation.');
  const modified = String(file.getLastUpdated().getTime());
  if (!force && modified === props.getProperty(prefix + 'MODIFIED')) {
    console.log(deck.key + ': unchanged; no PDF export or upload.');
    return false;
  }
  const bytes = file.getAs(MimeType.PDF).getBytes();
  if (bytes.length < 5 || bytes.length > SLIDE_SYNC.maxPdfBytes ||
      [37, 80, 68, 70, 45].some((value, i) => (bytes[i] & 255) !== value)) {
    throw new Error('Invalid PDF or over the 10 MiB limit; no upload.');
  }
  if (String(file.getLastUpdated().getTime()) !== modified) {
    throw new Error('Source changed during export; next trigger will retry.');
  }
  const hash = digest_(Utilities.DigestAlgorithm.SHA_256, bytes);
  const blobPrefix = Utilities.newBlob('blob ' + bytes.length + '\0').getBytes();
  const gitSha = digest_(Utilities.DigestAlgorithm.SHA_1, blobPrefix.concat(bytes));
  for (let attempt = 0; attempt < 2; attempt++) {
    const result = githubGet_(deck.sourcePdf, headers);
    const status = result.getResponseCode();
    if (status !== 200 && status !== 404) failGithub_('PDF read', result);
    const remote = status === 200 ? JSON.parse(result.getContentText()) : null;
    if (remote && !remote.sha) throw new Error('GitHub did not return a file SHA.');
    if (remote && remote.sha === gitSha) {
      checkpoint_(props, prefix, modified, hash);
      console.log(deck.key + ': GitHub PDF already identical; no commit.');
      return false;
    }
    const body = { message: 'Update approved student slides: ' + deck.key,
      branch: SLIDE_SYNC.branch, content: Utilities.base64Encode(bytes) };
    if (remote) body.sha = remote.sha;
    const put = UrlFetchApp.fetch(githubUrl_(deck.sourcePdf), { method: 'put', headers,
      contentType: 'application/json', payload: JSON.stringify(body), muteHttpExceptions: true });
    const putStatus = put.getResponseCode();
    if (putStatus === 200 || putStatus === 201) {
      checkpoint_(props, prefix, modified, hash);
      console.log(deck.key + ': PDF uploaded. Verify the subsequent Pages workflow; upload is not deployment.');
      return true;
    }
    if (putStatus !== 409 || attempt === 1) failGithub_('PDF write', put);
  }
  throw new Error('GitHub did not confirm the upload.');
}

function checkpoint_(props, prefix, modified, hash) {
  props.setProperties({ [prefix + 'MODIFIED']: modified, [prefix + 'SHA256']: hash });
}
function digest_(algorithm, bytes) {
  return Utilities.computeDigest(algorithm, bytes).map(b => ('0' + (b & 255).toString(16)).slice(-2)).join('');
}
function githubUrl_(path) {
  return 'https://api.github.com/repos/' + SLIDE_SYNC.owner + '/' + SLIDE_SYNC.repository +
    '/contents/' + path.split('/').map(encodeURIComponent).join('/');
}
function githubGet_(path, headers) {
  return UrlFetchApp.fetch(githubUrl_(path) + '?ref=' + encodeURIComponent(SLIDE_SYNC.branch),
    { method: 'get', headers: { ...headers, Accept: 'application/vnd.github.object+json' },
      muteHttpExceptions: true });
}
function failGithub_(operation, result) {
  // Never log response bodies, headers, tokens or base64 source content.
  throw new Error('GitHub ' + operation + ' failed (HTTP ' + result.getResponseCode() + ').');
}
