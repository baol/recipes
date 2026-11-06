"""Check that every recipe follows the shared Markdown conventions."""

import re
import subprocess
import unittest
from pathlib import Path
from xml.etree import ElementTree

from markdown import Markdown
from markdown.extensions import Extension

from recipe_seo import NestedListPreprocessor

DOCS = Path(__file__).resolve().parent.parent / 'docs'
DOSE = re.compile(r'- Dose per \d+ (persone|muffin|pancakes|bicchieri)\b.*')
OLD_DOSE = re.compile(
    r'^(- )?(Per |Dosi? per )?\d+( o \d+)? (Servings|Persone|persone|porzioni|Muffin)\b',
    re.I)


def recipes():
    for path in sorted(DOCS.rglob('*.md')):
        text = path.read_text(encoding='utf-8')
        if 'schema_type: "Recipe"' in text:
            yield path.relative_to(DOCS), text


def section(text, label):
    match = re.search(rf'^## [^\n]*{label}\n(.*?)(?=^## |\Z)', text, re.S | re.M)
    return match[1] if match else ''


class RecipeConventionTests(unittest.TestCase):
    def test_steps_are_numbered(self):
        for path, text in recipes():
            with self.subTest(recipe=str(path)):
                bullets = re.findall(r'^- .*', section(text, 'Preparazione'), re.M)
                self.assertEqual(bullets, [], 'use "1." numbered steps, not "-"')

    def test_dose_line_format_and_position(self):
        for path, text in recipes():
            with self.subTest(recipe=str(path)):
                body = text.split('\n---', 2)[-1]
                before_steps = body.split('Preparazione', 1)[0]
                old = [line for line in before_steps.split('\n')
                       if OLD_DOSE.match(line.strip('_ ')) and not DOSE.fullmatch(line)]
                self.assertEqual(old, [], 'write the yield as "- Dose per N persone"')
                items = re.findall(r'^- .*', section(text, 'Ingredienti'), re.M)
                doses = [i for i, item in enumerate(items) if item.startswith('- Dose per')]
                for index in doses:
                    self.assertTrue(DOSE.fullmatch(items[index]), items[index])
                    self.assertEqual(index, 0, '"Dose per" must be the first ingredient')

    def test_rendered_steps_match_numbered_lines(self):
        class Nested(Extension):
            def extendMarkdown(self, md):
                md.preprocessors.register(NestedListPreprocessor(md), 'nested', 25)

        for path, text in recipes():
            with self.subTest(recipe=str(path)):
                steps = section(text, 'Preparazione')
                numbered = len(re.findall(r'^\d+\. ', steps, re.M))
                html = Markdown(extensions=['md_in_html', Nested()]).convert(steps)
                root = ElementTree.fromstring(f'<div>{html}</div>')
                rendered = sum(len(ol.findall('li')) for ol in root.findall('ol'))
                self.assertEqual(rendered, numbered, 'a sub-item became a step')

    def test_links_are_well_formed(self):
        for path, text in recipes():
            with self.subTest(recipe=str(path)):
                self.assertEqual(re.findall(r'\]\s+\(', text), [],
                                 'no space between "]" and "(" in links')

    def test_date_modified_is_not_older_than_last_change(self):
        root = DOCS.parent

        def git(*args):
            return subprocess.run(['git', *args], cwd=root, capture_output=True,
                                  text=True).stdout.strip()

        if git('rev-parse', '--is-shallow-repository') != 'false':
            self.skipTest('needs the full git history')
        for path, text in recipes():
            with self.subTest(recipe=str(path)):
                match = re.search(r'^date_modified: "(\d{4}-\d{2}-\d{2})"', text, re.M)
                self.assertIsNotNone(match, 'date_modified: "YYYY-MM-DD" is missing')
                last = git('log', '-1', '--no-merges', '--format=%as', '--',
                           str(Path('docs') / path))
                if last:
                    self.assertGreaterEqual(
                        match[1], last,
                        f'the file changed on {last}: update date_modified')


if __name__ == '__main__':
    unittest.main()
