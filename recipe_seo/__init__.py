"""Derive recipe metadata and image attributes during Markdown rendering."""

import re
from pathlib import Path
from urllib.parse import unquote, urlsplit

from markdown.extensions import Extension
from markdown.treeprocessors import Treeprocessor
from PIL import Image
from zensical.extensions.context import ContextPreprocessor


def text(element):
    return ' '.join(''.join(element.itertext()).split())


def section_blocks(root, label):
    active = False
    for element in root:
        if element.tag in ('h1', 'h2'):
            active = element.tag == 'h2' and label in text(element)
        elif active:
            if element.tag in ('ul', 'ol'):
                yield from element.findall('li')
            elif element.tag == 'p':
                yield element


class RecipeTreeprocessor(Treeprocessor):
    def run(self, root):
        context = ContextPreprocessor.from_markdown(self.md)
        if context is None:
            raise ValueError('recipe_seo requires Zensical page context')
        meta = context.page.meta
        if meta.get('schema_type') == 'Recipe' and meta.get('image'):
            ingredients = []
            for block in section_blocks(root, 'Ingredienti'):
                if block.tag != 'li':
                    continue
                value = text(block)
                servings = re.fullmatch(r'(\d+)\s+(?:Servings|persone|porzioni)', value)
                if servings:
                    meta.setdefault('servings', int(servings[1]))
                elif value:
                    ingredients.append(value)
            steps = [
                {'@type': 'HowToStep', 'text': value}
                for block in section_blocks(root, 'Preparazione')
                if (value := text(block))
            ]
            if not ingredients or not steps:
                raise ValueError(f'Missing recipe sections: {context.page.path}')
            meta['recipe_ingredients'] = ingredients
            meta['recipe_instructions'] = steps

        docs = Path(context.config['docs_dir']).resolve()
        source = Path(context.page.path)
        for index, img in enumerate(root.iter('img')):
            src = urlsplit(img.get('src', ''))
            if src.scheme or src.netloc or not src.path:
                continue
            image_path = (
                docs / unquote(src.path).lstrip('/')
                if src.path.startswith('/')
                else docs / source.parent / unquote(src.path)
            ).resolve()
            if not image_path.is_relative_to(docs):
                raise ValueError(f'Image outside docs directory: {image_path}')
            with Image.open(image_path) as image:
                width, height = image.size
            img.set('width', str(width))
            img.set('height', str(height))
            img.set('loading', 'eager' if index == 0 else 'lazy')


class RecipeExtension(Extension):
    def extendMarkdown(self, md):
        # After inline markup, before TOC anchors and relative URL rewriting.
        md.treeprocessors.register(RecipeTreeprocessor(md), 'recipe_seo', 8)


def makeExtension(**kwargs):
    return RecipeExtension(**kwargs)
