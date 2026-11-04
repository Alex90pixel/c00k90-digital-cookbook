import { Recipe } from '../models/recipe.model';

/** Today's date as YYYY-MM-DD, in the user's own time zone. */
export function localDay(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * The recipe of the day: one of the recipes, the same all day long. The recipes take turns in a
 * fixed shuffled order (different for each user), so none comes back before all the others have
 * had their day. Recipes with a photo are preferred, as the highlight looks best with one.
 */
export function recipeOfTheDay(recipes: readonly Recipe[], day: string, seed = ''): Recipe | null {
  const withPhoto = recipes.filter((r) => r.thumbUrl || r.imageUrl || r.images?.length);
  const pool = (withPhoto.length ? withPhoto : recipes)
    .map((r) => ({ r, key: hash(`${seed}:${r.id}`) }))
    .sort((a, b) => a.key - b.key || a.r.id.localeCompare(b.r.id))
    .map(({ r }) => r);
  if (!pool.length) return null;
  return pool[dayNumber(day) % pool.length];
}

/** Days since 1 Jan 1970 for a YYYY-MM-DD date. */
function dayNumber(day: string): number {
  const [year, month, date] = day.split('-').map(Number);
  return Math.floor(Date.UTC(year, month - 1, date) / 86_400_000);
}

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}
