import { NutritionEstimate } from '../models/nutrition.model';
import { Ingredient } from '../models/recipe.model';
import { ingredientGrams } from './nutrition';

/** Typical calories per serving, used to guess how many servings a recipe makes. */
const KCAL_PER_SERVING: Readonly<Record<string, number>> = {
  Breakfast: 350,
  Desserts: 350,
  Baking: 350,
  Soups: 250,
  Salads: 250,
  Mains: 550,
  Drinks: 200,
  Other: 400,
};
const DEFAULT_KCAL_PER_SERVING = 400;
const GRAMS_PER_SERVING = 300;

export interface TimeEstimate {
  prepTime: number;
  cookTime: number;
  /** `null` when no ingredient has a usable quantity. */
  servings: number | null;
  /** Likely range of the total time in minutes, shown as a hint in the form. */
  minMinutes: number;
  maxMinutes: number;
}

/**
 * Rough guess of times and servings from the number of steps and the ingredients.
 * `wholeRecipeNutrition` is the nutrition estimate for the entire recipe (1 serving).
 */
export function estimateTimeAndServings(
  stepCount: number,
  ingredients: readonly Ingredient[],
  category: string,
  wholeRecipeNutrition: NutritionEstimate | null,
): TimeEstimate | null {
  if (!stepCount || !ingredients.length) return null;

  const minutes = 10 + stepCount * 6;
  const low = Math.max(5, Math.round(minutes * 0.8));
  const high = Math.round(minutes * 1.2);
  const totalGrams = ingredients.reduce((sum, i) => sum + ingredientGrams(i, false), 0);

  const nutritionIsReliable =
    !!wholeRecipeNutrition &&
    wholeRecipeNutrition.unmatched.length <= 1 &&
    wholeRecipeNutrition.calories > 0;
  const servings = nutritionIsReliable
    ? Math.max(
        1,
        Math.round(
          wholeRecipeNutrition.calories / (KCAL_PER_SERVING[category] ?? DEFAULT_KCAL_PER_SERVING),
        ),
      )
    : Math.max(1, Math.round(totalGrams / GRAMS_PER_SERVING));

  return {
    prepTime: Math.round(minutes * 0.35),
    cookTime: Math.round(minutes * 0.65),
    servings: totalGrams > 0 ? servings : null,
    minMinutes: low,
    maxMinutes: high,
  };
}
