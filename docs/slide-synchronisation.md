# Google Slides synchronisation decision and pilot

Checked 11 November 2026. Scope: the approved **student** deck for GCSE 1.1.
The original Google presentation was not edited, renamed, moved or reshared.

## Latest intended arrangement: one school-owned presentation

The user subsequently clarified that students can access school-owned Google
Slides but not personally owned presentations. This is a user-reported access
distinction, not a confirmed network-policy diagnosis. The intended arrangement
is **one school-owned lesson, shared to the personal account as Editor, with a
shortcut in the personal My Drive**. Both accounts edit the same file. CSRevision
would embed that school-owned presentation. No synchronisation script, separate
mirror, PDF export or slide-image conversion is needed for that arrangement.

Test the school's external-editor policy and actual student access to the
embedded lesson before changing the working website. A shortcut does not change
ownership or grant access. A copy made by the personal account would have the
wrong ownership for this goal. Google does not support transferring a personal
file directly into school-account ownership; create the intended school-owned
file from the school account if a suitable one does not already exist. Preserve
the original personal source and other files/sharing. No school-owned migration,
new sharing permission or student-device test has been carried out here.

The export/Apps Script route below remains a prepared **fallback**. Keep the
existing working self-hosted viewer until the school-owned route is verified;
do not activate the pending exporter just to satisfy a now-unnecessary setup
step. Retiring unused credentials/projects is a separate scoped action.

Official references: [shortcuts point to the same original file](https://support.google.com/drive/answer/9700156?hl=en),
[school external-sharing restrictions](https://support.google.com/drive/answer/7166529?hl=en),
[personal-to-school ownership transfer restrictions](https://support.google.com/drive/answer/2494892?hl=en)
and [published Slides updates/embedding](https://support.google.com/docs/answer/183965?hl=en).

## Cost requirement

The user requires **£0 in additional running costs for slide synchronisation**
(11 November 2026). Keep existing account plans and domain arrangements separate
from this new automation. Do not enable Google Cloud billing, paid API quota
increases, paid/larger Actions runners, metered storage, paid trials or new
subscriptions. A service's free allowance does not authorise enabling a billable
account that can charge for overages. No R2 bucket or other new hosting service
has been created for this pilot.

The existing repository is public. Standard GitHub-hosted compute in public
repositories remains free under the current [Actions billing rules](https://docs.github.com/en/billing/concepts/product-billing/github-actions).
The workflow uses the standard Ubuntu runner and skips the entire job if the
repository becomes private. Pages artifacts have a one-day retention period;
no extra build cache is introduced. This workflow guard is separate from provider spending controls. A read-only
Edge check of GitHub Budgets and alerts confirmed an existing account-wide
**Actions $0.00 budget with Usage blocked**. It was preserved, not raised or
replaced. Google billing and unrelated provider settings were not audited or
changed. [Budget controls](https://docs.github.com/en/billing/how-tos/set-up-budgets)
explain the hard-stop option. Recheck that this zero-spend budget remains in
place before increasing the catalogue; free compute and artifact storage are
different allowances.

Google's current Apps Script quotas stop execution when a limit is reached.
[Standard Drive API use](https://developers.google.com/workspace/drive/api/guides/limits#pricing)
has no additional charge, but Google has announced [paid above-standard API usage](https://developers.google.com/workspace/tools-safety).
Do not enable that paid capacity. Stay within free quotas; if a limit is reached,
preserve the last published slides, report it and reduce/batch work or pause the
affected operation rather than buying more capacity. Recheck provider terms
before a large rollout; current free allowances are not an unlimited guarantee.

Measured pilot assets: 56 WebP images total **2,433,592 bytes**; source PDF
**488,718 bytes**. Sixty similarly sized lessons would be approximately **175 MB**
of PDF/image assets, before the rest of the site and Git history. This is an
estimate from one deck, not a measured full-course inventory. The published-site
limit is currently [1 GB](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits).
Unchanged Google decks already skip export/upload, and unchanged PDFs skip
rendering. Repeated binary history and complete-site artifact/deployment work
are the longer-term growth points. Batch changes and measure the real catalogue
before choosing a new delivery architecture; do not migrate to paid storage.

## Decision

Use **A: an owner-run Google Apps Script → GitHub PDF → Actions → WebP → Pages**.
Keep the working self-hosted viewer. Use a 15-minute metadata poll to leave
conversion/deployment time inside the desired approximately 30-minute update
window. This is a target, not a timing guarantee from either provider.

The remaining account setup is the GitHub fine-grained token and Google consent
for the script. The repository implementation does **not** establish that these
have happened. A connector being able to export the deck does not authorise an
independent Apps Script project.

## Options reviewed

| Option | Authentication/security | Complexity and reliability | Cost and maintenance | Decision |
| --- | --- | --- | --- | --- |
| A. Apps Script owner account | Explicit Drive read-only, external requests and trigger management; repository-only fine-grained GitHub token in Script Properties | Smallest addition to existing code. Uses documented Google file conversion and GitHub Contents API. Account/organisation policy can block consent or triggers. | No additional hosting subscription for this pilot within current quotas; token expiry and execution failures need attention. | Preferred pilot. Prepared and tested with simulated service boundaries; account activation remains unverified. |
| B. Actions + Drive API | Service account granted Viewer on the exact approved decks. Prefer GitHub OIDC → Workload Identity Federation → service-account impersonation, with read-only Drive scope. Avoid a downloaded service-account JSON key. | Reliable documented export, but Cloud project, APIs, pool/provider, trust conditions and deck sharing add substantial setup. A Cloud IAM role alone does not grant Drive file access. School external-sharing restrictions may block the service account. | No dedicated compute service needed beyond Actions; Cloud policies/quotas still apply. More IAM configuration to maintain. GitHub cron can be delayed/dropped and public-repo schedules disable after 60 days without repository activity. | Best fallback when school administrators support it. Not provisioned or account-tested here. |
| C. Anonymous published content | Public player needs no sign-in; that is separate from authenticated file export | Cookie-free test: original `/export/pdf` returned **401**, actual published `/pub` returned **200 HTML**, not PDF. Official Drive export and Slides thumbnail methods require OAuth. No documented anonymous bulk export route was established. Scraping player HTML/internal image URLs adds an unsupported dependency. | Low apparent setup, high breakage risk for undocumented retrieval. | Do not use as the production sync mechanism. Public player can remain an optional backup. |
| D. Workers, Power Automate or other intermediary | Still needs Google credentials/consent; Workers cron does not confer Drive access | Workers can schedule work but still need a PDF exporter, rendering runtime and storage or a GitHub bridge. Power Automate's Drive connector lists file-content operations, not a complete native Slides→PDF→WebP publishing pipeline. Apps Script web app still needs owner consent and adds an endpoint to secure. | Extra deployment, secrets, logs and potentially paid features/storage. Existing DNS on Cloudflare does not supply this pipeline. Exact tenant licensing was not checked. | No advantage for this pilot. No service or subscription created. |
| E. On-demand/manual | Same credentials for an on-demand Apps Script; uploading a PDF uses ordinary authorised GitHub access | `forceSyncSlides()` exports on demand. Actions **Run workflow** rerenders the repository PDF only, and can recover a failed deployment without a new Google edit. Manual PDF upload is also possible. | Lowest scheduling dependency but requires an action per update. | Recovery/fallback. Does not meet automatic-update success criteria. |

These comparisons are engineering judgements based on the tested pilot and the
official interfaces below. A school network test and tenant policy review have
not been performed.

## Implementation and safeguards

- `data/slide-sync.json` is the single export/render allowlist. Only 1.1 is
  enabled. `approvedStudent: true` records a checked approval; it cannot create
  user consent or technically restrict OAuth permissions.
- The script downloads this configuration at each run. It checks source MIME
  type and modification time before exporting. Unchanged files have no export,
  PDF write or resulting deployment. A PDF already identical to the GitHub blob
  also has no new commit, including when local Script Properties were lost.
- Source edits during export are deferred. Invalid/oversized exports are rejected.
  Only a confirmed GitHub write or identical remote PDF advances a per-deck
  checkpoint. HTTP failures retain that checkpoint for retry; one 409 conflict
  gets a fresh file SHA and one bounded retry. Trigger failures surface in Apps
  Script Executions and its trigger failure notifications.
- `setup()` attempts a successful initial sync before replacing/installing one
  trigger. `stopSync()` removes only this project's `syncSlides` triggers.
- Python checks the input SHA-256, rendering profile and referenced image
  hashes before opening the PDF. Identical inputs skip rendering. PDF metadata
  changes with identical images keep `updatedAt`, avoiding pointless viewer
  cache invalidation. A missing/corrupt image forces repair.
- All pages are rendered and image-validated before a same-filesystem staged
  directory replacement. A failed install restores the previous directory.
  A failed workflow never uploads a Pages artifact or deploys it. The last
  successful Pages release remains available. Tests do not deliberately break
  the live site.
- Limits: 10 MiB PDF, 180 slides and 20 million rendered pixels per page.
  The Drive API's documented `files.export` limit is 10 MB; Apps Script's
  conversion also has quotas and may reject an export below our own guard.
- Pages Source is **GitHub Actions**, removing the competing branch build.
  The workflow serialises deployments, checks out current `main`, tests before
  rendering, commits generated assets without force-pushing and refuses to
  publish when `main` has advanced. Re-run the failed workflow if no newer run
  completes. `assets/site-revision.txt` identifies the packaged revision.

An uploaded PDF is **not** a deployment receipt. If rendering/deployment fails
after an upload, the source checkpoint correctly means “PDF uploaded”, and the
old site remains live. Fix the reported issue and use **Run workflow** to retry
that PDF; another Google edit is unnecessary. `forceSyncSlides()` is available
when the GitHub PDF itself needs restoring or an export needs repeating.

## Account setup and exact access

Follow [the setup guide](../scripts/google-apps-script/README.md). Install both
`Code.gs` and `appsscript.json`; copying code alone can infer broader scopes.
No Advanced Drive service is required.

The explicit Google scope `drive.readonly` can **read/download files across
the consenting account's Drive**, subject to that account's access. It cannot
edit/delete/share them. The code only reads the configured student IDs; that
allowlist is a code restriction, not a Google-enforced file-level grant.
The other scopes permit external HTTP requests and managing this project's
installable triggers. Avoid adding this script to the older bulk publication
project, which has different permissions and an unfinished security handoff.

The fine-grained GitHub PAT must select only `lbyearwood/concepts`, with
**Contents: read and write** (Metadata read is inherent). This grants repository
content write access, not a path-only capability. Do not grant Workflows,
Administration, account-wide repositories or other extra permissions.
Store the token only in the owner's Script Properties. Project editors can
potentially retrieve it, so keep project editing private. Use an appropriate
expiry and rotate it before expiry. Do not paste credentials into chat, logs,
source control, screenshots or the site. A GitHub App could replace a PAT but
would add an installation/private-key flow, so it does not simplify this pilot.

School administrators may require approval for OAuth, Apps Script or external
requests. Follow their process. Do not bypass a security warning or use an
unapproved alternate account. WIF is a possible administrator-supported route,
not a way around school restrictions.

## Scaling and adding a topic

After verifying the exact main student deck and its existing public approval:

```sh
python scripts/add-slide-deck.py --topic 1.2 --google-file-id NATIVE_STUDENT_DECK_ID --approved-student
python scripts/build-course.py
python scripts/build-course.py --check
```

The helper derives title, output path and stable key from the existing course
catalogue. Review the one new configuration entry and generated topic page.
Only the topic and Google file ID are supplied, plus acknowledgement of the
already settled approval. Commit/push through the normal release path.
The same Apps Script picks up the entry; no new project/credential/trigger is
needed. The page uses the existing self-hosted viewer and its relative manifest.
If the PDF is not yet present, deployment fails safely until the first approved
export arrives; the previously published site remains intact.

A four-minute soft run budget, six successful uploads per run and saved cursor
limit large batches. The next trigger resumes the scan; failures in one deck
do not prevent checking later entries in that batch. A provider call can still
hit Google's hard runtime limit; confirmed earlier per-deck checkpoints survive.
Normal edits to one/few lessons are the timing target. Simultaneous changes to
all 60 decks can take several trigger cycles, with longer queue/deployment time.
The 60-deck load has not been production-tested. Google's current six-minute
execution, conversion, trigger-runtime and URL Fetch quotas must be monitored.

Rendering replaces the complete ordered slide list, so added, removed,
reordered and edited pages are reflected in the next manifest. No slide numbers
are permanently bound to old page IDs. An already-open viewer stays on its
loaded manifest until reopened; this avoids changing a lesson mid-view.

Measure storage before bulk rollout. GitHub Pages has a 1 GB published-site
limit and a 100 GB/month soft bandwidth limit. Repeated binary revisions also
grow Git history. External object storage becomes useful if measured growth or
traffic warrants it; migrating assets now would add unnecessary infrastructure.

## Quality and feature trade-offs

Text, diagrams and images retain the current 1.7× PDF rendering, RGB and WebP
quality 87. The unchanged 56 pilot images were byte-identical when re-rendered
locally with the pinned tools; the viewer controller was retained. Final visual QA found that the image
height could exceed its flex/grid frame and clip the lower slide content. A
small positioning fix now contains the complete slide; local 1400×579, 390×844
and 844×390 checks confirm image/dialog bounds, with no document overflow. Raster
slides lack selectable text and semantic slide contents for screen readers.
Zoom quality is finite. PDF rendering does not preserve animations, progressive
reveals, transitions, audio, embedded video or clickable slide interactions.
The optional original Google player can retain these for students who can
access Google; it cannot solve their access restrictions. For an essential
video/interaction, author a separately approved accessible web resource rather
than claiming image export preserves it. No additional media were published.

## Verification status

**Working before this investigation:** the 56-image self-hosted 1.1 viewer,
navigation/keyboard/fullscreen code and PDF conversion; existing successful
Actions runs did not prove Google synchronisation.

**Tested in this investigation:** no-cookie export/player responses; authorised
connector metadata and PDF export of the exact student deck; eight Python tests
covering unchanged parser skip, ordering/add/removal, metadata-only changes,
invalid exports, mid-render failure, install rollback, missing-image repair and
approval/path guards; nine Node service-boundary tests covering publisher skip,
successful upload/checkpoint, identical recovery, export failure/setup gate,
GitHub failure/retry, 409 handling, edit-during-export, approval guard and trigger
setup. These Node tests are simulations, not execution inside Google's runtime.
The real 56-slide repository PDF rendered, then skipped on the second run.
Both existing site generators passed `--check`. Custom Pages release 5f98a0a
passed run 43103780643; the live revision marker matches. Live Back/Next and
ArrowRight passed, and the rendered image is a CSRevision URL with no iframe
or relevant live console warnings. A local automated fullscreen request was
denied by Edge; the original fullscreen code is preserved and manual fullscreen
remains unverified in this session. Release and Edge evidence are in the
existing project QA record.

**Prepared in the Google account:** a dedicated native `CSRevision Slide Sync`
project was created in Planning / 5. Workspace tools. Code.gs was saved, reloaded
and copied back exactly; the saved explicit scope manifest was read back. Drive
metadata confirms the intended folder and no sharing. No token was entered and
no function/consent flow was run. The private project link is in the workspace
policy and task handover, rather than this public repository.

**Still required to prove automatic sync:** private GitHub token, explicit
Google consent, successful `setup()` and a real
scheduled execution. Then the user makes a controlled edit to the original;
observe source modification → PDF commit → successful Pages run → changed image
on CSRevision, followed by another trigger with no new export/commit. The agent
has not made a test edit to the original. Automatic propagation and the ~30-minute
target remain unverified until that test. No original deck/sharing was changed.

## Official references checked

- [Apps Script file conversion](https://developers.google.com/apps-script/reference/drive/file#getAs(String)), [Drive read-only support](https://developers.google.com/apps-script/reference/drive/drive-app#getFileById(String)), [explicit OAuth scopes](https://developers.google.com/apps-script/concepts/scopes), [installable triggers](https://developers.google.com/apps-script/guides/triggers/installable) and [quotas](https://developers.google.com/apps-script/guides/services/quotas).
- [Drive API PDF export and authorisation](https://developers.google.com/workspace/drive/api/reference/rest/v3/files/export) and [Slides thumbnails: OAuth and expiring URLs](https://developers.google.com/workspace/slides/api/reference/rest/v1/presentations.pages/getThumbnail).
- [GitHub Contents API](https://docs.github.com/en/rest/repos/contents#create-or-update-file-contents), [fine-grained PAT creation](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens), [scheduled workflow limits](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule) and [Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits).
- [Google WIF for deployment pipelines](https://docs.cloud.google.com/iam/docs/workload-identity-federation-with-deployment-pipelines) and [Google's GitHub authentication action](https://github.com/google-github-actions/auth). Restrict OIDC trust to numeric repository/owner identities and the intended branch/workflow; grant the service account Viewer on approved Drive files rather than broad domain delegation.
- [Cloudflare Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/) and [Microsoft's Google Drive connector operations](https://learn.microsoft.com/en-us/connectors/googledrive/).
