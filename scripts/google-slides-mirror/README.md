# Native student Slides mirror

Prepared, not activated. **One student pair is configured privately; no timer
is installed and new Google consent remains pending.** The live website still
uses its verified self-hosted 1.1 viewer. This is a separate Apps Script project
from the older read-only PDF exporter.

The user will always edit one chosen set of decks. Prefer the **lbyearwood
master → school-owned student copy** direction: the user can keep editing the
personal source and students eventually view the school copy. Both accounts
have the necessary cross-account Editor permission in the inspected example,
but that pair is a Teacher edition and is deliberately excluded by this code.
It has not been modified or published. A separate school-owned **School student
copy** has now been created from the original 56-slide student presentation in
the same lesson folder. Its school owner, lbyearwood Editor access, slide data
and dimensions were verified. Do not reuse the Teacher target.

## Operation

- Poll source modification times every 15 minutes, skipping unchanged decks
  before opening the presentations. This is periodic, not instant, syncing.
- On first import, append native linked slides before removing the target's old
  contents. Later source changes refresh linked slides and reconcile inserted,
  deleted and reordered slides. Target-only edits are not a supported workflow;
  a source refresh can overwrite them. Always edit the chosen master.
- Preserve the target presentation ID, owner, name and sharing. The code does
  not write to source presentations, publish files or grant access.
- Use a lock, per-pair checkpoints, a resume cursor, a four-minute soft limit and
  at most 120 native operations per run. A failed/partial run never advances its
  source checkpoint. Re-running discovers existing linked imports to avoid
  creating duplicate slides. Some large initial imports need repeated runs.
- No PDF/WebP rendering, GitHub token, GitHub upload, external HTTP request,
  paid API plan or new hosting account is used for content updates. Keep within
  existing free Apps Script quotas; stop on limits and do not enable billing.

Native Slides writes are **not atomic**. A failed run can leave the target with
appended or partly refreshed slides until it resumes. Keep an initial import
away from student use. Master/layout changes are copied by Google's linked-slide
mechanism; exact notes, animations, video/chart access and internal-link fidelity
need real pilot checks. Copying does not change linked media's own permissions.
Collaborators can inspect linked-slide source references. This is not an
anonymity guarantee or a way to bypass school access rules.

## One-time setup

1. Identify the exact approved student source and its school-owned student copy.
   Create the copy while signed into the school account, in the requested lesson
   folder. Give the account running the script Editor access to the target and
   read access to the source. Preserve other shares. Use matching slide sizes.
2. The pilot's separate private standalone project named `CSRevision Native Slide
   Mirror` is already prepared. Reuse it; do not create another project. Its
   reloaded Code.gs exactly matches the 8,934-character source, its explicit
   manifest matches this directory, and its private one-pair mapping was read
   back after reload. For a future installation, create a separate project in
   Planning / 5. Workspace tools and save these two files. Do not add these
   write scopes silently to the old read-only exporter project.
3. In private Script Properties set `MIRROR_PAIRS` to a JSON array with each
   exact pair. A pair requires `id`, `sourceId`, `targetId`, `sourceOwner`,
   `targetOwner`, `approvedStudent: true` and `replaceTargetContent: true`.
   The latter explicitly permits replacing the target contents to match the
   approved source. Keep real config out of the public repository. Same-file
   pairs, duplicate targets, source/target chains, wrong owners and Teacher or
   answer-edition titles are rejected.
4. Run `previewMirrors` first. This reads metadata/counts without writing a
   presentation or installing a timer. The user must review Google's new consent:
   **Full Slides access, including reading, editing, creating and deleting
   presentations accessible to the account**, Drive
   read-only across accessible files, and this project's trigger management.
   The code's exact-file allowlist is narrower than Google's permission. There
   is no Drive write/delete/share scope or GitHub permission, but the Slides
   permission is broader than the code's target writes. See Google's
   [official scope descriptions](https://developers.google.com/workspace/slides/api/scopes).
   Handle security or
   unverified-app warnings through the user's/admin's review; do not bypass them.
5. Run `syncMirrors` to import the pilot. If bounded execution pauses, rerun it.
   Check saved target contents/order, owner/shares and native editor/slideshow.
   Have the user make one intended source edit and verify its propagation before
   running `setupMirrors`, which installs exactly one 15-minute trigger only
   after a fully successful sync. `stopMirrors` removes only this handler's timers.
6. Test real student access to the school-owned **student** presentation and its
   intended embedding/publication mode. School ownership does not itself grant
   students or anonymous browsers access. Only then replace the website viewer
   with this target. Keep existing website behavior until that proof is complete.

Changing to school-as-master is possible by explicitly configuring the correct
source/target pair and owners; never reverse them automatically based on dates.
If the site can directly embed the school master, maintaining a personal mirror
is a separate requirement and its direction should still stay fixed.

## Validation

Eleven mirror boundary tests passed, together with the existing eight renderer
and nine exporter tests. Saved native project/manifest/configuration and zero
triggers were verified in Edge. No real mirror execution or automatic edit
propagation is claimed before new account consent and the acceptance test.

`node --test tests/slide-mirror.test.cjs` exercises the actual Code.gs with
simulated Google services. These tests check guards, retries and ordering, not
Google's actual copy fidelity or cross-account consent. No presentation content,
sharing, teacher file, trigger or paid setting was changed by the tests.

References: [native slide copying/linking](https://developers.google.com/apps-script/reference/slides/presentation#appendSlide(Slide,SlideLinkingMode)),
[linked-slide refresh](https://developers.google.com/apps-script/reference/slides/slide#refreshSlide()),
[destination access to linked content](https://support.google.com/docs/answer/7009814?hl=en),
[Apps Script quotas](https://developers.google.com/apps-script/guides/services/quotas),
[publishing and embedding](https://support.google.com/docs/answer/183965?hl=en).
