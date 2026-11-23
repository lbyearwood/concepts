"""Generate static GCSE topic pages and the shared sidebar from public metadata."""
import argparse
import json
import posixpath
import re
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOGUE = ROOT / "data/gcse-course.json"
COURSE = "courses/gcse-computer-science"
EXISTING_TOPIC = f"{COURSE}/1-1-variables-constants-data-types-casting.html"
PROGRAMMING_PROBLEMS = f"{COURSE}/tutorials/programming-problems.html"
COURSE_OVERVIEW = f"{COURSE}/index.html"
HOME_TEMPLATE = ROOT / 'scripts/templates/homepage.html'
CONCEPTS = [
    ("memory", "Memory Management", "concepts/memory-management/virtual-memory.html", "Virtual Memory"),
    ("scheduling", "Process Scheduling", "concepts/process-scheduling/round-robin.html", "Round Robin Scheduling"),
    ("algorithms", "Algorithms", "concepts/algorithms/linear-search.html", "Linear Search"),
]


def relative(target, current):
    return posixpath.relpath(target, posixpath.dirname(current) or ".")


def link(target, label, current, class_name=None):
    css = f' class="{class_name}"' if class_name else ""
    active = ' aria-current="page"' if target == current else ""
    return f'<a{css} href="{escape(relative(target, current))}"{active}>{escape(label)}</a>'


def sidebar(units, current):
    home = current == "index.html"
    is_course = current.startswith(COURSE + "/")
    brand = relative("assets/csrevision-logo.png", current)
    lines = [
        '  <aside class="site-sidebar" aria-label="Site navigation">',
        '    <header class="site-mobile-header">',
        f'      <a class="mobile-brand" href="{relative("index.html", current)}" aria-label="CSRevision home"><img src="{brand}" alt="CSR — csrevision" width="545" height="325"></a>',
        '      <button class="sidebar-toggle" type="button" aria-expanded="false" aria-controls="site-navigation"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" stroke-width="2.5" stroke-linecap="square"/></svg><span>Menu</span></button>',
        '    </header>',
        '    <button class="sidebar-backdrop" type="button" aria-label="Close menu" tabindex="-1" hidden></button>',
        '    <div class="sidebar-panel" id="site-navigation" aria-label="Site navigation">',
        '      <div class="sidebar-panel-heading"><strong>Menu</strong><button class="sidebar-close" type="button">Close<svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true"><path d="m5 5 14 14M19 5 5 19" stroke="currentColor" stroke-width="2.5"/></svg></button></div>',
        f'    <a class="sidebar-brand" href="{relative("index.html", current)}" aria-label="CSRevision home"><img class="sidebar-logo" src="{brand}" alt="CSR — csrevision" width="545" height="325"></a>',
        '    <nav aria-label="Main navigation">',
        "      " + link("index.html", "Home", current, "sidebar-home"),
        '      <details class="sidebar-section"' + (" open" if home or is_course else "") + ">",
        "        <summary>Courses</summary>",
        '        <div class="sidebar-section-content">',
        '          <details class="sidebar-course" open>',
        "            <summary>GCSE Computer Science</summary>",
        '            <div class="sidebar-units">',
        '              <div class="sidebar-overview">' + link(COURSE_OVERVIEW, 'Course overview', current) + '</div>',
    ]
    for unit in units:
        active = any(f'{COURSE}/{topic["file"]}' == current for topic in unit["topics"])
        lines += [
            '              <details class="sidebar-unit"' + (" open" if active else "") + ">",
            f'                <summary>{escape(unit["title"])}</summary>',
            '                <ul class="sidebar-concepts">',
        ]
        for topic in unit["topics"]:
            lines.append("                  <li>" + link(f'{COURSE}/{topic["file"]}', topic["title"], current) + "</li>")
        lines += ["                </ul>", "              </details>"]
    lines += [
        '              <details class="sidebar-unit sidebar-tutorials"' + (" open" if current.startswith(COURSE + "/tutorials/") else "") + ">",
        "                <summary>Tutorials</summary>",
        '                <ul class="sidebar-concepts"><li>' + link(PROGRAMMING_PROBLEMS, "Programming Problems", current) + "</li></ul>",
        "              </details>",
        "            </div>",
        "          </details>",
        "        </div>",
        "      </details>",
        '      <details class="sidebar-section"' + (" open" if home or not is_course else "") + ">",
        "        <summary>Concepts</summary>",
        '        <div class="sidebar-section-content">',
    ]
    for key, category, path, label in CONCEPTS:
        lines += [
            f'          <details class="sidebar-category sidebar-category-{key}"' + (" open" if path == current else "") + ">",
            f"            <summary>{category}</summary>",
            '            <ul class="sidebar-concepts"><li>' + link(path, label, current) + "</li></ul>",
            "          </details>",
        ]
    lines += ["        </div>", "      </details>", "    </nav>", "    </div>", "  </aside>"]
    return "\n".join(lines)


def selfhosted_player(output):
    return f'''<div class="selfhosted-viewer" data-manifest="../../{escape(output)}/manifest.json">
      <div class="selfhosted-slide-stage" aria-label="Lesson slide">
        <img class="selfhosted-slide-image" alt="" hidden>
        <p class="selfhosted-slide-status" role="status">Loading slides from CSRevision…</p>
      </div>
      <div class="selfhosted-slide-controls">
        <button class="slide-btn selfhosted-slide-previous" type="button" disabled>← Back</button>
        <strong class="selfhosted-slide-counter" aria-live="polite">Loading…</strong>
        <button class="slide-btn selfhosted-slide-next" type="button" disabled>Next →</button>
        <button class="slide-btn secondary selfhosted-slide-fullscreen" type="button">Fullscreen</button>
      </div>
    </div>'''


def native_player(title, source):
    """Use the verified school file's live preview without changing its access."""
    return f'''<div class="lesson-player"><iframe title="{escape(title)} lesson" allowfullscreen referrerpolicy="no-referrer"></iframe></div>
    <p class="lesson-access">Use your school Google account if asked to sign in. <a class="lesson-open-link" href="{escape(source, quote=True)}" target="_blank" rel="noopener noreferrer">Open in Google Slides ↗</a></p>'''


def lesson_dialog(number, title, source, deck=None):
    player = selfhosted_player(deck["output"]) if deck else native_player(title, source)
    return f'''<dialog class="lesson-modal" id="lesson-modal" aria-labelledby="lesson-title">
    <div class="lesson-fullscreen-container">
      <div class="lesson-modal-heading"><h2 id="lesson-title">{escape(number)} Lesson</h2><button class="lesson-fullscreen" type="button" aria-pressed="false"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true"><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5" stroke="currentColor" stroke-width="2" stroke-linecap="square"/></svg><span>Full screen</span></button><button class="modal-close" type="button">Close</button></div>
      {player}
      <p class="lesson-fullscreen-status" role="status" hidden></p>
    </div>
  </dialog>'''


def new_topic(unit, topic, deck=None):
    title = escape(topic["title"])
    source = topic.get("lessonSrc")
    source_attr = f' data-lesson-src="{escape(source, quote=True)}"' if source else ""
    lesson_script = "selfhosted-lesson.js?v=1" if deck else "course-lesson.js?v=5"
    lesson_css = '\n  <link rel="stylesheet" href="../../assets/selfhosted-slides.css?v=2">' if deck else ""
    if deck:
        source_attr = ""
    return f'''<!DOCTYPE html>
<html lang="en-GB">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="GCSE Computer Science lesson {title}.">
  <title>{title} | CSRevision</title>
  <link rel="stylesheet" href="../../assets/sidebar.css?v=units-1">
  <link rel="stylesheet" href="../../assets/colour-block.css?v=2">
  <link rel="stylesheet" href="../../assets/concept-viewport.css?v=1">
  <link rel="stylesheet" href="../../assets/course-topic.css?v=6">{lesson_css}
  <script src="../../assets/concept-viewport.js?v=1" defer></script>
  <script src="../../assets/{lesson_script}" defer></script>
</head>
<body class="has-sidebar theme-colour-block concept-demo course-topic-page">
  <a class="skip-link" href="#main-content">Skip to content</a>
  <aside class="site-sidebar" aria-label="Site navigation"></aside>
  <div class="concept-viewport"><div class="app">
    <div class="title-row">
      <p class="eyebrow">Courses / GCSE Computer Science / {escape(unit["title"])}</p>
      <h1>{title}</h1>
    </div>
    <main id="main-content" class="topic-overview" tabindex="-1">
      <section class="topic-introduction" aria-labelledby="topic-introduction-title">
        <h2 id="topic-introduction-title">{escape(unit["title"])}</h2>
        <p>GCSE Computer Science</p>
      </section>
      <div class="topic-points" role="group" aria-label="Lesson resources">
        <button class="topic-point lesson-launch" type="button"{source_attr} aria-label="Open lesson slides" aria-haspopup="dialog" aria-controls="lesson-modal" disabled><svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M3 4h26v18H3zM16 22v6M9 29l7-3 7 3" stroke="currentColor" stroke-width="2.5"/><path d="m13 9 8 4-8 4z" fill="currentColor"/></svg><span>Slides</span></button>
        <button class="topic-point" type="button" aria-label="Resource 2" disabled></button>
        <button class="topic-point" type="button" aria-label="Resource 3" disabled></button>
      </div>
    </main>
  </div></div>
  {lesson_dialog(topic["title"].split(" ", 1)[0], topic["title"], source, deck)}
</body>
</html>
'''


def course_overview(units):
    groups = []
    for index, unit in enumerate(units, 1):
        topics = '\n'.join('          <li>' + link(f'{COURSE}/{topic["file"]}', topic['title'], COURSE_OVERVIEW) + '</li>' for topic in unit['topics'])
        groups.append(f'''      <details class="hub-unit" id="unit-{index}">
        <summary>{escape(unit['title'])}<span class="hub-topic-count">{len(unit['topics'])} topics</span></summary>
        <ol>
{topics}
        </ol>
      </details>''')
    concepts = '\n'.join(f'      <a href="{relative(path, COURSE_OVERVIEW)}"><strong>{escape(label)}</strong><span>{escape(category)}</span></a>' for _, category, path, label in CONCEPTS)
    return f'''<!DOCTYPE html>
<html lang="en-GB">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Choose a GCSE Computer Science topic, follow a programming tutorial or explore an interactive concept.">
  <title>Start revising | CSRevision</title>
  <link rel="stylesheet" href="../../assets/sidebar.css?v=responsive-2">
  <link rel="stylesheet" href="../../assets/colour-block.css?v=2">
  <link rel="stylesheet" href="../../assets/course-hub.css?v=1">
</head>
<body class="has-sidebar theme-colour-block resource-hub-page">
  <a class="skip-link" href="#main-content">Skip to content</a>
  <aside class="site-sidebar" aria-label="Site navigation"></aside>
  <main class="course-hub" id="main-content" tabindex="-1">
    <p class="eyebrow">GCSE Computer Science</p>
    <h1>Start revising</h1>
    <p class="hub-intro">Choose a topic, follow a programming tutorial or explore an interactive concept.</p>
    <a class="hub-tutorial" href="tutorials/programming-problems.html"><h2>Programming problems</h2><p>Build your skills with guided Python and SQL tutorials, practice problems and questions to check your understanding.</p></a>
    <h2 class="hub-section-title">Choose a topic</h2>
    <div class="hub-units">
{chr(10).join(groups)}
    </div>
    <h2 class="hub-section-title">Explore a concept</h2>
    <div class="hub-concepts">
{concepts}
    </div>
  </main>
</body>
</html>
'''


def outputs():
    catalogue = json.loads(CATALOGUE.read_text(encoding="utf-8"))
    units = catalogue["units"]
    sync = json.loads((ROOT / "data/slide-sync.json").read_text(encoding="utf-8"))
    decks = {}
    for deck in sync["decks"]:
        if (deck.get("approvedStudent") is not True or
                not re.fullmatch(r"assets/slide-decks/[a-z0-9-]+", deck.get("output", ""))):
            raise ValueError("Expected an explicitly approved, safe self-hosted deck.")
        if deck["key"] in decks:
            raise ValueError("Duplicate slide deck key.")
        decks[deck["key"]] = deck
    pages = {}
    paths = set()
    for unit in units:
        for topic in unit["topics"]:
            path = f'{COURSE}/{topic["file"]}'
            if path in paths or Path(topic["file"]).name != topic["file"] or not path.endswith(".html"):
                raise ValueError(f"Invalid or duplicate topic path: {path}")
            paths.add(path)
            source = topic.get("lessonSrc")
            if not source or not re.fullmatch(r"https://docs\.google\.com/presentation/d/[\w-]{20,}/preview", source):
                raise ValueError(f"Expected a verified school-owned Slides preview URL: {path}")
            if path != EXISTING_TOPIC:
                deck = decks.get("gcse-" + topic["title"].split(" ", 1)[0].replace(".", "-"))
                pages[path] = new_topic(unit, topic, deck)
    # Existing teaching content stays intact; only its shared navigation is regenerated.
    for path in [EXISTING_TOPIC, PROGRAMMING_PROBLEMS] + [item[2] for item in CONCEPTS]:
        pages[path] = (ROOT / path).read_text(encoding="utf-8")
    pages['index.html'] = HOME_TEMPLATE.read_text(encoding='utf-8')
    pages[COURSE_OVERVIEW] = course_overview(units)
    existing = next(topic for unit in units for topic in unit["topics"]
                    if f'{COURSE}/{topic["file"]}' == EXISTING_TOPIC)
    source = existing.get("lessonSrc")
    source_attr = f' data-lesson-src="{escape(source, quote=True)}"' if source else ""
    html = pages[EXISTING_TOPIC]
    html, count = re.subn(
        r'(<button class="topic-point lesson-launch"[^>]*)(>)',
        lambda match: re.sub(r' data-lesson-src="[^"]*"', '', match[1]) + source_attr + match[2],
        html, count=1)
    if count != 1:
        raise ValueError("Expected one lesson launch button in existing 1.1 content.")
    html, count = re.subn(
        r'<dialog class="lesson-modal"[^>]*>.*?</dialog>',
        lambda match: lesson_dialog(existing['title'].split(" ", 1)[0], existing['title'], source),
        html, count=1, flags=re.S)
    if count != 1:
        raise ValueError("Expected one lesson dialog in existing 1.1 content.")
    html = re.sub(r'\n  <link rel="stylesheet" href="[^\"]*selfhosted-slides\.css[^\"]*">', '', html)
    html = re.sub(r'(src="[^"]*/assets/)(?:selfhosted-lesson|course-lesson)\.js\?v=\d+', r'\1course-lesson.js?v=5', html)
    pages[EXISTING_TOPIC] = html
    for path, html in pages.items():
        if path == 'index.html':
            continue
        html, count = re.subn(r'  <aside class="site-sidebar".*?</aside>', lambda _: sidebar(units, path), html, count=1, flags=re.S)
        if count != 1:
            raise ValueError(f"Expected exactly one sidebar in {path}")
        html = re.sub(r'sidebar\.css\?v=[\w-]+', "sidebar.css?v=responsive-2", html)
        html = re.sub(r'concept-viewport\.css\?v=\d+', "concept-viewport.css?v=2", html)
        if 'site-navigation.js' not in html:
            script = f'  <script src="{relative("assets/site-navigation.js", path)}?v=1" defer></script>\n'
            html = html.replace('</head>', script + '</head>', 1)
        html = re.sub(r'course-topic\.css\?v=\d+', "course-topic.css?v=6", html)
        pages[path] = html
    return pages


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Fail if generated pages need updating.")
    args = parser.parse_args()
    changed = []
    for relative_path, content in outputs().items():
        path = ROOT / relative_path
        if path.exists() and path.read_text(encoding="utf-8") == content:
            continue
        changed.append(relative_path)
        if not args.check:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(content, encoding="utf-8", newline="\n")
    if args.check and changed:
        raise SystemExit("Regenerate with python scripts/build-course.py: " + ", ".join(changed))
    print(f'{"Checked" if args.check else "Generated"} 60 topic pages, tutorials and shared navigation; {len(changed)} changed.')


if __name__ == "__main__":
    main()

