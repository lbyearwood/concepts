# CSRevision

A static teaching site at [csrevision.org.uk](https://csrevision.org.uk/), hosted
by GitHub Pages from the `main` branch. Cloudflare manages the domain and DNS.

## Custom domain

The canonical domain is `csrevision.org.uk`, also stored in the root `CNAME`
file. `www.csrevision.org.uk` points to the same GitHub Pages host and redirects
to the canonical domain. Keep internal links relative to preserve all concept
routes when moving between the default GitHub URL and this domain.

Cloudflare DNS configuration:

| Type | Name | Target | Proxy status |
| --- | --- | --- | --- |
| CNAME | @ | lbyearwood.github.io | DNS only |
| CNAME | www | lbyearwood.github.io | DNS only |

Cloudflare flattens the apex CNAME to GitHub Pages' IPv4/IPv6 addresses. Retain
the `_github-pages-challenge-lbyearwood` TXT record so ownership stays verified
for the `lbyearwood` GitHub account.

For future domain changes, verify ownership in the account's GitHub Pages
settings, bind the domain in this repository's Pages settings, then change the
DNS records. Preserve unrelated records. Wait for GitHub's certificate to be
issued, enable Enforce HTTPS, and verify both the main and www addresses plus
the concept routes. Do not bypass a certificate warning. GitHub's domain-setting
save creates a CNAME commit; fast-forward the local checkout before further work.

## GCSE lesson slides

All 60 GCSE Computer Science Slides buttons open the matching native lesson
owned by **myearwood@oaklandsschool.com**, using the school-version mappings
verified in the GCSE resource-ownership record. The yellow button opens a live
Google Slides preview in the existing lightbox, with an Open in Google Slides
link alongside it. Google access follows each deck's existing permissions;
students should use their school Google account if prompted.

The lesson heading has a **Full screen** button beside Close. It fills the
screen with the lesson and keeps Exit full screen/Close available. Leaving
fullscreen keeps the current slide. If the browser declines fullscreen, the
lesson fills the browser window instead and offers Exit expanded view.

Make future lesson amendments in these **school-owned versions**. No personal
lbyearwood presentation or old static export is used by the course pages.
No new public publishing, copying, sharing change, Apps Script authorisation,
GitHub token or paid service is required for this link-based delivery.

The catalogue is `data/gcse-course.json`; rebuild it with
`python scripts/build-course.py`, then verify with `--check`.
Topic 1.1 keeps its existing introduction and Keywords modal. The persistent
sidebar, Colour Block theme, spare resource buttons and tutorials are preserved.

The older PDF exporter and personal-master mirror are **historical and must not
be activated for these GCSE resources**. Their code/assets are retained, with
no active PDF decks in `data/slide-sync.json`. See the
[current school-link delivery and earlier pilot record](docs/slide-synchronisation.md).
Slide delivery retains the **£0 additional-running-cost requirement**.

## Navigation

The homepage and every concept, course and tutorial page include the same persistent left sidebar.
The order is Home, Courses, then Concepts. Courses contains GCSE Computer Science,
then eight units, then their 60 numbered topics. Unit titles and topic numbering
match the current OCR course folders: Programming, Hardware, Software, Data
representation, Networks, Cyber security, Algorithms, and Societal implications
of digital technology. Concepts contains Memory Management, Process Scheduling
and Algorithms, with their existing interactive models.
Below the eight units, GCSE Computer Science also contains Tutorials / Programming
Problems. It has Exam questions, Level 1 problems, Level 2 and Level 3 tabs.
Exam questions contains List Traversal (eight tutorials), Counting (four),
Subroutines (five) and File Handling (five), with 22 tutorials and 111 guided
steps in total. Level collections have
empty states ready for further problems. Every tutorial opens in a native
popup with numbered steps, code, understanding questions and common errors.
Each popup opens with the complete Exam question expanded and Tutorial help
collapsed, so students can attempt the problem before revealing the steps.
Opening Tutorial reveals its numbered steps and Back/Next controls; collapsing
it hides those controls. Every problem starts in this question-first state,
including when reopened. Tutorials are native site content, without document
embeds or private editor links.

Public tutorial content is maintained in `data/programming-problems.json`.
Run `python scripts/build-problems.py` to rebuild the page from that catalogue
and `scripts/templates/programming-problems.html`, then run
`python scripts/build-course.py` to reconcile shared navigation.
Both scripts accept `--check`. Keep stable problem IDs and include the complete
Python solution alongside its displayed steps so the teaching algorithm can be
checked. Preserve Python indentation in code blocks.

The `problem-1` pilot (Linear search on a string) fills the right pane and
builds its solution one line at a time. Next line appends a line with a
character-by-character typing animation; earlier lines remain above it in the
same code block. A quick Next line click completes the current line before
advancing. Back shows the preceding line immediately, and the four numbered
stages jump to their first line. Closing or collapsing the tutorial cancels
playback. Reduced-motion preferences show each new line immediately. The
other tutorials retain their current layout and step navigation. Playback
logic and cancellation tests live in `assets/tutorial-typewriter.js` and
`tests/tutorial-typewriter.test.cjs`; the catalogue remains the source of code.

The same pilot has a roughly 60/40 code/tutor split on desktop. Its wider,
unboxed right-hand area follows the current line with explanations, useful
Remember guidance in a compact yellow card. The tutor is written only; spoken
playback and its Play control have been removed at the user's request.
Questions follow their explanations in the existing Next/Back flow;
there are no Explanation or Quick check tabs. Opening the walkthrough closes
the exam text so the two views do not compete for height. Both fit without
internal scrolling. On small or short screens, code and explanation use
successive views; short pages preserve any overflow text or earlier code.
Answers persist inside an attempt and reset
on reopening. All content remains available, including on the compact pages.
Two selected **Predict the next step** checkpoints also appear before the scan
starts and before the search stops at its first match. They follow the existing
understanding checks and require a correct answer before the next code line or
its explanation is shown. Each question has a distinct stable identity, so a
prediction cannot inherit another question's answer. Next and stage jumps use
the same earliest-unpassed-checkpoint limit; Back retains choices and reopening
resets them all. Correct answers unlock without automatically moving on.
The pilot's Exam question and Tutorial disclosures use the same larger type;
Tutorial follows the question content directly. Long exam text still uses fitted
pages on compact screens.
`data/tutorial-guides.json` owns the explanations, checks and audio references.
The builder rejects mismatched code/explanations; tests verify every audio digest
and transcript. The original problem catalogue and the other 21 tutorials are
preserved. See `assets/tutorial-audio/README.md` for generation and credits.

Python syntax colours appear with each typed character and remain on completed
lines. Inline code in the tutor uses the same palette and heavier type; the
underlying code and teaching text stay unchanged and selectable. Correct and
incorrect answers have green/red feedback cards, a tick/cross and a text label.
The Sound on/off control sits in the footer and governs quiet typing clicks,
a correct-answer recording and a wrong-answer recording supplied by the user.
Typing uses the original quiet, locally generated 18ms character clicks at the
original modest level. There is no keyboard-file request or recorded lead-in.
The supplied keyboard MP3 remains stored but inactive. The two selected answer
MP3s are downloaded/decoded when the pilot first opens with Sound on, before
Tutorial is expanded, then reused. Prepared answers start directly from cached
buffers, without a new fetch/decode on selection. An unusually early current
answer waits for its existing preload; obsolete requests remain cancelled.
Typing follows real character ticks; instant/reduced-motion rendering creates
no sound burst. Original MP3s and hashes remain retained.
Sounds start only after an actual tutorial action/answer
change. Restoring a saved answer is silent. Navigation, collapse,
Close and hiding the page cancel active/pending effects. Muting stops all effects
and is kept for the current page visit; enabling never replays an old sound.
Unsupported sound leaves the tutorial usable.
No external sound service or paid call is involved. The two runtime MP3s total
88,215 bytes. All three supplied originals remain byte-for-byte unchanged.
`assets/tutorial-code-style.js` and `assets/tutorial-typing-sound.js` contain the
small isolated render/sound helpers, covered by exact-text and lifecycle tests.

Only the pilot's explicit Close button dismisses its dialog. Backdrop/sidebar
clicks and Escape leave the current line and answer intact. The final Next
control becomes a disabled End button. The duplicated footer progress counter
is hidden for the pilot; retain the blue tutor progress and four stage buttons.
Other tutorials keep their current dismissal and progress behavior. Stored
recordings, guide data and transcript checks remain intact as unused assets.

The five pilot questions are checkpoints. Next stays disabled until the selected
answer is correct, and later stage jumps cannot skip an unanswered or wrong
checkpoint. Earlier views and Back remain available. A correct answer unlocks
Next without automatically advancing; selecting a wrong answer again relocks
progress. Selection/pass state lasts for the current attempt and clears on
reopening. This works independently of sound or audio loading. A short prompt
explains the lock, with the next control linked to it for assistive technology.

The web adaptations reconcile question/code inconsistencies, make the letter
counter case insensitive for the chosen letter, use the stated safe-reading
range, and include a worked username subroutine. The source document is
unchanged. These are authored practice questions, rather than official
exam-board past-paper questions.

The additional subroutine/file practice follows [OCR J277 specification v3.1,
section 2.2.3](https://www.ocr.org.uk/Images/558027-specification-gcse-computer-science-j277.pdf)
and the [J277/02 sample assessment format](https://www.ocr.org.uk/Images/552502-computational-thinking-algorithms-and-programming.pdf).
It covers parameters, local variables, return values, list parameters/results,
validation and opening/reading/writing/appending/closing text files. The file
walkthroughs use Python, checked against its [file I/O documentation](https://docs.python.org/3/tutorial/inputoutput.html#reading-and-writing-files).
These questions and worked solutions are original CSRevision practice. File
format and input assumptions are stated in each question.

The catalogue keeps readable text and fixed tabs beside the persistent sidebar.
Its problem list can scroll independently. Native tutorial dialogs sit outside
the page content, with fixed header/footer controls and a scrollable body for
longer steps. The existing interactive concept canvases retain their
fitted-viewport behavior.

Nested groups use native HTML `details` and `summary` elements, so their menus work
with a keyboard and without JavaScript. The current page's branch starts open;
other concept categories start closed. Both top groups open on the homepage. The
current page link has `aria-current="page"`. The sidebar replaces the top site
header on every page; page and lesson titles remain in the content area.

## Appearance

The approved CSRevision logo is `assets/csrevision-logo.png`: white CSR lettering
in a blue-violet badge, a turquoise cut-corner accent, and the lowercase
`csrevision` wordmark underneath. Use this same image in every sidebar, with an
accessible home-link label and proportional sizing. Retain the original palette
and lettering. This site identity does not change the reusable Colour Block theme
or any Google Slides template.

The selected website theme is **Colour Block (WEB-CB)**, chosen on 7 November
2026. Follow the [canonical theme guide](https://docs.google.com/document/d/16c7ox4-QR8Df_ZRFoneW0v89Qk9MUAH0LwR8dXj2mjE/edit)
and its saved visual reference. Use white reading surfaces, saturated turquoise
and orange diagram zones, an electric-blue processor, fuchsia actions, a yellow
Remember band, strong outlines and heavy display headings. Keep visible page and
programme labels as well as colour. Do not add a dark theme or follow the
device's dark-mode preference.

Shared page and lesson styling lives in `assets/colour-block.css`; sidebar styling
and the responsive space reserved for it live in `assets/sidebar.css`. The sidebar stays on the left at all screen sizes and can
scroll independently when its contents exceed the viewport height. Each concept
is a single teaching canvas that fits the available viewport, including its
explanation, full diagram, reminder and controls. The concept page does not scroll.
`assets/concept-viewport.css` provides the compact layout and
`assets/concept-viewport.js` refits it after viewport or lesson-content changes.
On small screens the complete canvas scales together. Preserve this behaviour
when adding longer steps or concepts; do not hide content to make it fit.

Keywords are available from the button beside each concept title. Definitions
open in a native modal dialog outside the scaled canvas. Close, Escape and
backdrop clicks dismiss it; the lesson keyboard shortcuts pause while it is open.

When adding a concept, add its link to the homepage and to the sidebar in each
HTML page. Preserve the page-specific relative paths and current-page marker.
Course-topic pages use this same navigation and complete-viewport layout. Their
current unit starts open. All units start collapsed on the homepage so their
titles can be scanned before expanding a topic list.

`data/gcse-course.json` is the public unit/topic catalogue. It contains titles,
relative filenames and approved published player URLs only. Keep private editor
IDs and source-deck inventories outside this repository. Run
`python scripts/build-course.py` after changing the catalogue; it regenerates the
59 new resource pages and all 65 static sidebars while retaining the existing
1.1 teaching content and concept models. `python scripts/build-course.py --check`
checks that generated output is current. No runtime JavaScript is needed for
navigation.

The topic 1.1 resource row has three square buttons. The first is Slides; the
other two stay visually blank and inactive until the user assigns them a purpose.
Slides is yellow with dark icon/text by default, then blue with white icon/text
on hover or visible keyboard focus. The blank controls retain orange and lime.
For topic 1.1, Slides opens the self-hosted image viewer. It fetches the current
manifest on each opening, with Next, Back, arrow keys and fullscreen. The original
published Google player is an optional backup link. Normal slide viewing loads
images from CSRevision and requires no Google sign-in. The image export loses
animations, video, audio, interactive links and semantic/selectable text; see the
sync decision for limits and recovery. Original Google content and sharing are
preserved. Remaining topics stay disabled until an approved working source is
configured. Teacher editions, revision cards and archived files are excluded.

## Local verification and release

Serve this directory with a static HTTP server, then check the homepage and all
demonstrations on desktop and a narrow viewport. Exercise category expand/collapse,
cross-page links, current-page highlighting, keyboard focus and lesson controls.
Check every step fits fully inside the viewport and that only a long sidebar
scrolls. Test Keywords, modal focus, Escape and the return to the lesson.

Before release, install `scripts/requirements-slides.txt`, run
`python -m unittest discover -s tests -p 'test_*.py'`,
`node --test tests/*.test.cjs`, both site builders with `--check`,
and `python scripts/sync-slides.py` twice (the second run must skip). Review `git diff`
and run `git diff --check`. Commit the intended
files and push `main`; GitHub Pages builds and publishes the site automatically.
Verify the Pages workflow for that commit and check the published navigation.

Icons are supplied locally from [Bootstrap Icons](https://icons.getbootstrap.com/)
under its MIT licence, retained in `assets/icons/LICENSE.txt`. No icon service or
web-font connection is needed at runtime.

## Progress

- 11 November 2026: completed the automatic-sync investigation and prepared a
  private read-only Apps Script pilot, still awaiting token/Google consent and
  a real scheduled edit test. Fixed an existing slide-image sizing issue so
  the whole slide fits inside its frame on desktop/mobile/short screens.

- 11 November 2026: added four original subroutine problems and five file-handling
  problems with 45 guided steps, bringing both categories to five problems.
  The nine new solutions passed 44 independent function, boundary and file-effect
  checks, including empty input, append preservation, overwrite and closed files.

- 11 November 2026: made Exam question open by default and Tutorial collapsed
  in every programming problem popup. Step navigation appears only when the
  student opens Tutorial help.

- 9 November 2026: built the approved Exam questions design with all four main
  tabs, four source categories, 13 native tutorials and 66 guided steps. Added
  public structured content, a deterministic page builder and accessible popup
  controls. Empty File Handling and Level 1–3 collections await further content.

- 9 November 2026: added Tutorials / Programming Problems under GCSE Computer
  Science on every page, with a native landing page ready for the user's list.
  The example Google Doc informed the intended tutorial structure only; its
  content and access were preserved.

- 8 November 2026: added the eight GCSE unit menus and all 60 numbered topic
  pages. Matched main student decks in Drive without changing their content or
  access. Topic 1.1 retains its approved player; 59 further players await public
  publication approval. Added a shared catalogue and static generator to keep
  every sidebar consistent.

- 8 November 2026: made the Slides square yellow by default, with a blue hover
  and keyboard-focus state using white icon/text.

- 8 November 2026: changed the three topic panels into square resource buttons.
  Slides opens the approved live presentation in a lightbox; the other two are
  blank and inactive as requested.

- 8 November 2026: grouped navigation under Courses and Concepts on every page,
  added GCSE Computer Science and the verified first topic, and retained the
  existing models.

- 8 November 2026: renamed the site CSRevision and added the approved CSR badge
  to every sidebar. Updated homepage copy, footer and all browser titles.

- 7 November 2026: replaced the top headers with persistent category navigation
  across the homepage and both concept pages, with shared responsive styling and
  current-page links. Applied a light-only theme to navigation and demonstrations.
- 7 November 2026: applied the selected Colour Block theme to the homepage,
  virtual-memory demonstration and Round Robin demonstration. Centralised page
  styling, retained the lesson states, and checked all steps, Back, Reset,
  keyboard navigation, colour contrast and responsive layouts in Edge.
- 7 November 2026: made each complete concept fit the viewport and moved keywords
  to a top-of-page modal. Sidebar overflow remains independently scrollable.
- 8 November 2026: added Algorithms and a Linear Search model. Targets demonstrate
  first, middle, last and absent matches in an unsorted list. Each comparison shows
  its zero-based index and running count; a match ends the search immediately.
  Added the category and model to the homepage and every sidebar.
- 8 November 2026: connected csrevision.org.uk and www through Cloudflare DNS
  and the Concepts GitHub Pages custom-domain setting; verified domain ownership.

## Linear Search model

`concepts/algorithms/linear-search.html` uses the shared viewport and Keywords
components, with model-specific CSS and JavaScript in `assets/linear-search.*`.
The list is fixed at 18, 7, 25, 11, 32, 4, 16, 9. Choosing a target starts a new
search. Each Next action performs one comparison; Back revisits the previous
comparison, and Reset returns to the start with the selected target retained.
The model stops at the first match, or reports not found after all eight checks.
Index labels count from 0; the explanation also gives the ordinary item number.
