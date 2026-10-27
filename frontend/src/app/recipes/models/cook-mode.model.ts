import { Ingredient } from './recipe.model';

/** What cook mode receives: the steps, plus the ingredients for the chosen servings. */
export interface CookModeData {
  recipeName: string;
  steps: string[];
  ingredients: Ingredient[];
}
