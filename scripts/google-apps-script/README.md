# Google Apps Script: GCSE 1.1 slide synchronisation

**Purpose:** Update the student-facing slideshow on https://csrevision.org.uk/ whenever
its approved Google Slides source changes, without asking students to open Google.

This Apps Script runs under the account that sets it up. It exports the approved
student presentation as PDF and uses GitHub's Contents API to replace the PDF
stored at `assets/slide-decks/1-1/bootstrap.pdf`. That commit triggers the
existing GitHub Actions workflow; the workflow renders WebP images and publishes
the site. The initial PDF is already present, so the website remains usable
before the Google Apps Script is authorised.

## One-time configuration (in the Google account that can open the deck)

1. In GitHub, open **Settings → Developer settings → Personal access tokens →
   Fine-grained tokens → Generate new token** or visit
   https://github.com/settings/personal-access-tokens/new.
   Set repository access to **Only select repositories → lbyearwood/concepts**
   and grant **Repository permissions → Contents → Read and write**.
   Give it an expiry appropriate to school policy. Other permissions are
   unnecessary. Copy the generated token to a secure place.
2. Open https://script.google.com/home/projects/create under the Google account
   that has access to the **student** 1.1 deck. Name the project
   `CSRevision Slide Sync`. Replace the default `myFunction` code with the
   complete contents of [Code.gs](Code.gs). Save the project.
3. In the Apps Script editor, open **Project Settings → Script properties**.
   Add a property called `GITHUB_TOKEN` containing the fine-grained token.
   Save it. **Never paste the token into Code.gs, the GitHub repository, or
   the student's website.**
4. From the function drop-down, select **setup** and click **Run**. Grant
   Google's requested permissions for accessing Drive, managing a time-based
   trigger and making an external request. Do this only if the permissions
   are appropriate and allowed under your organisation's policies.
5. Inspect **Executions** or the execution log. The first successful run
   should report that it uploaded the PDF to GitHub, or that it detected no
   changes. A 30-minute time-driven trigger is installed automatically.
   Running `setup()` again replaces the old trigger; it does not create
   duplicate triggers.
6. In GitHub, inspect
   https://github.com/lbyearwood/concepts/actions/workflows/sync-lesson-slides.yml
   for a successful Pages deployment. Then visit
   https://csrevision.org.uk/courses/gcse-computer-science/1-1-variables-constants-data-types-casting.html
   and click **Slides**.

The script uses the Google Slides file ID
`1cc7zHgWpVhG7WMHJMREHOcYh988dZ2Dyuxm4taaeAUo`, **not the teacher
edition**. The PDF uploaded to GitHub is *public*, just like the already
approved public student presentation.

## Ongoing use

- Edit and save your Google Slides presentation normally. The script checks
  approximately every 30 minutes; timing is not exact.
- To update immediately, select and run `syncSlides` in the Apps Script editor.
- Apps Script checks the source file's last-modified time first, then
  compares exported PDF bytes using SHA-256 when needed. Unchanged content
  does not create another GitHub commit or rebuild.
- GitHub Actions performs slide rendering and deployment on the first GitHub
  commit. Students only load the resulting static images from CSRevision.
- If the token expires or is revoked, generate a replacement and update the
  `GITHUB_TOKEN` property. Check Apps Script execution logs for errors.
- If the script is run by an account without access to the presentation,
  Drive export will fail. Do not make private slides public to resolve this.

## Troubleshooting

- **Script asks for permission:** The account creating the trigger must grant
  access; it runs under that account, not the student's.
- **School blocks the script:** Ask the Google Workspace administrator whether
  Apps Script and outbound access to `api.github.com` are permitted.
- **HTTP 401:** Invalid, expired or revoked GitHub token.
- **HTTP 403:** Insufficient repository permissions, policy restrictions
  or GitHub API rate limits.
- **HTTP 404:** Selected repository not authorised for the token (or incorrect
  GitHub path); the script should only use the repository in Code.gs.
- **No update after edits:** Manually run `syncSlides`, inspect Executions,
  check the GitHub workflow, and refresh the 1.1 page.
- **Multiple decks:** Once the pilot works, extend the script's configuration
  to additional *approved student* Google Slides IDs and matching repository
  paths. Each deck still needs its own output and viewer manifest.

Google service accounts are **not needed** for this approach. No scheduled
GitHub job accesses Google: Google Apps Script schedules the Drive export,
and GitHub Actions builds the static website after a content change.
