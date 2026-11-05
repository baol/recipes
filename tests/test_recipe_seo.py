import tempfile
import unittest
from pathlib import Path
from xml.etree import ElementTree

from markdown import Markdown
from PIL import Image
from zensical.extensions.context import ContextExtension, Page

from recipe_seo import RecipeExtension


class RecipeSeoTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.docs = Path(self.directory.name)

    def render(self, content, meta, path='Basi/Pasta.md'):
        page = Page(url='Basi/Pasta/', path=path, meta=meta)
        return Markdown(extensions=[
            ContextExtension(page=page, config={'docs_dir': str(self.docs)}),
            RecipeExtension(),
        ]).convert(content)

    def test_recipe_preserves_prose_and_excludes_serving_counts(self):
        meta = {'schema_type': 'Recipe', 'image': 'images/pizza.jpg'}
        html = self.render('''## 🧾 Ingredienti

- Dose per 6 pancakes (2 o 3 persone)
- 350 g **Farina**

## 👩‍🍳 Preparazione

Iniziare il giorno prima.

1. Impastare **bene**.

Infornare a piacere.

## Consigli

Not a step.
''', meta)
        self.assertEqual(meta['servings'], 6)
        self.assertEqual(meta['servings_unit'], 'pancakes')
        self.assertIn('<li id="passo-2">', html)
        self.assertEqual(meta['recipe_ingredients'], ['350 g Farina'])
        self.assertEqual(meta['recipe_instructions'], [
            {'@type': 'HowToStep', 'text': 'Iniziare il giorno prima.', 'url': '#passo-1'},
            {'@type': 'HowToStep', 'text': 'Impastare bene.', 'url': '#passo-2'},
            {'@type': 'HowToStep', 'text': 'Infornare a piacere.', 'url': '#passo-3'},
        ])

    def test_numbered_steps_continue_after_photos_and_headings(self):
        html = self.render('''## Preparazione

1. Primo
2. Secondo

**Crema**

1. Terzo

## Consigli

1. Non un passo
''', {})
        lists = list(ElementTree.fromstring(f'<div>{html}</div>').iter('ol'))
        self.assertEqual([ol.get('start') for ol in lists], [None, '3', None])

    def test_three_space_sub_items_stay_nested(self):
        html = self.render('1. Cuocere\n   - sotto-punto\n2. Servire\n', {})
        root = ElementTree.fromstring(f'<div>{html}</div>')
        self.assertEqual(len(root.find('ol').findall('li')), 2)
        self.assertEqual(root.find('ol/li/ul/li').text, 'sotto-punto')

    def test_local_images_receive_dimensions_and_loading_during_render(self):
        (self.docs / 'images').mkdir()
        Image.new('RGB', (120, 80)).save(self.docs / 'images/foto uno.jpg')
        html = self.render('''![Prima](../images/foto%20uno.jpg)

![Seconda](../images/foto%20uno.jpg)
''', {})
        images = list(ElementTree.fromstring(f'<div>{html}</div>').iter('img'))
        self.assertEqual([i.get('loading') for i in images], ['eager', 'lazy'])
        self.assertTrue(all(i.get('width') == '120' and i.get('height') == '80'
                            for i in images))
        self.assertEqual([i.get('alt') for i in images], ['Prima', 'Seconda'])

    def test_incomplete_recipe_fails_rendering(self):
        with self.assertRaisesRegex(ValueError, 'Missing recipe sections'):
            self.render('## Ingredienti\n\n- Farina',
                        {'schema_type': 'Recipe', 'image': 'images/pasta.jpg'})

    def test_reference_page_does_not_receive_recipe_metadata(self):
        meta = {'schema_type': 'Article'}
        self.render('## Ingredienti\n\n- Farina', meta)
        self.assertNotIn('recipe_ingredients', meta)


if __name__ == '__main__':
    unittest.main()
