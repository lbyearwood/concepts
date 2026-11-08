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

## Navigation

The homepage and every concept page include the same persistent left sidebar.
The order is Home, Courses, then Concepts. Courses contains GCSE Computer Science,
then eight units, then their 60 numbered topics. Unit titles and topic numbering
match the current OCR course folders: Programming, Hardware, Software, Data
representation, Networks, Cyber security, Algorithms, and Societal implications
of digital technology. Concepts contains Memory Management, Process Scheduling
and Algorithms, with their existing interactive models.
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
59 new resource pages and all 64 static sidebars while retaining the existing
1.1 teaching content and concept models. `python scripts/build-course.py --check`
checks that generated output is current. No runtime JavaScript is needed for
navigation.

The topic 1.1 resource row has three square buttons. The first is Slides; the
other two stay visually blank and inactive until the user assigns them a purpose.
Slides is yellow with dark icon/text by default, then blue with white icon/text
on hover or visible keyboard focus. The blank controls retain orange and lime.
The Slides button opens the approved published Google Slides presentation in a
white lightbox beside the persistent sidebar. Its actual `pubembed` URL is stored
in `data-lesson-src`; the player loads only when the button is clicked. The same
native deck supplies future updates. Do not substitute an editor/share link or a
static export. Existing edit-sharing permissions are preserved; the published
presentation is public, as explicitly approved on 8 November 2026. Obtain approval
for the exact deck and public-web audience before publishing a different deck.
The remaining 59 student decks have been matched to the current course folders;
their Slides controls stay disabled until approved public player URLs are set in
the catalogue. Teacher editions, revision cards and archived files are excluded.

## Local verification and release

Serve this directory with a static HTTP server, then check the homepage and all
demonstrations on desktop and a narrow viewport. Exercise category expand/collapse,
cross-page links, current-page highlighting, keyboard focus and lesson controls.
Check every step fits fully inside the viewport and that only a long sidebar
scrolls. Test Keywords, modal focus, Escape and the return to the lesson.

Before release, run `python scripts/build-course.py --check`, review `git diff`
and run `git diff --check`. Commit the intended
files and push `main`; GitHub Pages builds and publishes the site automatically.
Verify the Pages workflow for that commit and check the published navigation.

Icons are supplied locally from [Bootstrap Icons](https://icons.getbootstrap.com/)
under its MIT licence, retained in `assets/icons/LICENSE.txt`. No icon service or
web-font connection is needed at runtime.

## Progress

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
