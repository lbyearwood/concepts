"""Verify public revision entry and the intentionally unavailable sign-in page."""
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

    def test_account_icon_opens_the_accessibly_named_sign_in_page(self):
        pages = course.outputs()
        tags = Tags(pages['index.html']).tags
        accounts = [attrs for tag, attrs in tags if tag == 'a' and attrs.get('class') == 'home-account']
        self.assertEqual(len(accounts), 1)
        self.assertEqual(accounts[0]['href'], 'login.html')
        self.assertEqual(accounts[0]['aria-label'], 'Sign in')
        self.assertIn('login.html', pages)

    def test_sign_in_has_no_named_credentials_and_stays_inert_without_its_controller(self):
        tags = Tags(course.outputs()['login.html']).tags
        forms = [a for t, a in tags if t == 'form']
        self.assertEqual(len(forms), 1)
        self.assertEqual(forms[0]['action'], 'login.html')
        fields = [a for t, a in tags if t == 'input']
        self.assertEqual({a['type'] for a in fields}, {'email', 'password'})
        self.assertTrue(all('name' not in a for a in fields))
        self.assertTrue(any(t == 'fieldset' and 'disabled' in a for t, a in tags))
        self.assertTrue(any(t == 'script' and 'login-preview.js' in a.get('src', '') and 'defer' in a for t, a in tags))

    def test_sign_in_failure_and_revision_exit_are_accessible(self):
        html = course.outputs()['login.html']
        tags = Tags(html).tags
        message = next(a for t, a in tags if a.get('id') == 'login-error')
        self.assertEqual(message['role'], 'alert')
        self.assertEqual(message['tabindex'], '-1')
        self.assertIn('hidden', message)
        self.assertIn('Sign-in is not available yet.', html)
        self.assertTrue(any(t == 'a' and a.get('href') == HUB for t, a in tags))
        self.assertFalse(any(t in {'iframe', 'pre', 'code'} for t, _ in tags))

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
