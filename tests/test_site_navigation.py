"""Check the shared responsive navigation on every generated route."""
import importlib.util
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit
import posixpath
import unittest

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location('course', ROOT / 'scripts/build-course.py')
course = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(course)


class Tags(HTMLParser):
    def __init__(self, html):
        super().__init__()
        self.tags = []
        self.feed(html)

    def handle_starttag(self, tag, attributes):
        self.tags.append((tag, dict(attributes)))


class NavigationTests(unittest.TestCase):
    def test_every_route_has_one_menu_and_loads_the_same_controller(self):
        pages = course.outputs()
        self.assertEqual(len(pages), 65)
        for route, html in pages.items():
            with self.subTest(route=route):
                tags = Tags(html).tags
                for css in ['site-sidebar', 'site-mobile-header', 'sidebar-panel', 'sidebar-toggle', 'sidebar-close']:
                    self.assertEqual(sum(css in a.get('class', '').split() for _, a in tags), 1, css)
                ids = [a['id'] for _, a in tags if 'id' in a]
                self.assertEqual(len(ids), len(set(ids)))
                toggle = next(a for _, a in tags if 'sidebar-toggle' in a.get('class', '').split())
                self.assertEqual(toggle['aria-controls'], 'site-navigation')
                self.assertEqual(toggle['aria-expanded'], 'false')
                self.assertIn(toggle['aria-controls'], ids)
                scripts = [a for t, a in tags if t == 'script' and 'site-navigation.js' in a.get('src', '')]
                self.assertEqual(len(scripts), 1)
                self.assertIn('defer', scripts[0])
                self.assertTrue(scripts[0]['src'].endswith('site-navigation.js?v=1'))

    def test_current_page_identity_and_all_local_navigation_links_survive(self):
        for route, html in course.outputs().items():
            with self.subTest(route=route):
                tags = Tags(html).tags
                current = [a for t, a in tags if t == 'a' and a.get('aria-current') == 'page']
                self.assertEqual(len(current), 1)
                destination = posixpath.normpath(posixpath.join(posixpath.dirname(route), current[0]['href']))
                self.assertEqual(destination, route)
                for tag, attrs in tags:
                    link = attrs.get('href') if tag in {'a', 'link'} else attrs.get('src') if tag in {'script', 'img'} else None
                    if not link or link.startswith('#'):
                        continue
                    url = urlsplit(link)
                    if url.scheme or url.netloc:
                        continue
                    target = ROOT / posixpath.normpath(posixpath.join(posixpath.dirname(route), url.path))
                    self.assertTrue(target.is_file(), str(target))


if __name__ == '__main__':
    unittest.main()
