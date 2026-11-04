import { Recipe } from '../models/recipe.model';

/** Today's date as YYYY-MM-DD, in the user's own time zone. */
export function localDay(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * The recipe of the day: one of the recipes, the same all day long and a different one the next
 * day. Recipes with a photo are preferred, as the highlight looks best with one.
 */
export function recipeOfTheDay(recipes: readonly Recipe[], day: string, seed = ''): Recipe | null {
  const withPhoto = recipes.filter((r) => r.thumbUrl || r.imageUrl || r.images?.length);
  const pool = [...(withPhoto.length ? withPhoto : recipes)].sort((a, b) =>
    a.id.localeCompare(b.id),
  );
  if (!pool.length) return null;
  return pool[hash(`${seed}:${day}`) % pool.length];
}

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}
