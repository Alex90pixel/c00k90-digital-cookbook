import { Ingredient } from '../models/recipe.model';
import { formatQuantity, knownUnit, parseQuantity, splitLeadingUnit } from './ingredients';

interface Conversion {
  unit: 'g' | 'ml';
  factor: number;
}

/** US units and how much one of them is in grams or millilitres. */
const TO_METRIC: Readonly<Record<string, Conversion>> = {
  oz: { unit: 'g', factor: 28.35 },
  lb: { unit: 'g', factor: 453.6 },
  stick: { unit: 'g', factor: 113 },
  sticks: { unit: 'g', factor: 113 },
  cup: { unit: 'ml', factor: 240 },
  cups: { unit: 'ml', factor: 240 },
  'fl oz': { unit: 'ml', factor: 29.57 },
  pint: { unit: 'ml', factor: 473 },
  pints: { unit: 'ml', factor: 473 },
  quart: { unit: 'ml', factor: 946 },
  quarts: { unit: 'ml', factor: 946 },
  gallon: { unit: 'ml', factor: 3785 },
  gallons: { unit: 'ml', factor: 3785 },
};

/** A size in parentheses at the start of the name: "(6-ounce) chicken breast". */
const SIZE_IN_NAME = /\(\s*(\d+(?:[.,]\d+)?)\s*-?\s*([a-zA-Z]+)\.?\s*\)/g;
/** An oven temperature in Fahrenheit: "350°F", "350 F", "350 degrees F", "350 degrees Fahrenheit". */
const FAHRENHEIT = /(\d{3})\s*(?:°\s*|degrees\s+)?(?:F\b|Fahrenheit\b)/gi;

function conversionFor(unit: string): Conversion | undefined {
  const lower = unit.trim().toLowerCase();
  return TO_METRIC[lower] ?? TO_METRIC[knownUnit(lower) ?? ''];
}

/** Rounds to amounts a cook would measure: 7 g, 85 g, 340 g, 1.2 kg. */
function metricAmount(value: number, unit: 'g' | 'ml'): { qty: string; unit: string } {
  if (value >= 1000)
    return { qty: formatQuantity(Math.round(value / 100) / 10), unit: unit === 'g' ? 'kg' : 'l' };
  const step = value < 20 ? 1 : value < 100 ? 5 : 10;
  return { qty: String(Math.max(step, Math.round(value / step) * step)), unit };
}

/** The ingredient in grams or millilitres when it uses a US unit; otherwise as it was. */
export function toMetric(ingredient: Ingredient): Ingredient {
  // Older lines kept the unit in the name ("2" · "" · "cups flour").
  const leading = ingredient.unit ? null : splitLeadingUnit(ingredient.name ?? '');
  const conversion = conversionFor(leading?.unit ?? ingredient.unit ?? '');
  const qty = parseQuantity(ingredient.qty);
  if (conversion && qty !== null) {
    const amount = metricAmount(qty * conversion.factor, conversion.unit);
    return { ...amount, name: convertSizes(leading?.name ?? ingredient.name ?? '') };
  }
  const name = convertSizes(ingredient.name ?? '');
  return name === ingredient.name ? ingredient : { ...ingredient, name };
}

/** "(6-ounce) chicken breast" → "(170 g) chicken breast". */
function convertSizes(name: string): string {
  return name.replace(SIZE_IN_NAME, (match, amount: string, unit: string) => {
    const conversion = conversionFor(unit);
    if (!conversion) return match;
    const metric = metricAmount(
      Number(amount.replace(',', '.')) * conversion.factor,
      conversion.unit,
    );
    return `(${metric.qty} ${metric.unit})`;
  });
}

/** "Bake at 350°F" → "Bake at 175°C". */
export function stepToMetric(step: string): string {
  return step.replace(FAHRENHEIT, (_, fahrenheit: string) => {
    const celsius = Math.round(((Number(fahrenheit) - 32) * 5) / 9 / 5) * 5;
    return `${celsius}°C`;
  });
}

/** True when the recipe uses US units or Fahrenheit, so the metric switch is worth showing. */
export function usesUsUnits(ingredients: readonly Ingredient[], steps: readonly string[]): boolean {
  return (
    ingredients.some((i) => JSON.stringify(toMetric(i)) !== JSON.stringify(i)) ||
    steps.some((s) => stepToMetric(s) !== s)
  );
}
