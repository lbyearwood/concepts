// Boundary tests: real publisher code, simulated Google/GitHub services. No credentials.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'scripts/google-apps-script/Code.gs'), 'utf8');
const catalogue = JSON.parse(fs.readFileSync(path.join(root, 'data/slide-sync.json')));

function harness(options = {}) {
  const config = structuredClone(catalogue);
  if (options.unapproved) config.decks[0].approvedStudent = false;
  const bytes = Buffer.from('%PDF-test-fixture');
  const sha = crypto.createHash('sha1').update(Buffer.concat([Buffer.from('blob ' + bytes.length + '\0'), bytes])).digest('hex');
  const saved = { GITHUB_TOKEN: 'synthetic-test-value', ...options.saved };
  const calls = { exports: 0, puts: 0, triggers: 0, reads: 0, released: false };
  const response = (code, body = {}) => ({ getResponseCode: () => code, getContentText: () => JSON.stringify(body) });
  const context = {
    console: { log() {}, error() {} },
    LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock: () => { calls.released = true; } }) },
    PropertiesService: { getScriptProperties: () => ({ getProperty: k => saved[k] || null,
      setProperty: (k, v) => { saved[k] = v; }, setProperties: values => Object.assign(saved, values) }) },
    ScriptApp: { getProjectTriggers: () => [], deleteTrigger() {},
      newTrigger: () => ({ timeBased: () => ({ everyMinutes: n => ({ create: () => { assert.equal(n, 15); calls.triggers++; } }) }) }) },
    MimeType: { PDF: 'application/pdf', GOOGLE_SLIDES: 'application/vnd.google-apps.presentation' },
    DriveApp: { getFileById: () => ({ getMimeType: () => 'application/vnd.google-apps.presentation',
      getLastUpdated: () => new Date(options.editDuringExport && calls.exports ? 2000 : 1000),
      getAs: () => { calls.exports++; if (options.exportFailure) throw new Error('Export unavailable');
        return { getBytes: () => Array.from(bytes, b => b > 127 ? b - 256 : b) }; } }) },
    Utilities: { DigestAlgorithm: { SHA_256: 'sha256', SHA_1: 'sha1' },
      computeDigest: (algorithm, value) => Array.from(crypto.createHash(algorithm).update(Buffer.from(value)).digest()),
      base64Encode: value => Buffer.from(value).toString('base64'),
      base64Decode: value => Array.from(Buffer.from(value, 'base64')),
      newBlob: value => ({ getBytes: () => Array.from(Buffer.from(value)), getDataAsString: () => Buffer.from(value).toString() }) },
    UrlFetchApp: { fetch: (url, request) => {
      if (request.method === 'get') assert.equal(request.headers.Accept, 'application/vnd.github.object+json');
      if (url.includes('/data/slide-sync.json')) return response(200, { content: Buffer.from(JSON.stringify(config)).toString('base64') });
      if (request.method === 'get') { calls.reads++; return response(200, { sha: options.identical ? sha : 'previous-sha' }); }
      calls.puts++;
      if (options.putFailure) return response(503);
      if (options.conflict && calls.puts === 1) return response(409);
      return response(200);
    } }
  };
  vm.createContext(context); vm.runInContext(source, context);
  return { context, calls, saved };
}
test('unchanged source performs no export or upload', () => {
  const h = harness({ saved: { 'SYNC_gcse-1-1_MODIFIED': '1000' } });
  h.context.syncSlides(); assert.equal(h.calls.exports, 0); assert.equal(h.calls.puts, 0); assert.ok(h.calls.released);
});
test('initial upload checkpoints only confirmed success; next run skips', () => {
  const h = harness(); h.context.syncSlides(); h.context.syncSlides();
  assert.equal(h.calls.exports, 1); assert.equal(h.calls.puts, 1); assert.equal(h.saved['SYNC_gcse-1-1_MODIFIED'], '1000');
});
test('forced recovery still avoids an identical GitHub commit', () => {
  const h = harness({ identical: true }); h.context.forceSyncSlides();
  assert.equal(h.calls.exports, 1); assert.equal(h.calls.puts, 0); assert.equal(h.saved['SYNC_gcse-1-1_MODIFIED'], '1000');
});
test('export failure neither uploads nor advances source checkpoint nor installs trigger', () => {
  const h = harness({ exportFailure: true }); assert.throws(() => h.context.setup(), /Sync failed/);
  assert.equal(h.calls.puts, 0); assert.equal(h.calls.triggers, 0); assert.equal(h.saved['SYNC_gcse-1-1_MODIFIED'], undefined);
});
test('failed GitHub write retries next run with no false checkpoint', () => {
  const h = harness({ putFailure: true });
  assert.throws(() => h.context.syncSlides(), /Sync failed/); assert.throws(() => h.context.syncSlides(), /Sync failed/);
  assert.equal(h.calls.puts, 2); assert.equal(h.saved['SYNC_gcse-1-1_MODIFIED'], undefined);
});
test('one conflict is retried with a fresh read', () => {
  const h = harness({ conflict: true }); h.context.syncSlides(); assert.equal(h.calls.puts, 2); assert.equal(h.calls.reads, 2);
});
test('source changing during export is deferred', () => {
  const h = harness({ editDuringExport: true }); assert.throws(() => h.context.syncSlides(), /Sync failed/);
  assert.equal(h.calls.puts, 0); assert.equal(h.saved['SYNC_gcse-1-1_MODIFIED'], undefined);
});
test('unapproved source rejected before Google access', () => {
  const h = harness({ unapproved: true }); assert.throws(() => h.context.syncSlides(), /unapproved/); assert.equal(h.calls.exports, 0);
});
test('setup creates a trigger only after an initial successful sync', () => {
  const h = harness(); h.context.setup(); assert.equal(h.calls.puts, 1); assert.equal(h.calls.triggers, 1);
});
