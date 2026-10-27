import { NutritionEstimate } from '../models/nutrition.model';
import { RecipeData } from '../models/recipe.model';

export const QUICK_RECIPE_MAX_MINUTES = 30;
/** Per serving. */
export const LOW_CALORIE_MAX = 400;

export function totalMinutes(recipe: Pick<RecipeData, 'prepTime' | 'cookTime'>): number {
  return (Number(recipe.prepTime) || 0) + (Number(recipe.cookTime) || 0);
}

/**
 * All diet labels of a recipe: the ones its author picked, plus the ones estimated by the app.
 * Nutrition-based labels are only added when every ingredient was recognized.
 */
export function dietLabels(
  recipe: Pick<RecipeData, 'diets' | 'prepTime' | 'cookTime'>,
  nutrition: NutritionEstimate | null,
): string[] {
  const labels = [...(recipe.diets ?? [])];
  if (nutrition && nutrition.unmatched.length === 0) {
    if (nutrition.protein >= 20) labels.push('high-protein');
    if (nutrition.carbs <= 20) labels.push('low-carb');
    if (nutrition.fat <= 10) labels.push('low-fat');
    if (nutrition.carbs <= 10) labels.push('keto');
    if (nutrition.calories <= LOW_CALORIE_MAX) labels.push('low-calorie');
  }
  const minutes = totalMinutes(recipe);
  if (minutes > 0 && minutes < QUICK_RECIPE_MAX_MINUTES) labels.push('quick');
  return labels;
}
