/**
 * CSRevision GCSE 1.1 — Google Slides → GitHub automatic publishing.
 *
 * Run setup() ONCE after adding GITHUB_TOKEN under Script Properties.
 * The script runs as your Google account. It does not change the slide deck.
 *
 * The approved student deck is converted to PDF and written to GitHub.
 * GitHub Actions then converts it to WebP slides and publishes CSRevision.
 */

const SLIDE_SYNC = Object.freeze({
  googlePresentationId: '1cc7zHgWpVhG7WMHJMREHOcYh988dZ2Dyuxm4taaeAUo',
  githubOwner: 'lbyearwood',
  githubRepository: 'concepts',
  githubBranch: 'main',
  githubPdfPath: 'assets/slide-decks/1-1/bootstrap.pdf',
  lastHashKey: 'GCSE_1_1_LAST_UPLOADED_SHA256',
  lastModifiedKey: 'GCSE_1_1_LAST_UPLOADED_MODIFIED'
});

/**
 * One-time setup: check the token, install one 30-minute trigger and
 * upload the current presentation immediately.
 */
function setup() {
  requireGithubToken_();
  for (const trigger of ScriptApp.getProjectTriggers()) {
    if (trigger.getHandlerFunction() === 'syncSlides') {
      ScriptApp.deleteTrigger(trigger);
    }
  }
  ScriptApp.newTrigger('syncSlides').timeBased().everyMinutes(30).create();
  console.log('Installed the 30-minute slide synchronisation trigger.');
  syncSlides();
}

/**
 * Run manually at any time to publish an updated version without waiting.
 * Re-running it with identical slides does not create another Git commit.
 */
function syncSlides() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) {
    console.log('An earlier slide update is already running.');
    return;
  }

  try {
    const token = requireGithubToken_();
    const deck = DriveApp.getFileById(SLIDE_SYNC.googlePresentationId);
    const properties = PropertiesService.getScriptProperties();
    const modified = String(deck.getLastUpdated().getTime());
    // Avoid unnecessary PDF exports (and commits if PDF metadata changes).
    if (modified === properties.getProperty(SLIDE_SYNC.lastModifiedKey)) {
      console.log('The Google Slides file has not changed; no export needed.');
      return;
    }
    const pdf = deck.getAs(MimeType.PDF);
    const bytes = pdf.getBytes();

    // Fail before sending anything if Google did not export a PDF.
    if (bytes.length < 5 ||
        (bytes[0] & 255) !== 37 ||
        (bytes[1] & 255) !== 80 ||
        (bytes[2] & 255) !== 68 ||
        (bytes[3] & 255) !== 70 ||
        (bytes[4] & 255) !== 45) {
      throw new Error('Google did not return a valid PDF. Nothing was uploaded.');
    }
    if (bytes.length > 20 * 1024 * 1024) {
      throw new Error('PDF is over the 20 MB pilot limit. No upload attempted.');
    }

    const hash = sha256_(bytes);
    if (hash === properties.getProperty(SLIDE_SYNC.lastHashKey)) {
      properties.setProperty(SLIDE_SYNC.lastModifiedKey, modified);
      console.log('Export is identical to the previous PDF; GitHub update skipped.');
      return;
    }

    const url = githubContentsUrl_();
    const headers = {
      Authorization: 'Bearer ' + token,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'CSRevision-Google-Apps-Script'
    };

    // GitHub needs the current file SHA when replacing an existing PDF.
    // On a rare concurrent-edit conflict, fetch a fresh SHA and retry once.
    const content = Utilities.base64Encode(bytes);
    let uploaded = false;
    for (let attempt = 1; attempt <= 2; attempt++) {
      const getResult = UrlFetchApp.fetch(
        url + '?ref=' + encodeURIComponent(SLIDE_SYNC.githubBranch),
        { method: 'get', headers, muteHttpExceptions: true }
      );
      const getStatus = getResult.getResponseCode();
      if (getStatus !== 200 && getStatus !== 404) {
        failGithub_('read', getResult);
      }

      const body = {
        message: 'Update GCSE 1.1 student slides from Google Apps Script',
        branch: SLIDE_SYNC.githubBranch,
        content
      };
      if (getStatus === 200) {
        const file = JSON.parse(getResult.getContentText());
        if (!file.sha) throw new Error('GitHub did not return the existing file SHA.');
        body.sha = file.sha;
      }

      const putResult = UrlFetchApp.fetch(url, {
        method: 'put',
        headers,
        contentType: 'application/json',
        payload: JSON.stringify(body),
        muteHttpExceptions: true
      });
      const putStatus = putResult.getResponseCode();
      if (putStatus === 200 || putStatus === 201) {
        uploaded = true;
        break;
      }
      if (putStatus !== 409 || attempt === 2) {
        failGithub_('write', putResult);
      }
      console.log('GitHub file changed concurrently; retrying with its latest SHA.');
    }

    if (!uploaded) throw new Error('GitHub did not confirm the PDF update.');
    properties.setProperties({
      [SLIDE_SYNC.lastHashKey]: hash,
      [SLIDE_SYNC.lastModifiedKey]: modified
    });
    console.log('Uploaded revised GCSE 1.1 PDF to GitHub. GitHub Actions will rebuild the slides.');
  } finally {
    lock.releaseLock();
  }
}

function requireGithubToken_() {
  const token = PropertiesService.getScriptProperties().getProperty('GITHUB_TOKEN');
  if (!token || !token.trim()) {
    throw new Error('Add the GITHUB_TOKEN property in Apps Script Project Settings before running setup().');
  }
  return token.trim();
}

function githubContentsUrl_() {
  // All path segments are constants, not user input.
  const path = SLIDE_SYNC.githubPdfPath.split('/').map(encodeURIComponent).join('/');
  return 'https://api.github.com/repos/' +
    SLIDE_SYNC.githubOwner + '/' + SLIDE_SYNC.githubRepository +
    '/contents/' + path;
}

function sha256_(bytes) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, bytes)
    .map(byte => ('0' + (byte & 255).toString(16)).slice(-2))
    .join('');
}

function failGithub_(operation, result) {
  const status = result.getResponseCode();
  let reason = 'Unspecified GitHub API error';
  try {
    reason = JSON.parse(result.getContentText()).message || reason;
  } catch (ignored) {
    // Do not print headers, bearer tokens or request payloads to logs.
  }
  throw new Error('GitHub ' + operation + ' failed (HTTP ' + status + '): ' + reason);
}
