# Teaching Concepts

A static teaching site hosted by GitHub Pages from the `main` branch.

## Navigation

The homepage and every concept page include the same persistent left sidebar.
Categories use native HTML `details` and `summary` elements, so their menus work
with a keyboard and without JavaScript. Both categories start expanded. The
current page link has `aria-current="page"`. The sidebar replaces the top site
header on all three pages; page and lesson titles remain in the content area.

## Appearance

Use a light theme throughout, including the sidebar and all concept
demonstrations. Keep white or pale surfaces, dark readable text and restrained
blue accents, with pastel colours distinguishing memory pages and programmes.
Do not add a dark theme or follow the device's dark-mode preference.

Shared sidebar styling and the responsive space reserved for it live in
`assets/sidebar.css`. The sidebar stays on the left at all screen sizes and can
scroll independently when its contents exceed the viewport height. Lesson pages
use normal document scrolling to make room for the sidebar without clipping
their diagrams or explanations.

When adding a concept, add its link to the homepage and to the sidebar in each
HTML page. Preserve the page-specific relative paths and current-page marker.

## Local verification and release

Serve this directory with a static HTTP server, then check the homepage and both
demonstrations on desktop and a narrow viewport. Exercise category expand/collapse,
cross-page links, current-page highlighting, keyboard focus and lesson controls.
Check that the sidebar remains visible during document scrolling.

Before release, review `git diff` and run `git diff --check`. Commit the intended
files and push `main`; GitHub Pages builds and publishes the site automatically.
Verify the Pages workflow for that commit and check the published navigation.

## Progress

- 7 November 2026: replaced the top headers with persistent category navigation
  across the homepage and both concept pages, with shared responsive styling and
  current-page links. Applied a light-only theme to navigation and demonstrations.
