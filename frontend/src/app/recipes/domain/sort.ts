import { NutritionEstimate } from '../models/nutrition.model';
import { Recipe, RecipeSort } from '../models/recipe.model';
import { totalMinutes } from './diets';

const DIFFICULTY_ORDER: Record<string, number> = { Easy: 0, Medium: 1, Hard: 2 };

const byName = (a: Recipe, b: Recipe) => a.name.localeCompare(b.name);
const newest = (a: Recipe, b: Recipe) => (b.createdAt ?? 0) - (a.createdAt ?? 0);

/**
 * The recipes in the chosen order (a sorted copy). Recipes without a time always go last when
 * sorting by time, so "quickest first" really starts with the quickest ones.
 */
export function sortRecipes(
  recipes: readonly Recipe[],
  sort: RecipeSort,
  nutritionOf: (recipe: Recipe) => NutritionEstimate | null = () => null,
  cooked: Readonly<Record<string, { count: number; last: number }>> = {},
  seed = 0,
): Recipe[] {
  const list = [...recipes];
  switch (sort) {
    case 'random':
      // A shuffled order that stays the same until the seed changes ("shuffle again").
      return byNumber(list, (r) => hash(`${seed}:${r.id}`), 1);
    case 'cooked-recent':
      // Never cooked go last.
      return byNumber(list, (r) => cooked[r.id]?.last || null, -1);
    case 'cooked-most':
      return byNumber(list, (r) => cooked[r.id]?.count || null, -1);
    case 'ingredients':
      // Recipes without ingredients go last.
      return byNumber(list, (r) => r.ingredients?.length || null, 1);
    case 'calories':
      return byNumber(list, (r) => nutritionOf(r)?.calories || null, 1);
    case 'protein':
      return byNumber(list, (r) => nutritionOf(r)?.protein || null, -1);
    case 'alpha':
      return list.sort(byName);
    case 'alpha-desc':
      return list.sort((a, b) => byName(b, a));
    case 'time':
    case 'time-desc': {
      const direction = sort === 'time' ? 1 : -1;
      return list.sort((a, b) => {
        const [ta, tb] = [totalMinutes(a), totalMinutes(b)];
        if (!ta || !tb) return (ta ? 0 : 1) - (tb ? 0 : 1) || byName(a, b);
        return (ta - tb) * direction || byName(a, b);
      });
    }
    case 'easy':
      return list.sort(
        (a, b) =>
          (DIFFICULTY_ORDER[a.difficulty ?? 'Easy'] ?? 0) -
            (DIFFICULTY_ORDER[b.difficulty ?? 'Easy'] ?? 0) || byName(a, b),
      );
    default:
      return list.sort(newest);
  }
}

/** Sorts by a number (ascending or descending); recipes without one go last, by name. */
function byNumber(
  list: Recipe[],
  valueOf: (recipe: Recipe) => number | null,
  direction: 1 | -1,
): Recipe[] {
  const values = new Map(list.map((r) => [r.id, valueOf(r)]));
  return list.sort((a, b) => {
    const [va, vb] = [values.get(a.id), values.get(b.id)];
    if (va == null || vb == null)
      return (va == null ? 1 : 0) - (vb == null ? 1 : 0) || byName(a, b);
    return (va - vb) * direction || byName(a, b);
  });
}

/** A quick, stable number for a text (FNV-1a), used to shuffle. */
function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return (h >>> 0) + 1;
}
