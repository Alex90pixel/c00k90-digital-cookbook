import { Recipe, RecipeSort } from '../models/recipe.model';
import { totalMinutes } from './diets';

const DIFFICULTY_ORDER: Record<string, number> = { Easy: 0, Medium: 1, Hard: 2 };

const byName = (a: Recipe, b: Recipe) => a.name.localeCompare(b.name);
const newest = (a: Recipe, b: Recipe) => (b.createdAt ?? 0) - (a.createdAt ?? 0);

/**
 * The recipes in the chosen order (a sorted copy). Recipes without a time always go last when
 * sorting by time, so "quickest first" really starts with the quickest ones.
 */
export function sortRecipes(recipes: readonly Recipe[], sort: RecipeSort): Recipe[] {
  const list = [...recipes];
  switch (sort) {
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
