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
        self.render('''## 🧾 Ingredienti

- 2 Servings
- 350 g **Farina**

## 👩‍🍳 Preparazione

Iniziare il giorno prima.

1. Impastare **bene**.

Infornare a piacere.

## Consigli

Not a step.
''', meta)
        self.assertEqual(meta['servings'], 2)
        self.assertEqual(meta['recipe_ingredients'], ['350 g Farina'])
        self.assertEqual(meta['recipe_instructions'], [
            {'@type': 'HowToStep', 'text': 'Iniziare il giorno prima.'},
            {'@type': 'HowToStep', 'text': 'Impastare bene.'},
            {'@type': 'HowToStep', 'text': 'Infornare a piacere.'},
        ])

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
