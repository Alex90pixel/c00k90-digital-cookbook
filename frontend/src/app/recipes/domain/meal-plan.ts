import { Ingredient } from '../models/recipe.model';
import { formatQuantity, parseQuantity } from './ingredients';

/** Days older than this are dropped when the plan is saved, so the document stays small. */
export const KEEP_PAST_DAYS = 60;

/** A local date as "2026-10-27" (not UTC, so late evenings stay on the right day). */
export function isoDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Reads "2026-10-27" as local midnight. */
export function fromIsoDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** The Monday of the date's week. */
export function weekStart(date: Date): Date {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return addDays(start, -((start.getDay() + 6) % 7));
}

/** The 7 dates of the week starting on `monday`. */
export function weekDates(monday: Date): string[] {
  return Array.from({ length: 7 }, (_, i) => isoDate(addDays(monday, i)));
}

/** Drops days long gone and empty days. */
export function prunePlan(days: Record<string, string[]>, today: Date): Record<string, string[]> {
  const oldest = isoDate(addDays(today, -KEEP_PAST_DAYS));
  return Object.fromEntries(
    Object.entries(days).filter(([date, ids]) => date >= oldest && ids.length > 0),
  );
}

/** Reads a saved document defensively. */
export function parsePlan(value: unknown): Record<string, string[]> {
  if (!value || typeof value !== 'object') return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).flatMap(([date, ids]) =>
      /^\d{4}-\d{2}-\d{2}$/.test(date) && Array.isArray(ids)
        ? [[date, ids.filter((id): id is string => typeof id === 'string')]]
        : [],
    ),
  );
}

/**
 * The week's shopping list: the same ingredient in the same unit is added up ("200 g flour" +
 * "300 g flour" → "500 g flour"); anything without a readable quantity is listed as written.
 * Sorted by ingredient name.
 */
export function combineIngredients(lists: readonly (readonly Ingredient[])[]): string[] {
  const totals = new Map<string, { qty: number; unit: string; name: string }>();
  const loose = new Map<string, { line: string; name: string }>();
  for (const ingredient of lists.flat()) {
    const name = (ingredient.name ?? '').trim();
    if (!name) continue;
    const unit = (ingredient.unit ?? '').trim();
    const qty = parseQuantity(ingredient.qty);
    if (qty === null) {
      const line = [(ingredient.qty ?? '').trim(), unit, name].filter(Boolean).join(' ');
      loose.set(line.toLowerCase(), { line, name });
      continue;
    }
    const key = `${unit.toLowerCase()}|${name.toLowerCase()}`;
    const total = totals.get(key);
    if (total) total.qty += qty;
    else totals.set(key, { qty, unit, name });
  }
  const items = [
    ...[...totals.values()].map(({ qty, unit, name }) => ({
      line: [formatQuantity(qty), unit, name].filter(Boolean).join(' '),
      name,
    })),
    ...loose.values(),
  ];
  return items.sort((a, b) => a.name.localeCompare(b.name)).map((item) => item.line);
}
