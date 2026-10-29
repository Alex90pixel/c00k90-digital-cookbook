import { CookbookOptions, CookbookStyle } from '../models/cookbook-export.model';
import { CATEGORIES } from '../models/recipe.constants';
import { Ingredient, Recipe } from '../models/recipe.model';
import { totalMinutes } from './diets';
import { formatQuantity, parseQuantity } from './ingredients';
import { recipeImages, safeImageUrl } from './recipe-images';

const FONTS =
  'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,500&family=DM+Sans:wght@400;500;700&family=Caveat:wght@700&family=Kalam:wght@400;700&family=Manrope:wght@300;500;700&family=Source+Serif+4:wght@400;600&family=Cormorant+Garamond:ital,wght@0,300;0,500;1,400&family=Parisienne&display=swap';

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

/** One page of the contents: whole groups, or the part of a long group that fits. */
export type ContentsPage = { category: string; recipes: Recipe[] }[];

/**
 * Splits the contents over as many pages as needed. A category heading takes the room of two
 * rows; the first page has less room because of the "Contents" title. A category that doesn't
 * fit continues on the next page under its heading again.
 */
export function paginateContents(
  groups: readonly { category: string; recipes: Recipe[] }[],
  rowsPerPage: number,
  titleRows = 4,
): ContentsPage[] {
  const pages: ContentsPage[] = [[]];
  let room = rowsPerPage - titleRows;
  for (const group of groups) {
    let rest = group.recipes;
    while (rest.length) {
      // Start a new page when not even the heading and one recipe fit.
      if (room < 3) {
        pages.push([]);
        room = rowsPerPage;
      }
      const fit = rest.slice(0, room - 2);
      pages[pages.length - 1].push({ category: group.category, recipes: fit });
      room -= fit.length + 2;
      rest = rest.slice(fit.length);
    }
  }
  return pages;
}

/** Contents rows that fit on one A4 page, per style (the notebook writes bigger, on 8 mm lines). */
const CONTENTS_ROWS: Record<CookbookStyle, number> = {
  classic: 36,
  notebook: 30,
  minimal: 33,
  moody: 36,
};

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
  // The photo stays a modest size: many recipe photos are small and would look blurry full-width.
  return `
<section class="page recipe">
  <div class="inner">
    <div class="head">
      <div class="head-text">
        <p class="kicker">${e(labels.category(recipe.category))}</p>
        <h2>${e(recipe.name)}</h2>
        ${meta.length ? `<p class="meta">${meta.map((m) => `<span>${e(m)}</span>`).join('')}</p>` : ''}
        ${source}
      </div>
      ${photo ? `<img class="photo" src="${e(photo)}" alt="" />` : ''}
    </div>
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
  const contentsPages = paginateContents(groups, CONTENTS_ROWS[style]);
  // Cover is page 1, then the contents pages, then one page per recipe.
  const firstRecipePage = 2 + contentsPages.length;
  const pageOf = new Map(ordered.map((r, i) => [r.id, i + firstRecipePage]));
  const contents = contentsPages
    .map(
      (page, i) => `
<section class="page toc">
  ${i === 0 ? `<h2>${e(labels.contents)}</h2>` : ''}
  ${page
    .map(
      (g) =>
        `<div class="toc-group"><h3>${e(labels.category(g.category))}</h3>${g.recipes
          .map(
            (r) =>
              `<div class="toc-row"><span>${e(r.name)}</span><i></i><span>${pageOf.get(r.id)}</span></div>`,
          )
          .join('')}</div>`,
    )
    .join('')}
  <footer><span>${e(title)}</span><span>${i + 2}</span></footer>
</section>`,
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
${contents}
${ordered.map((r) => recipePage(r, pageOf.get(r.id) ?? 0, options)).join('')}
</body>
</html>`;
}

const COMMON_CSS = `
@page { size: A4; margin: 0; }
* { box-sizing: border-box; }
html, body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
/* Every page is exactly one A4 sheet; a long recipe is shrunk to fit (see fitPagesToA4). */
.page { width: 210mm; height: 297mm; overflow: hidden; padding: 16mm; display: flex; flex-direction: column; break-after: page; position: relative; }
h1, h2, h3, h5 { margin: 0; }
.cover { justify-content: center; }
.toc h2 { font-size: 26pt; margin-bottom: 10mm; }
.toc-group { margin-bottom: 7mm; break-inside: avoid; }
.toc-group h3 { font-size: 9pt; letter-spacing: .14em; text-transform: uppercase; margin-bottom: 2mm; }
.toc-row { display: flex; gap: 2mm; align-items: baseline; font-size: 11pt; padding: 1mm 0; }
.toc-row i { flex: 1; border-bottom: 1px dotted currentColor; opacity: .4; }
.recipe { padding: 0; }
.head { display: flex; gap: 8mm; align-items: center; }
.head-text { flex: 1; display: flex; flex-direction: column; gap: 3mm; }
.recipe .photo { width: 70mm; height: 70mm; object-fit: cover; display: block; flex: none; }
.recipe .inner { padding: 16mm; display: flex; flex-direction: column; gap: 7mm; flex: 1; }
.recipe h2 { font-size: 26pt; line-height: 1.1; }
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
/* Recipe card: warm cream, serif titles, two rounded panels and numbered steps. */
html { background: #faf6ef; }
body { font-family: 'DM Sans', sans-serif; color: #2f3a2b; }
h1, h2, .toc h2 { font-family: 'Playfair Display', serif; font-weight: 700; color: #2f3a2b; }
.page { background: #faf6ef; }
.cover { align-items: center; text-align: center; }
.cover-inner { border: 1px solid #c9b994; outline: 1px solid #c9b994; outline-offset: 3mm; padding: 26mm 16mm; width: 140mm; }
.cover .brand { font-size: 9pt; letter-spacing: .35em; color: #8a7a55; font-weight: 700; }
.cover h1 { font-size: 46pt; line-height: 1.05; margin: 8mm 0 4mm; }
.cover .by { font-family: 'Parisienne', cursive; font-size: 24pt; color: #8a6d3b; margin: 0; }
.cover .count { margin-top: 10mm; font-size: 9pt; letter-spacing: .3em; text-transform: uppercase; color: #8a7a55; }
.toc h2 { text-align: center; font-size: 32pt; }
.toc-group h3, .kicker { color: #8a6d3b; }
.toc-row i { border-color: #c9b994; opacity: 1; }
.kicker { letter-spacing: .3em; }
.recipe h2 { font-size: 30pt; }
.meta { gap: 0; }
.meta span { padding: 0; font-weight: 700; font-size: 8.5pt; letter-spacing: .25em; text-transform: uppercase; color: #6f7a5c; }
.meta span + span::before { content: '·'; margin: 0 2.5mm; }
.recipe .photo { border-radius: 6mm; box-shadow: 0 2mm 6mm rgba(60, 45, 20, .15); }
.cols { gap: 5mm; }
.cols > div { background: #fffdf8; border: 1px solid #e8dfcf; border-radius: 5mm; padding: 6mm; }
h5 { font-family: 'Playfair Display', serif; font-size: 15pt; letter-spacing: 0; text-transform: none; color: #2f3a2b; border-bottom: 1px solid #e8dfcf; padding-bottom: 2mm; margin-bottom: 3mm; }
.ing li { border-bottom: 1px dotted #e8dfcf; }
.ing b { color: #8a6d3b; }
.steps { list-style: none; padding: 0; counter-reset: step; }
.steps li { counter-increment: step; display: grid; grid-template-columns: 7mm 1fr; gap: 3mm; margin-bottom: 3mm; }
.steps li::before { content: counter(step); width: 7mm; height: 7mm; border-radius: 50%; background: #2f3a2b; color: #faf6ef; font-size: 9pt; font-weight: 700; display: flex; align-items: center; justify-content: center; }
.notes { border-color: #c9b994; }
`,
  notebook: `
html { background: #fbf6e9; }
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
.toc > *, .recipe .inner > *, .head-text > * { position: relative; top: 2.4mm; }
.head-text > * { top: 0; }
.toc { padding-left: 28mm; }
.toc h2, .recipe h2 { color: #b23a48; font-size: 42pt; line-height: 16mm; margin: 0 0 8mm; }
.recipe h2 { margin: 0; }
.toc-group { margin-bottom: 8mm; }
.toc-group h3, h5, .kicker { color: #b23a48; margin: 0; line-height: 8mm; font-size: 12pt; }
.toc-row { padding: 0; font-size: 16.5pt; }
.recipe .inner { padding: 16mm 16mm 16mm 28mm; gap: 0; }
.recipe .photo { position: absolute; top: 18mm; right: 16mm; width: 70mm; height: 54mm; border: 3mm solid #fff; box-shadow: 0 2mm 4mm rgba(0,0,0,.15); transform: rotate(3deg); z-index: 1; }
.head { display: block; }
.head-text { display: block; }
.recipe:has(.photo) .head-text { padding-right: 78mm; }
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
/* Golden coast: soft beige, thin spaced capitals, a script word and a round photo. */
html { background: #f6f1ea; }
body { font-family: 'DM Sans', sans-serif; color: #5b4a3c; }
h1, h2, .toc h2 { font-family: 'Cormorant Garamond', serif; font-weight: 300; text-transform: uppercase; letter-spacing: .12em; color: #4a3a2e; }
.page { background: #f6f1ea; }
.cover { align-items: center; text-align: center; }
.cover .brand { font-size: 9pt; letter-spacing: .4em; color: #a8927a; }
.cover h1 { font-size: 44pt; line-height: 1.1; margin: 6mm 0 2mm; }
.cover .by { font-family: 'Parisienne', cursive; font-size: 26pt; color: #a07c5b; text-transform: none; margin: 0; }
.cover .count { margin-top: 10mm; font-size: 9pt; letter-spacing: .35em; text-transform: uppercase; color: #a8927a; }
.cover-inner::before { content: ''; display: block; width: 60mm; height: 60mm; margin: 0 auto 12mm; border-radius: 50%; border: 1px solid #d8c8b4; box-shadow: 0 0 0 4mm #efe6da; }
.toc h2 { text-align: center; font-size: 28pt; }
.toc-group h3 { font-family: 'Parisienne', cursive; font-size: 18pt; letter-spacing: 0; text-transform: none; color: #a07c5b; font-weight: 400; }
.toc-row i { border-color: #d8c8b4; opacity: 1; }
.kicker { font-family: 'Parisienne', cursive; font-size: 20pt; letter-spacing: 0; text-transform: none; font-weight: 400; color: #a07c5b; }
.recipe h2 { font-size: 28pt; line-height: 1.15; }
.meta { gap: 0; }
.meta span { padding: 0; font-size: 8pt; letter-spacing: .3em; text-transform: uppercase; font-weight: 500; color: #a8927a; }
.meta span + span::before { content: '♡'; margin: 0 3mm; color: #c9a98a; }
.recipe .photo { width: 64mm; height: 64mm; border-radius: 50%; border: 2.5mm solid #fff; box-shadow: 0 0 0 1px #d8c8b4, 0 3mm 8mm rgba(90, 70, 50, .15); }
.cols { gap: 7mm; }
.box { background: #efe6da; border-radius: 5mm; padding: 6mm; }
h5 { font-size: 8pt; letter-spacing: .3em; color: #8a7360; font-weight: 500; margin-bottom: 3mm; }
.ing li { border-bottom: 1px solid #e2d6c6; }
.ing b { color: #a07c5b; font-weight: 500; }
.steps { list-style: none; padding: 0; counter-reset: step; }
.steps li { counter-increment: step; display: grid; grid-template-columns: 8mm 1fr; gap: 3mm; margin-bottom: 3.5mm; }
.steps li::before { content: counter(step); width: 7mm; height: 7mm; border-radius: 50%; border: 1px solid #c9a98a; color: #a07c5b; font-size: 8.5pt; display: flex; align-items: center; justify-content: center; }
footer { justify-content: center; gap: 4mm; letter-spacing: .3em; text-transform: uppercase; font-size: 7pt; }
footer span + span::before { content: '♡  '; }
`,
  moody: `
/* Moody: dark slate, warm gold accents and an elegant script. */
html { background: #1f2326; }
body { font-family: 'DM Sans', sans-serif; color: #e9e4da; }
h1, h2, .toc h2 { font-family: 'Playfair Display', serif; font-weight: 600; color: #f4efe6; }
.page { background: #1f2326; }
.cover { align-items: center; text-align: center; background: radial-gradient(circle at 50% 35%, #2c3236, #1a1d20 70%); }
.cover .brand { font-size: 9pt; letter-spacing: .4em; color: #c8a97a; font-weight: 700; }
.cover h1 { font-size: 50pt; line-height: 1.05; margin: 8mm 0 3mm; }
.cover .by { font-family: 'Parisienne', cursive; font-size: 26pt; color: #c8a97a; margin: 0; }
.cover .count { margin-top: 12mm; font-size: 9pt; letter-spacing: .35em; text-transform: uppercase; color: #9aa39f; }
.cover-inner { border-top: 1px solid #c8a97a55; border-bottom: 1px solid #c8a97a55; padding: 14mm 6mm; }
.toc h2 { font-style: italic; font-size: 30pt; }
.toc-group h3, .kicker, h5 { color: #c8a97a; }
.toc-row i { border-color: #c8a97a66; opacity: 1; }
.kicker { letter-spacing: .35em; }
.recipe h2 { font-size: 30pt; font-style: italic; }
.meta { gap: 0; }
.meta span { padding: 0; font-size: 8.5pt; letter-spacing: .25em; text-transform: uppercase; color: #9aa39f; }
.meta span + span::before { content: '·'; margin: 0 2.5mm; color: #c8a97a; }
.source { color: #9aa39f; }
.recipe .photo { border-radius: 4mm; outline: 1px solid #c8a97a88; outline-offset: 2.5mm; }
.cols { gap: 8mm; }
.cols > div { border-top: 1px solid #c8a97a66; padding-top: 5mm; }
h5 { letter-spacing: .3em; margin-bottom: 3mm; }
.ing li { border-bottom: 1px solid #ffffff12; }
.ing b { color: #c8a97a; }
.steps { list-style: none; padding: 0; counter-reset: step; }
.steps li { counter-increment: step; display: grid; grid-template-columns: 8mm 1fr; gap: 3mm; margin-bottom: 3.5mm; }
.steps li::before { content: counter(step, decimal-leading-zero); font-family: 'Playfair Display', serif; font-style: italic; color: #c8a97a; font-size: 12pt; }
.notes { border-color: #c8a97a88; }
footer { color: #9aa39f; }
`,
};

/**
 * Shrinks the content of any page that doesn't fit on its A4 sheet (a very long recipe), so the
 * book stays one recipe per page and the contents' page numbers stay right. Runs in the
 * print frame once fonts and photos have loaded.
 */
export function fitPagesToA4(doc: Document): void {
  for (const page of doc.querySelectorAll<HTMLElement>('.page')) {
    // Shrink the blocks inside, not the page's padding, so the text keeps clear of the margins.
    const inner = page.querySelector<HTMLElement>('.inner') ?? page;
    const blocks = [...inner.children].filter(
      (child): child is HTMLElement => child instanceof HTMLElement && child.tagName !== 'FOOTER',
    );
    let zoom = 1;
    while (page.scrollHeight > page.clientHeight + 1 && zoom > 0.5) {
      zoom -= 0.04;
      for (const block of blocks) block.style.setProperty('zoom', String(zoom));
    }
  }
}
