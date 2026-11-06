# Le Ricette di Daniela e Mirko

[maischberger.it](https://maischberger.it) is our family recipe book. Recipes are
written in Markdown so that they can be maintained in Obsidian or any text
editor, reviewed on GitHub, and published as a searchable static website.

## Design principles

The site must work for everyone, on any device, before it works well for anyone.

1. **Content and navigation work without JavaScript.** Every recipe, the
   recipe list, the categories and the link back home are plain HTML: links,
   lists and `<details>`/`<summary>`. Scripts only add extras on top (search,
   the cooking view, timers, keeping the screen on), and the page stays
   complete when they are off or fail.
2. **The site reads in a text-only browser.** In `links`, `lynx` or `w3m`, or
   with CSS turned off, a page is a title, one list of recipes and the recipe
   in reading order. Nothing appears twice, and nothing important exists only
   as an image or a style.
3. **Accessible by construction.** Use real elements: `<a href>` to go
   somewhere, `<button>` to do something, `<nav>` with a label, headings in
   order. Add ARIA only when HTML has no element for the job. Everything works
   with the keyboard, focus stays visible, and text keeps at least 4.5:1
   contrast.
4. **One markup, many layouts.** Phone, tablet and desktop get the same HTML;
   CSS rearranges it (a column on wide screens, rows on narrow ones). No
   content is hidden on one screen size without being reachable on the others.
5. **Recipes come first.** The start of a recipe (title, ingredients, the
   cooking view button) is visible on the first screen. Photos stay at full
   quality but never push the recipe out of view.

Every pull request is checked against these principles: see the manual QA
checklist in the pull request template.

## Repository structure

| Path                  | Purpose                                                     |
| --------------------- | ----------------------------------------------------------- |
| `docs/`               | Website source and home page                                |
| `docs/Basi/`          | Preparations and reference notes used by other recipes      |
| `docs/Dolci/`         | Desserts and sweet baking                                   |
| `docs/Pane e pizza/`  | Bread, buns, focaccia, and pizza                            |
| `docs/Primi/`         | Pasta, rice, soups, and other first courses                 |
| `docs/Salse/`         | Sauces and condiments                                       |
| `docs/Secondi/`       | Main courses                                                |
| `docs/images/`        | Shared recipe and site images                               |
| `Templates/Recipe.md` | Starting point for a new recipe                             |
| `overrides/`          | Theme templates, including comments and the custom 404 page |
| `zensical.toml`       | Site metadata, Material theme, search, tags, and analytics  |
| `.github/workflows/`  | Pull-request checks and deployment automation               |

Recipe categories are represented by directories rather than a manually
maintained navigation list. This keeps the site structure aligned with the
Obsidian vault and lets the site generator derive navigation from the files.

## Add or edit a recipe

1. Copy `Templates/Recipe.md` into the appropriate category under `docs/` and
   rename it to match the recipe.
2. Update the YAML front matter. Keep `tags` as a YAML list and leave
   `comments: "true"` enabled when comments should appear on the page.
3. Replace the placeholder image, introduction, ingredients, preparation, and
   tips.
4. Put images in `docs/images/` and link them relative to the recipe—for example,
   `![](../images/my-recipe.jpeg)`.
5. Preview the site and run the formatting check before opening a pull request.
6. Open every changed page in the local preview at phone width and check it by
   hand (see the checklist in the pull request template).

Conventions checked automatically by `tests/test_recipe_conventions.py`:

- Preparation steps are a numbered list (`1.`), never `-` bullets. Numbering
  continues across photos and bold sub-headings; a short closing sentence may
  stay unnumbered.
- When the yield is known, the first ingredient is
  `- Dose per N persone` (or `muffin`, `pancakes`, `bicchieri`). It drives
  `recipeYield` and portion scaling; leave it out when unknown.
- Links have no space between `]` and `(`.
- `date_modified` is not older than the last commit that changed the file. It
  feeds `dateModified` and the sitemap's `lastmod`, which tell Google what to
  re-read.

### Cooking view

Every recipe page has a **Modalità cucina** button
(`docs/javascripts/cucina.js`, `docs/stylesheets/cucina.css`). It reads the
_Ingredienti_ and _Preparazione_ sections, starts with a mise en place screen
(all ingredients, and the dose when a `Dose per` line exists), then shows one
step at a time with that step's ingredients first and highlighted.

Ingredients are matched to steps automatically by their words. Generic phrases
are handled too: "tutti gli ingredienti", "gli altri ingredienti",
"a parte …", ingredient group names ("il soffritto", "i liquidi"), "tuorli" and
"albumi" for eggs, "soffriggere"/"rosolare" for oil and "salare" for salt.
When a step uses words the ingredient list does not, add a correction to the
recipe's front matter, mapping the phrase to parts of ingredient names:

```yaml
cucina_abbinamenti:
  "tre spezie": [Cumino, Curry, Timo]
```

The [recipe template](Templates/Recipe.md) is the single source of truth for
recipe structure and contains examples of supported Markdown. Update it directly
when the shared format changes instead of duplicating those conventions here.

### Recipe metadata

New recipes must provide the metadata included in the recipe template. These
fields form the editorial source for page metadata and future structured recipe
data:

| Field            | Format                    | Purpose                                  |
| ---------------- | ------------------------- | ---------------------------------------- |
| `title`          | Text                      | Full recipe name                         |
| `description`    | One or two sentences      | Unique summary of the recipe             |
| `author`         | Text                      | Recipe author                            |
| `date_published` | `YYYY-MM-DD`              | Original publication date                |
| `date_modified`  | `YYYY-MM-DD`              | Date of the latest change to the file    |
| `schema_type`    | `Recipe` or `Article`     | Structured-data type for the page        |
| `image`          | Site-root-relative path   | Main recipe image                        |
| `image_alt`      | Descriptive text          | Accessible description of the main image |
| `category`       | Text                      | Course or recipe category                |
| `cuisine`        | Text                      | Culinary tradition, when attributable    |
| `prep_time`      | ISO 8601 duration         | Active preparation time                  |
| `cook_time`      | ISO 8601 duration         | Cooking time                             |
| `total_time`     | ISO 8601 duration         | Overall preparation time                 |
| `tags`           | YAML list                 | Site navigation and discovery terms      |
| `comments`       | Quoted `"true"`/`"false"` | Whether comments are displayed           |

Durations use the ISO 8601 notation: `PT20M` means 20 minutes, `PT1H` means one
hour, and `PT1H30M` means one hour and 30 minutes. Keep `description` concise and
specific, and describe what is visible in `image_alt` rather than repeating the
recipe title. Metadata must match the information shown in the recipe body.
Use paths such as `images/pasta-e-ceci.jpeg` for `image`; unlike the image link
in the Markdown body, this path is relative to the root of the published site.
Use `Article` for reference pages that are not recipes. Do not add an `image`,
`cuisine`, servings, or times when the corresponding information is unavailable:
missing data is preferable to placeholder, generic, or estimated structured
data.

### Markdown compatibility

Use standard Markdown links with explicit relative paths. Obsidian can resolve
short wiki links automatically, but the website generator, GitHub, VS Code, and
other Markdown readers may not. For example:

```markdown
[Pasta all'uovo](../Basi/Pasta%20all'uovo.md)
![](../images/pasta-all-uovo.jpeg)
```

## Local preview

The project requires Python 3.11.15 and pins its site-generator dependency in
`pyproject.toml`. With [`uv`](https://docs.astral.sh/uv/) installed:

```bash
uv sync
uv run zensical serve -f zensical.toml
```

Open the local address printed by Zensical. To produce the same static output
used for deployment, run:

```bash
uv run zensical build -f zensical.toml
```

Formatting is checked with Prettier in CI:

```bash
npx prettier --check '**/*.{yml,md}'
```

## Publishing workflow

- Pull requests and pushes to `main` run the Prettier check in
  `.github/workflows/check.yml`.
- Pushes to `main` also run `.github/workflows/build.yml`.
- The build workflow creates a release tag, builds the site with Zensical, and
  publishes `site/` to the GitHub Pages branch.
- `docs/CNAME` assigns the published site to `maischberger.it`.

## Repository review and next steps

The current layout is small and easy to browse: all recipes follow the same
category-based structure, media is centralized, and the template establishes a
recognizable page format. The main opportunities are consistency and automated
validation rather than a structural rewrite.

Recommended order of work:

1. **Validate internal links and images in CI.** This prevents Obsidian-only
   links or renamed assets from reaching the published site.
2. **Standardize recipe metadata.** Define the supported front-matter fields and
   a controlled set of category and author tags, then normalize existing
   recipes.
3. **Complete recipe content.** Replace remaining placeholder images and sample
   template text, and check ingredient units and preparation numbering.
4. **Improve discovery.** Add short category landing pages only if automatic
   navigation and tags become insufficient as the collection grows.
5. **Document editorial conventions.** Agree on language, capitalization,
   serving notation, units, image alt text, and optional source attribution.

These steps preserve the current Obsidian-friendly workflow while making the
published result more predictable and easier to maintain.

## Recipe metadata and images

The `recipe_seo` Markdown extension runs inside normal `zensical build` and
`zensical serve` rendering. It supplies ingredient lists and preparation steps
to the JSON-LD template directly from the recipe body, including prose steps.
Serving-count bullets become yield metadata, not ingredients. Times are taken
only from front matter. Keep the `Ingredienti` and `Preparazione` level-two
headings; missing sections on recipes with images fail rendering.

The extension reads local image dimensions and keeps the first image eager while
lazy-loading subsequent photos. No generated HTML files are rewritten, and no
additional build command is needed. Run tests with:

```bash
uv run python -m unittest discover -s tests
```

### Hosting follow-up

These settings live outside the repository and are not changed by a deployment:

1. In [repository Pages settings](https://github.com/baol/recipes/settings/pages),
   enable **Enforce HTTPS**. The audit found it disabled.
2. At the DNS provider, configure `www` as a CNAME to `baol.github.io`, keeping
   `maischberger.it` as the Pages custom domain. Verify that GitHub provisions a
   certificate covering `www.maischberger.it` and redirects it to the apex domain.
3. After deployment, verify both HTTP and HTTPS hostname redirects, run Google's
   Rich Results Test on a recipe, and submit `https://maischberger.it/sitemap.xml`
   in Search Console.

See GitHub's [HTTPS guidance](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https)
and [custom-domain guidance](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/about-custom-domains-and-github-pages).
