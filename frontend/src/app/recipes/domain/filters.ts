import { RecipeData } from '../models/recipe.model';
import { totalMinutes } from './diets';

/** The time limits offered in the filter, in minutes. */
export const TIME_LIMITS = [15, 30, 60] as const;
export type TimeLimit = (typeof TIME_LIMITS)[number];

/** Lowercase and without accents, so "Ciupercă" matches "ciupercă" and "ciuperca". */
function plain(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/** The ingredients typed in a filter box: "chicken, rice" → ["chicken", "rice"]. */
export function ingredientTerms(text: string): string[] {
  return text
    .split(/[,;\n]+/)
    .map((term) => plain(term).trim())
    .filter((term) => term.length > 1);
}

/**
 * True when the recipe has every "with" ingredient and none of the "without" ones. A term
 * matches the start of a word in an ingredient name, so "mushroom" also finds "mushrooms".
 */
export function matchesIngredients(
  recipe: Pick<RecipeData, 'ingredients'>,
  withTerms: readonly string[],
  withoutTerms: readonly string[],
): boolean {
  const names = (recipe.ingredients ?? []).map((i) => ` ${plain(i.name ?? '')}`);
  const has = (term: string) => names.some((name) => name.includes(` ${term}`));
  return withTerms.every(has) && !withoutTerms.some(has);
}

/** True when the recipe's total time is known and within the limit. */
export function withinTime(
  recipe: Pick<RecipeData, 'prepTime' | 'cookTime'>,
  limit: number,
): boolean {
  const minutes = totalMinutes(recipe);
  return minutes > 0 && minutes <= limit;
}
