# Teaching Concepts

A static teaching site hosted by GitHub Pages from the `main` branch.

## Navigation

The homepage and every concept page include the same persistent left sidebar.
Categories use native HTML `details` and `summary` elements, so their menus work
with a keyboard and without JavaScript. All categories start expanded. The
current page link has `aria-current="page"`. The sidebar replaces the top site
header on every page; page and lesson titles remain in the content area.

## Appearance

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

## Local verification and release

Serve this directory with a static HTTP server, then check the homepage and all
demonstrations on desktop and a narrow viewport. Exercise category expand/collapse,
cross-page links, current-page highlighting, keyboard focus and lesson controls.
Check every step fits fully inside the viewport and that only a long sidebar
scrolls. Test Keywords, modal focus, Escape and the return to the lesson.

Before release, review `git diff` and run `git diff --check`. Commit the intended
files and push `main`; GitHub Pages builds and publishes the site automatically.
Verify the Pages workflow for that commit and check the published navigation.

Icons are supplied locally from [Bootstrap Icons](https://icons.getbootstrap.com/)
under its MIT licence, retained in `assets/icons/LICENSE.txt`. No icon service or
web-font connection is needed at runtime.

## Progress

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

## Linear Search model

`concepts/algorithms/linear-search.html` uses the shared viewport and Keywords
components, with model-specific CSS and JavaScript in `assets/linear-search.*`.
The list is fixed at 18, 7, 25, 11, 32, 4, 16, 9. Choosing a target starts a new
search. Each Next action performs one comparison; Back revisits the previous
comparison, and Reset returns to the start with the selected target retained.
The model stops at the first match, or reports not found after all eight checks.
Index labels count from 0; the explanation also gives the ordinary item number.
