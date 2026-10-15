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

/**
 * Parses a quantity like "2", "0.5", "0,5", "1/2" or "1 1/2".
 * Returns `null` when the text doesn't start with a number.
 */
export function parseQuantity(qty: string | number | undefined): number | null {
  if (typeof qty === 'number') return Number.isFinite(qty) ? qty : null;
  const text = (qty ?? '').trim().replace(',', '.');
  const mixed = text.match(/^(\d+)\s+(\d+)\/(\d+)/);
  if (mixed) return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);
  const fraction = text.match(/^(\d+)\/(\d+)/);
  if (fraction) return Number(fraction[2]) ? Number(fraction[1]) / Number(fraction[2]) : null;
  const value = parseFloat(text);
  return Number.isNaN(value) ? null : value;
}

/** Formats a number with at most 2 decimals and no trailing zeros: 1.50 → "1.5". */
export function formatQuantity(value: number): string {
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

/** Parses pasted ingredients, one per line: "200g flour", "2 eggs", "1/2 tsp salt", "Salt". */
export function parseIngredientLines(text: string): Ingredient[] {
  return splitLines(text).map((line) => {
    const match = line.match(/^([\d.\/]+)\s*([a-zA-Z]*)\s*(.*)$/);
    if (!match) return { qty: '', unit: '', name: line };
    const qty = match[1];
    let unit = match[2];
    let name = match[3];
    if (unit && !KNOWN_UNITS.has(unit.toLowerCase())) {
      name = `${unit} ${name}`.trim();
      unit = '';
    }
    return { qty, unit, name: (name || unit).trim() };
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
