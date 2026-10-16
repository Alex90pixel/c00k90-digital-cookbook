import { Recipe } from '../models/recipe.model';

/** Whether a recipe matches a search (already lowercased and trimmed). */
export function matchesSearch(recipe: Recipe, query: string): boolean {
  const ingredients = (recipe.ingredients ?? [])
    .map((i) => `${i.name} ${i.qty} ${i.unit}`)
    .join(' ');
  const haystack = [
    recipe.name,
    recipe.description,
    recipe.category,
    ingredients,
    ...(recipe.tags ?? []),
  ];
  return haystack.some((text) => (text ?? '').toLowerCase().includes(query));
}
