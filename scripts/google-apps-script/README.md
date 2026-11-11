# Activate CSRevision Slide Sync

The repository code is prepared; account activation is **not verified**.
See [the decision, tests and limitations](../../docs/slide-synchronisation.md).
Only the approved GCSE 1.1 student presentation is configured initially.
The script reads the original; it does not edit or reshare it.

## 1. Create the limited GitHub credential yourself

In [GitHub fine-grained personal access tokens](https://github.com/settings/personal-access-tokens/new),
use name `CSRevision slide sync`, owner `lbyearwood`, **Only select repositories**
→ `concepts`, and **Contents: Read and write**. Keep Metadata read, which GitHub
requires. No other permissions are needed. Choose an appropriate expiry and
record a renewal reminder in your own credential-management process.

The token can write repository contents across this one repository, not only
the PDF path. Do not paste it into chat, commit it or grant access to all repos.
Create, enter and save the token yourself; the agent does not need to see it.

## 2. Create the private owner-run project

Use the Google account that can access the approved native student deck.
At [Apps Script](https://script.google.com/home), create a standalone project
named `CSRevision Slide Sync`. Keep it separate from the earlier bulk-publication
project and the Quiz maker. Store this operational project in the existing
Planning / **5. Workspace tools** folder, not the policy library.

Copy [Code.gs](Code.gs) into its Code.gs file. In Project Settings, enable
**Show appsscript.json manifest file in editor**. Replace that manifest with
[appsscript.json](appsscript.json), then save both files.

In Project Settings → Script Properties, add `GITHUB_TOKEN` with your token.
Keep project edit access private; editors could retrieve Script Properties.
No web app deployment, Advanced Drive service, Cloud service account or
separate GitHub Google credential is needed for this route.

## 3. Authorise and start

Run `setup()` once and review Google's consent screen yourself. The explicit
manifest requests **Drive read-only** (read/download across your accessible
Drive, not file-limited), external HTTP requests, and this project's trigger
management. It does not request Drive write/delete/share access. The code's
student-deck allowlist is narrower than the Google permission.

If Google or school policy blocks the project, use the administrator's approval
process. Do not bypass a warning. Any unverified-app/security warning requires
the user's own review; the agent must not click through it.

`setup()` checks configuration, source access and initial export/upload before
installing one **15-minute** `syncSlides` trigger. Re-running setup replaces
only this handler's triggers. Check Executions for success and Triggers for
exactly one time-driven `syncSlides`. Run `stopSync()` to stop this project's
timer; remove/revoke the GitHub token separately if retiring it.

## 4. Verify the complete path

1. In Executions, confirm initial upload or “GitHub PDF already identical”.
2. In [GitHub Actions](https://github.com/lbyearwood/concepts/actions/workflows/sync-lesson-slides.yml),
   confirm the resulting **Synchronise lesson slides and publish CSRevision** run
   succeeds. If the initial PDF was identical, use **Run workflow** once.
3. Open [topic 1.1](https://csrevision.org.uk/courses/gcse-computer-science/1-1-variables-constants-data-types-casting.html),
   click Slides and test Back/Next/fullscreen. Its images must come from CSRevision.
4. Make a small intended edit to the original student presentation yourself.
   Wait for the scheduled trigger, then verify the PDF commit, successful Pages
   run and changed slide after reopening the lightbox. Record elapsed time.
5. Let the next unchanged trigger run. It should log “unchanged; no PDF export
   or upload” with no new PDF commit or resulting deployment.

The desired ~30-minute turnaround includes polling, export, Actions queue and
deployment. Provider delays and a bulk backlog can take longer.

## Recovery and more decks

Inspect Apps Script **Executions** and GitHub Actions failures. Export/upload
failure retains the source checkpoint and retries on a subsequent poll. After
an uploaded PDF reaches GitHub, a conversion/deployment failure is retried with
GitHub **Run workflow**; it does not require editing the original. The last
successful release remains live. `forceSyncSlides()` requests another export
even when the Google modified time is unchanged, but an identical GitHub blob
still creates no commit. A revoked/expired token requires replacement in Script
Properties; it must not be copied to a repository secret or public code.

For another exact student deck with existing publication approval, run the
two-input helper in [the scaling instructions](../../docs/slide-synchronisation.md#scaling-and-adding-a-topic).
It adds one entry to `data/slide-sync.json`; the same script picks it up without
another project or trigger. Confirm source identity and approval before adding
it. No Teacher editions, revision cards or archives. Bulk 60-deck operation is
prepared but not load-tested; large initial exports resume across trigger runs.
