"""Verify the public homepage-to-revision journey and the deferred account feature."""
from pathlib import Path
import json
import posixpath
import unittest
from test_site_navigation import Tags, course

ROOT = Path(__file__).resolve().parents[1]
HUB = 'courses/gcse-computer-science/index.html'


class HomepageTests(unittest.TestCase):
    def test_marketing_home_has_no_learning_menu_or_lesson_content(self):
        html = course.outputs()['index.html']
        tags = Tags(html).tags
        self.assertFalse(any(tag in {'pre', 'code', 'iframe'} for tag, _ in tags))
        self.assertNotIn('problem-data', html)
        self.assertNotIn('site-sidebar', html)
        self.assertNotIn('Illustrative testimonials', html)
        self.assertNotIn('Example GCSE student', html)
        for section in ['about', 'how-it-helps', 'your-revision']:
            self.assertTrue(any(attrs.get('id') == section for _, attrs in tags))

    def test_all_revise_actions_enter_the_real_revision_area(self):
        pages = course.outputs()
        self.assertIn(HUB, pages)
        anchors = [attrs for tag, attrs in Tags(pages['index.html']).tags if tag == 'a']
        self.assertGreaterEqual(sum(attrs.get('href') == HUB for attrs in anchors), 4)
        self.assertIn('site-sidebar', pages[HUB])
        self.assertIn('Course overview', pages[HUB])

    def test_account_icon_is_a_disabled_accessibly_named_placeholder(self):
        tags = Tags(course.outputs()['index.html']).tags
        accounts = [attrs for tag, attrs in tags if tag == 'button' and attrs.get('class') == 'home-account']
        self.assertEqual(len(accounts), 1)
        self.assertIn('disabled', accounts[0])
        self.assertEqual(accounts[0]['type'], 'button')
        self.assertIn('Sign up / log in', accounts[0]['aria-label'])
        self.assertIn('coming soon', accounts[0]['aria-label'])

    def test_revision_area_reaches_every_existing_topic_and_tutorial(self):
        tags = Tags(course.outputs()[HUB]).tags
        links = {posixpath.normpath(posixpath.join(posixpath.dirname(HUB), attrs['href']))
                 for tag, attrs in tags if tag == 'a' and 'href' in attrs}
        catalogue = json.loads((ROOT / 'data/gcse-course.json').read_text(encoding='utf-8'))
        topics = {'courses/gcse-computer-science/' + topic['file'] for unit in catalogue['units'] for topic in unit['topics']}
        self.assertEqual(len(topics), 60)
        self.assertTrue(topics.issubset(links))
        self.assertIn('courses/gcse-computer-science/tutorials/programming-problems.html', links)
        self.assertTrue(all(path in links for _, _, path, _ in course.CONCEPTS))


if __name__ == '__main__':
    unittest.main()
