import { Ingredient } from './recipe.model';

/** What the shopping list dialog receives: the recipe's ingredients for the chosen servings. */
export interface ShoppingListData {
  recipeName: string;
  servings: number;
  ingredients: Ingredient[];
}
