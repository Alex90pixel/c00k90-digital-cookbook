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
  'pcs',
  'packet',
  'packets',
  'glass',
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
  mililitri: 'ml',
  millilitres: 'ml',
  milliliters: 'ml',
  kilograme: 'kg',
  kile: 'kg',
  cesti: 'cup',
  ceasca: 'cup',
  pahar: 'glass',
  pahare: 'glass',
  buc: 'pcs',
  bucata: 'pcs',
  bucati: 'pcs',
  piece: 'pcs',
  pieces: 'pcs',
  catel: 'clove',
  catei: 'cloves',
  felie: 'slice',
  felii: 'slices',
  plic: 'packet',
  plicuri: 'packet',
  praf: 'pinch',
  varf: 'pinch',
  conserva: 'can',
  conserve: 'can',
  cutie: 'can',
  legatura: 'bunch',
  manunchi: 'bunch',
  // Spanish, French, Italian, German
  cucharada: 'tbsp',
  cucharadas: 'tbsp',
  cucharadita: 'tsp',
  cucharaditas: 'tsp',
  taza: 'cup',
  tazas: 'cup',
  pizca: 'pinch',
  diente: 'clove',
  dientes: 'cloves',
  cuillere: 'tbsp',
  cuilleres: 'tbsp',
  tasse: 'cup',
  tasses: 'cup',
  pincee: 'pinch',
  gousse: 'clove',
  gousses: 'cloves',
  cucchiaio: 'tbsp',
  cucchiai: 'tbsp',
  cucchiaino: 'tsp',
  cucchiaini: 'tsp',
  tazza: 'cup',
  tazze: 'cup',
  pizzico: 'pinch',
  spicchio: 'clove',
  spicchi: 'cloves',
  essloffel: 'tbsp',
  el: 'tbsp',
  teeloffel: 'tsp',
  tl: 'tsp',
  prise: 'pinch',
  zehe: 'clove',
  zehen: 'cloves',
  stuck: 'pcs',
  scheibe: 'slice',
  scheiben: 'slices',
  dose: 'can',
  bund: 'bunch',
  paket: 'packet',
  pack: 'packet',
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
const LEADING = new RegExp(String.raw`^(${QTY})\s*(?:de\s+)?(\p{L}*)\.?\s*(.*)$`, 'u');
/** Quantity last: "flour 200 g", "eggs: 2", "milk - 300ml", "făină 200 gr". */
const TRAILING = new RegExp(String.raw`^(.+?)\s*[:–—-]?\s+(${QTY})\s*(?:de\s+)?(\p{L}*)\.?$`, 'u');

/**
 * Parses pasted ingredients, one per line (or a single line separated by commas), with the
 * quantity first or last: "200g flour", "2 eggs", "flour 200 g", "eggs: 2", "Salt". Bullets
 * ("-", "•") are removed.
 */
export function parseIngredientLines(text: string): Ingredient[] {
  const lines = splitLines(text);
  // "chicken, rice, peppers" on one line is a list too (but not "0,5 kg": no space after it).
  const items = lines.length === 1 ? lines[0].split(/\s*[,;]\s+/) : lines;
  return items.filter(Boolean).map((raw) => {
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

/**
 * Parses pasted steps: one per line, without numbering ("1.", "2)") or bullets ("-", "•").
 * Text pasted as a single line is split too, when it clearly holds several steps:
 * "1. Mix 2. Fry", three or more sentences, or a short list like "wash rice, chop chicken, boil rice".
 */
export function parseStepLines(text: string): string[] {
  const lines = splitLines(text);
  const pieces = lines.length === 1 ? splitOneLine(lines[0]) : lines;
  return pieces
    .map((line) =>
      line
        .replace(/^\d+[.)]\s*/, '')
        .replace(/^[-•*·]\s*/, '')
        .trim(),
    )
    .filter(Boolean);
}

function splitOneLine(line: string): string[] {
  // "1. Mix the flour 2. Add the eggs 3) Fry"
  const numbered = line.split(/\s+(?=\d+[.)]\s)/);
  if (numbered.length > 1) return numbered;
  const sentences = line.split(/(?<=[.!?;])\s+(?=\p{L})/u);
  if (sentences.length >= 3) return sentences;
  // A list of short actions, without full stops.
  const parts = line.split(/\s*[,;]\s+/);
  if (parts.length >= 3 && parts.every((part) => part.split(/\s+/).length <= 5)) return parts;
  return [line];
}

function splitLines(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}
