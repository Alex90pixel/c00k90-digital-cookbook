import { Ingredient } from '../models/recipe.model';

/** One ingredient as a shopping list line: "200 g flour", "2 eggs", "Salt". */
export function shoppingLine(ingredient: Ingredient): string {
  return [ingredient.qty, ingredient.unit, ingredient.name]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(' ');
}

/** Plain text to copy or share: a title line, then one "- item" per ingredient still to buy. */
export function shoppingListText(title: string, ingredients: readonly Ingredient[]): string {
  const lines = ingredients.map(shoppingLine).filter(Boolean);
  return [title, ...lines.map((line) => `- ${line}`)].join('\n');
}
