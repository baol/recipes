# Le Ricette di Daniela e Mirko

[maischberger.it](https://maischberger.it) is our family recipe book. Recipes are
written in Markdown so that they can be maintained in Obsidian or any text
editor, reviewed on GitHub, and published as a searchable static website.

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
| `date_modified`  | `YYYY-MM-DD`              | Date of the latest substantive update    |
| `schema_type`    | `Recipe` or `Article`     | Structured-data type for the page        |
| `image`          | Site-root-relative path   | Main recipe image                        |
| `image_alt`      | Descriptive text          | Accessible description of the main image |
| `category`       | Text                      | Course or recipe category                |
| `cuisine`        | Text                      | Culinary tradition                       |
| `servings`       | Positive whole number     | Number of servings                       |
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
servings, or times when the corresponding information is unavailable: missing
data is preferable to placeholder or estimated structured data.

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
