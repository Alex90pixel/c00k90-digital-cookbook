import { Ingredient } from '../models/recipe.model';

/** Units recognized when pasting ingredients, e.g. "200g flour" → 200 · g · flour. */
const KNOWN_UNITS = new Set([
  'g',
  'kg',
  'ml',
  'l',
  'tsp',
  'tbsp',
  'cup',
  'cups',
  'oz',
  'lb',
  'pinch',
  'clove',
  'cloves',
  'slice',
  'slices',
  'can',
  'cans',
  'bunch',
  'stick',
  'sticks',
]);

/** Unit names written out in full, mapped to the short units above: "tablespoons" → "tbsp". */
const UNIT_ALIASES: Readonly<Record<string, string>> = {
  tablespoon: 'tbsp',
  tablespoons: 'tbsp',
  teaspoon: 'tsp',
  teaspoons: 'tsp',
  gram: 'g',
  grams: 'g',
  kilogram: 'kg',
  kilograms: 'kg',
  ounce: 'oz',
  ounces: 'oz',
  pound: 'lb',
  pounds: 'lb',
  gr: 'g',
  grame: 'g',
  gramm: 'g',
  gramos: 'g',
  grammes: 'g',
  grammi: 'g',
  lingura: 'tbsp',
  linguri: 'tbsp',
  lingurita: 'tsp',
  lingurite: 'tsp',
  cana: 'cup',
  cani: 'cup',
  litru: 'l',
  litri: 'l',
  liter: 'l',
  litre: 'l',
  litres: 'l',
  liters: 'l',
};

/** The short unit for a unit word ("Tablespoons" → "tbsp", "g" → "g"), or `null` if it isn't one. */
export function knownUnit(word: string): string | null {
  // "Linguriță" → "lingurita", so units typed with or without accents are found.
  const lower = word
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  if (KNOWN_UNITS.has(lower)) return lower;
  return UNIT_ALIASES[lower] ?? null;
}

/**
 * Splits a unit off the start of an ingredient name, for lines saved before long unit names were
 * recognized: "tablespoons olive oil" → { unit: "tbsp", name: "olive oil" }.
 */
export function splitLeadingUnit(name: string): { unit: string; name: string } | null {
  const match = name.trim().match(/^([a-zA-Z]+)\s+(.+)$/);
  const unit = match ? knownUnit(match[1]) : null;
  return match && unit ? { unit, name: match[2] } : null;
}

/**
 * Parses a quantity like "2", "0.5", "0,5", "1/2" or "1 1/2".
 * Returns `null` when the text doesn't start with a number.
 */
export function parseQuantity(qty: string | number | undefined): number | null {
  if (typeof qty === 'number') return Number.isFinite(qty) ? qty : null;
  const text = (qty ?? '')
    .trim()
    .replace(',', '.')
    .replace(/(\d)?\s*([⅛¼⅓⅜½⅝⅔¾⅞])/, (_, whole: string | undefined, symbol: string) => {
      const fraction = FRACTIONS.find(([, glyph]) => glyph === symbol);
      return String((whole ? Number(whole) : 0) + (fraction ? fraction[0] : 0));
    });
  const mixed = text.match(/^(\d+)\s+(\d+)\/(\d+)/);
  if (mixed) return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);
  const fraction = text.match(/^(\d+)\/(\d+)/);
  if (fraction) return Number(fraction[2]) ? Number(fraction[1]) / Number(fraction[2]) : null;
  const value = parseFloat(text);
  return Number.isNaN(value) ? null : value;
}

/** Kitchen fractions shown instead of decimals: 0.25 → ¼, 1.5 → 1½. */
const FRACTIONS: readonly (readonly [number, string])[] = [
  [1 / 8, '⅛'],
  [1 / 4, '¼'],
  [1 / 3, '⅓'],
  [3 / 8, '⅜'],
  [1 / 2, '½'],
  [5 / 8, '⅝'],
  [2 / 3, '⅔'],
  [3 / 4, '¾'],
  [7 / 8, '⅞'],
];

/**
 * Formats a quantity the way recipes write it: whole numbers as they are, common kitchen
 * fractions as ¼ ½ ⅓ … (1.5 → "1½"), anything else with at most 2 decimals and no trailing zeros.
 */
export function formatQuantity(value: number): string {
  const whole = Math.floor(value + 0.01);
  const rest = value - whole;
  if (Math.abs(rest) < 0.01) return String(whole);
  const fraction = FRACTIONS.find(([amount]) => Math.abs(rest - amount) < 0.01);
  if (fraction) return whole ? `${whole}${fraction[1]}` : fraction[1];
  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded)
    ? String(rounded)
    : rounded.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}

/** Scales every numeric quantity by `factor`; quantities like "a pinch" stay as they are. */
export function scaleIngredients(ingredients: readonly Ingredient[], factor: number): Ingredient[] {
  return ingredients.map((ingredient) => {
    const qty = parseQuantity(ingredient.qty);
    return qty === null ? { ...ingredient } : { ...ingredient, qty: formatQuantity(qty * factor) };
  });
}

/** A quantity as people type it: 200, 0.5, 0,5, 1/2, 1½, ½. */
const QTY = String.raw`\d+(?:[.,]\d+)?(?:\s*\/\s*\d+)?[⅛¼⅓⅜½⅝⅔¾⅞]?|[⅛¼⅓⅜½⅝⅔¾⅞]`;
/** Quantity first: "200g flour", "2 eggs", "1/2 tsp salt". */
const LEADING = new RegExp(String.raw`^(${QTY})\s*(\p{L}*)\.?\s*(.*)$`, 'u');
/** Quantity last: "flour 200 g", "eggs: 2", "milk - 300ml", "făină 200 gr". */
const TRAILING = new RegExp(String.raw`^(.+?)\s*[:–—-]?\s+(${QTY})\s*(\p{L}*)\.?$`, 'u');

/**
 * Parses pasted ingredients, one per line, with the quantity first or last: "200g flour",
 * "2 eggs", "flour 200 g", "eggs: 2", "Salt". Bullets ("-", "•") are removed.
 */
export function parseIngredientLines(text: string): Ingredient[] {
  return splitLines(text).map((raw) => {
    const line = raw.replace(/^[-•*·]\s*/, '');
    const leading = line.match(LEADING);
    if (leading) {
      const [, qty, word, rest] = leading;
      const unit = word ? knownUnit(word) : '';
      if (unit !== null) return { qty, unit, name: (rest || unit).trim() };
      return { qty, unit: '', name: `${word} ${rest}`.trim() };
    }
    const trailing = line.match(TRAILING);
    if (trailing) {
      const [, name, qty, word] = trailing;
      const unit = word ? knownUnit(word) : '';
      if (unit !== null) return { qty, unit, name: name.replace(/[,:–—-]+$/, '').trim() };
    }
    return { qty: '', unit: '', name: line };
  });
}

/** Parses pasted steps, one per line, removing numbering ("1.", "2)") and bullets ("-", "•"). */
export function parseStepLines(text: string): string[] {
  return splitLines(text)
    .map((line) => line.replace(/^\d+[.)]\s*/, '').replace(/^[-•*]\s*/, ''))
    .filter(Boolean);
}

function splitLines(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}
