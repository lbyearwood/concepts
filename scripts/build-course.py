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
        f'    <a class="sidebar-brand" href="{relative("index.html", current)}" aria-label="CSRevision home"><img class="sidebar-logo" src="{brand}" alt="CSR — csrevision" width="545" height="325"></a>',
        '    <nav aria-label="Main navigation">',
        "      " + link("index.html", "Home", current, "sidebar-home"),
        '      <details class="sidebar-section"' + (" open" if home or is_course else "") + ">",
        "        <summary>Courses</summary>",
        '        <div class="sidebar-section-content">',
        '          <details class="sidebar-course" open>',
        "            <summary>GCSE Computer Science</summary>",
        '            <div class="sidebar-units">',
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
    lines += ["        </div>", "      </details>", "    </nav>", "  </aside>"]
    return "\n".join(lines)


def new_topic(unit, topic):
    title = escape(topic["title"])
    short_title = escape(topic["title"].split(" ", 1)[1])
    number = escape(topic["title"].split(" ", 1)[0])
    source = topic.get("lessonSrc")
    source_attr = f' data-lesson-src="{escape(source, quote=True)}"' if source else ""
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
  <link rel="stylesheet" href="../../assets/course-topic.css?v=4">
  <script src="../../assets/concept-viewport.js?v=1" defer></script>
  <script src="../../assets/course-lesson.js?v=3" defer></script>
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
  <dialog class="lesson-modal" id="lesson-modal" aria-labelledby="lesson-title">
    <div class="lesson-modal-heading"><h2 id="lesson-title">{number} Lesson</h2><button class="modal-close" type="button">Close</button></div>
    <div class="lesson-player"><iframe title="{short_title} lesson" allowfullscreen></iframe></div>
  </dialog>
</body>
</html>
'''


def outputs():
    catalogue = json.loads(CATALOGUE.read_text(encoding="utf-8"))
    units = catalogue["units"]
    pages = {}
    paths = set()
    for unit in units:
        for topic in unit["topics"]:
            path = f'{COURSE}/{topic["file"]}'
            if path in paths or Path(topic["file"]).name != topic["file"] or not path.endswith(".html"):
                raise ValueError(f"Invalid or duplicate topic path: {path}")
            paths.add(path)
            source = topic.get("lessonSrc")
            if source and not re.fullmatch(r"https://docs\.google\.com/presentation/d/e/[\w-]+/pubembed\?start=false&loop=false&delayms=3000", source):
                raise ValueError(f"Expected an approved published player URL: {path}")
            if path != EXISTING_TOPIC:
                pages[path] = new_topic(unit, topic)
    # Existing teaching content stays intact; only its shared navigation is regenerated.
    for path in ["index.html", EXISTING_TOPIC] + [item[2] for item in CONCEPTS]:
        pages[path] = (ROOT / path).read_text(encoding="utf-8")
    existing = next(topic for unit in units for topic in unit["topics"]
                    if f'{COURSE}/{topic["file"]}' == EXISTING_TOPIC)
    source = existing.get("lessonSrc")
    source_attr = f' data-lesson-src="{escape(source, quote=True)}"' if source else ""
    pages[EXISTING_TOPIC] = re.sub(
        r'(class="topic-point lesson-launch"[^>]*?) data-lesson-src="[^"]*"',
        lambda match: match[1] + source_attr, pages[EXISTING_TOPIC], count=1)
    for path, html in pages.items():
        html, count = re.subn(r'  <aside class="site-sidebar".*?</aside>', lambda _: sidebar(units, path), html, count=1, flags=re.S)
        if count != 1:
            raise ValueError(f"Expected exactly one sidebar in {path}")
        html = re.sub(r'sidebar\.css\?v=[\w-]+', "sidebar.css?v=units-1", html)
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
    print(f'{"Checked" if args.check else "Generated"} 60 topic pages and shared navigation; {len(changed)} changed.')


if __name__ == "__main__":
    main()

