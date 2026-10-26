import { CookbookOptions, CookbookStyle } from '../models/cookbook-export.model';
import { CATEGORIES } from '../models/recipe.constants';
import { Ingredient, Recipe } from '../models/recipe.model';
import { totalMinutes } from './diets';
import { formatQuantity, parseQuantity } from './ingredients';
import { recipeImages, safeImageUrl } from './recipe-images';

const FONTS =
  'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,500&family=DM+Sans:wght@400;500;700&family=Caveat:wght@700&family=Kalam:wght@400;700&family=Manrope:wght@300;500;700&family=Source+Serif+4:wght@400;600&display=swap';

/** Escapes text for HTML, so recipe text can never become markup. */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Recipes grouped by category, in the app's category order, each group sorted by name. */
export function groupByCategory(
  recipes: readonly Recipe[],
): { category: string; recipes: Recipe[] }[] {
  const order = CATEGORIES.map((c) => c.id as string);
  const groups = new Map<string, Recipe[]>();
  for (const recipe of recipes) {
    const key = order.includes(recipe.category) ? recipe.category : 'Other';
    groups.set(key, [...(groups.get(key) ?? []), recipe]);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => order.indexOf(a) - order.indexOf(b))
    .map(([category, list]) => ({
      category,
      recipes: [...list].sort((a, b) => a.name.localeCompare(b.name)),
    }));
}

function quantity(ingredient: Ingredient): string {
  const value = parseQuantity(ingredient.qty);
  const qty = value === null ? (ingredient.qty ?? '') : formatQuantity(value);
  return [qty, ingredient.unit].filter((part) => part?.trim()).join(' ');
}

function recipePage(recipe: Recipe, page: number, options: CookbookOptions): string {
  const { labels, title } = options;
  const e = escapeHtml;
  const photo = safeImageUrl(recipeImages(recipe)[0]?.url);
  const minutes = totalMinutes(recipe);
  const meta = [
    recipe.servings ? labels.serves(recipe.servings) : '',
    minutes ? labels.minutes(minutes) : '',
  ].filter(Boolean);
  const ingredients = (recipe.ingredients ?? [])
    .map((i) => `<li><b>${e(quantity(i))}</b><span>${e(i.name ?? '')}</span></li>`)
    .join('');
  const steps = (recipe.steps ?? []).map((s) => `<li>${e(s)}</li>`).join('');
  const source = recipe.source?.trim()
    ? `<p class="source">${e(labels.source)}: ${e(recipe.source.trim())}</p>`
    : '';
  const notes = recipe.notes?.trim()
    ? `<div class="notes"><h5>${e(labels.notes)}</h5><p>${e(recipe.notes.trim())}</p></div>`
    : '';
  return `
<section class="page recipe">
  ${photo ? `<img class="photo" src="${e(photo)}" alt="" />` : ''}
  <div class="inner">
    <p class="kicker">${e(labels.category(recipe.category))}</p>
    <h2>${e(recipe.name)}</h2>
    ${meta.length ? `<p class="meta">${meta.map((m) => `<span>${e(m)}</span>`).join('')}</p>` : ''}
    ${source}
    <div class="cols">
      <div class="box"><h5>${e(labels.ingredients)}</h5><ul class="ing">${ingredients}</ul></div>
      <div><h5>${e(labels.steps)}</h5><ol class="steps">${steps}</ol>${notes}</div>
    </div>
    <footer><span>${e(title)}</span><span>${page}</span></footer>
  </div>
</section>`;
}

/**
 * Builds the whole printable cookbook as one HTML document: cover, contents and one page per
 * recipe, in A4. The browser's print window then saves it as a PDF.
 */
export function buildCookbookHtml(options: CookbookOptions): string {
  const { style, title, author, labels } = options;
  const e = escapeHtml;
  const groups = groupByCategory(options.recipes);
  const ordered = groups.flatMap((g) => g.recipes);
  // Cover is page 1, contents page 2, recipes from page 3.
  const pageOf = new Map(ordered.map((r, i) => [r.id, i + 3]));
  const contents = groups
    .map(
      (g) =>
        `<div class="toc-group"><h3>${e(labels.category(g.category))}</h3>${g.recipes
          .map(
            (r) =>
              `<div class="toc-row"><span>${e(r.name)}</span><i></i><span>${pageOf.get(r.id)}</span></div>`,
          )
          .join('')}</div>`,
    )
    .join('');
  return `<!doctype html>
<html lang="${e(options.lang)}">
<head>
<meta charset="utf-8" />
<title>${e(title)}</title>
<link rel="stylesheet" href="${FONTS}" />
<style>${COMMON_CSS}${STYLE_CSS[style]}</style>
</head>
<body class="${style}">
<section class="page cover">
  <div class="cover-inner">
    <p class="brand">C00K90</p>
    <h1>${e(title)}</h1>
    ${author ? `<p class="by">${e(labels.by)} ${e(author)}</p>` : ''}
    <p class="count">${e(labels.recipeCount(ordered.length))}</p>
  </div>
</section>
<section class="page toc">
  <h2>${e(labels.contents)}</h2>
  ${contents}
  <footer><span>${e(title)}</span><span>2</span></footer>
</section>
${ordered.map((r) => recipePage(r, pageOf.get(r.id) ?? 0, options)).join('')}
</body>
</html>`;
}

const COMMON_CSS = `
@page { size: A4; margin: 0; }
* { box-sizing: border-box; }
html, body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.page { width: 210mm; min-height: 297mm; padding: 16mm; display: flex; flex-direction: column; break-after: page; position: relative; }
h1, h2, h3, h5 { margin: 0; }
.cover { justify-content: center; }
.toc h2 { font-size: 26pt; margin-bottom: 10mm; }
.toc-group { margin-bottom: 7mm; break-inside: avoid; }
.toc-group h3 { font-size: 9pt; letter-spacing: .14em; text-transform: uppercase; margin-bottom: 2mm; }
.toc-row { display: flex; gap: 2mm; align-items: baseline; font-size: 11pt; padding: 1mm 0; }
.toc-row i { flex: 1; border-bottom: 1px dotted currentColor; opacity: .4; }
.recipe { padding: 0; }
.recipe .photo { width: 100%; height: 90mm; object-fit: cover; display: block; }
.recipe .inner { padding: 12mm 16mm; display: flex; flex-direction: column; gap: 4mm; flex: 1; }
.recipe h2 { font-size: 24pt; line-height: 1.1; }
.kicker, h5 { font-size: 8.5pt; letter-spacing: .14em; text-transform: uppercase; font-weight: 700; }
h5 { margin-bottom: 2mm; }
.meta { display: flex; gap: 2mm; flex-wrap: wrap; margin: 0; }
.meta span { border-radius: 99px; padding: 1mm 3mm; font-size: 9pt; font-weight: 700; }
.source { font-size: 9pt; margin: 0; opacity: .75; }
.cols { display: grid; grid-template-columns: 0.9fr 1.3fr; gap: 6mm; font-size: 10.5pt; line-height: 1.45; }
.ing { list-style: none; margin: 0; padding: 0; }
.ing li { display: grid; grid-template-columns: 18mm 1fr; gap: 2mm; padding: 1mm 0; break-inside: avoid; }
.steps { margin: 0; padding-left: 5mm; }
.steps li { margin-bottom: 2mm; break-inside: avoid; }
.notes { margin-top: 4mm; padding: 3mm; border: 1px dashed currentColor; border-radius: 2mm; }
.notes p { margin: 0; white-space: pre-line; }
footer { margin-top: auto; display: flex; justify-content: space-between; font-size: 8pt; opacity: .6; padding-top: 4mm; }
.cover footer { display: none; }
`;

const STYLE_CSS: Record<CookbookStyle, string> = {
  classic: `
body { font-family: 'DM Sans', sans-serif; color: #1d2a26; }
h1, h2, .toc h2 { font-family: 'Playfair Display', serif; }
.cover { background: linear-gradient(160deg, #163a2f, #0f2a22); color: #f3f7f4; }
.cover h1 { font-size: 48pt; line-height: 1.05; margin: 6mm 0; }
.cover .brand { color: #8fd6b4; letter-spacing: .2em; font-weight: 700; font-size: 10pt; }
.cover .by { font-family: 'Playfair Display', serif; font-style: italic; font-size: 16pt; color: #c9e8da; }
.cover .count { color: #a8cbbb; }
.toc-group h3, h5 { color: #b2386f; }
.recipe { background-color: #eef6f1; background-image: radial-gradient(#cfe5d8 1.2px, transparent 1.3px); background-size: 14px 14px; }
.kicker { color: #2f8f6b; }
.meta span { background: #e6f3ec; color: #2f8f6b; }
.cols { background: #fff; border: 1.5px solid #2f8f6b; border-radius: 4mm; padding: 5mm; box-shadow: 1.5mm 1.5mm 0 #b2386f22; }
.ing b, .steps li::marker { color: #2f8f6b; }
`,
  notebook: `
body { font-family: 'Kalam', cursive; color: #2b3a67; }
h1, h2 { font-family: 'Caveat', cursive; }
/* Lined notebook paper with a red margin; every text line sits on an 8 mm ruled line. */
.page {
  background:
    linear-gradient(90deg, transparent 22mm, #e59a9a 22mm 22.4mm, transparent 22.4mm),
    repeating-linear-gradient(to bottom, transparent 0 7.7mm, #cfdcec 7.7mm 8mm),
    #fbf6e9;
}
.cover { align-items: center; text-align: center;
  background: radial-gradient(rgba(255,240,228,.28) 1.1px, transparent 1.3px) 0 0 / 28px 28px,
    linear-gradient(150deg, #f3d6c8 0%, #d39a88 45%, #9c5a4b 100%); }
.cover-inner { background: #fbf6e9; border: 2px dashed #2b3a67; border-radius: 2mm; padding: 12mm 10mm; transform: rotate(-2deg); box-shadow: 0 3mm 6mm rgba(0,0,0,.2); }
.cover h1 { font-size: 44pt; line-height: 1; margin: 3mm 0; color: #b23a48; }
.cover .brand { font-size: 10pt; letter-spacing: .2em; }
.toc, .recipe .inner { line-height: 8mm; font-size: 16.5pt; }
.toc > *, .recipe .inner > * { position: relative; top: 2.4mm; }
.toc { padding-left: 28mm; }
.toc h2, .recipe h2 { color: #b23a48; font-size: 42pt; line-height: 16mm; margin: 0 0 8mm; }
.recipe h2 { margin: 0; }
.toc-group { margin-bottom: 8mm; }
.toc-group h3, h5, .kicker { color: #b23a48; margin: 0; line-height: 8mm; font-size: 12pt; }
.toc-row { padding: 0; font-size: 16.5pt; }
.recipe .inner { padding: 16mm 16mm 16mm 28mm; gap: 0; }
.recipe .photo { position: absolute; top: 18mm; right: 16mm; width: 70mm; height: 54mm; border: 3mm solid #fff; box-shadow: 0 2mm 4mm rgba(0,0,0,.15); transform: rotate(3deg); z-index: 1; }
.recipe:has(.photo) .kicker, .recipe:has(.photo) h2 { padding-right: 78mm; }
.meta { margin: 0; display: block; }
.meta span { padding: 0; font-weight: 400; font-size: 15pt; }
.meta span + span::before { content: ' · '; }
.source { margin: 0; font-size: 14pt; }
.cols { display: block; margin-top: 8mm; font-size: 16.5pt; line-height: 8mm; }
.recipe:has(.photo) .cols { margin-top: 24mm; }
.cols > div + div { margin-top: 8mm; }
.ing li { padding: 0; grid-template-columns: 32mm 1fr; }
.ing b { font-weight: 700; }
.steps { padding-left: 7mm; }
.steps li { margin: 0; }
.notes { margin-top: 8mm; padding: 0; border: 0; }
footer { padding-top: 8mm; line-height: 8mm; font-size: 10pt; }
`,
  minimal: `
body { font-family: 'Source Serif 4', serif; color: #111; }
h1, h2, .toc h2 { font-family: 'Manrope', sans-serif; font-weight: 300; letter-spacing: -.01em; }
.cover { justify-content: flex-end; }
.cover h1 { font-size: 46pt; line-height: 1; border-top: 1px solid #111; padding-top: 5mm; margin: 4mm 0; }
.cover .brand, .cover .count, .cover .by { font-family: 'Manrope', sans-serif; font-size: 9pt; letter-spacing: .2em; text-transform: uppercase; }
.recipe h2 { text-transform: uppercase; letter-spacing: .04em; }
.recipe .inner { background-color: #fff; background-image: repeating-linear-gradient(45deg, #b9b9b9 0 0.6px, transparent 0.6px 14px); }
.meta span { border: 1px solid #111; }
.cols { background: #fff; outline: 1px solid #111; outline-offset: 1.5mm; padding: 5mm; }
.box { border-right: 1px solid #ddd; padding-right: 4mm; }
`,
};
