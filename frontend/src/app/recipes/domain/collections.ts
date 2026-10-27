import { RecipeCollection } from '../models/collection.model';

/** Longest collection name, so the chips and the filter stay readable. */
export const MAX_COLLECTION_NAME = 30;

/** Tidies a collection name the user typed: trims, joins spaces, cuts very long names. */
export function cleanCollectionName(name: string): string {
  return name.replace(/\s+/g, ' ').trim().slice(0, MAX_COLLECTION_NAME).trim();
}

/** True when another collection already has this name (ignoring case). */
export function nameTaken(
  lists: readonly RecipeCollection[],
  name: string,
  exceptId = '',
): boolean {
  const key = cleanCollectionName(name).toLocaleLowerCase();
  return lists.some((list) => list.id !== exceptId && list.name.toLocaleLowerCase() === key);
}

/** The collections A to Z. */
export function sortCollections(lists: readonly RecipeCollection[]): RecipeCollection[] {
  return [...lists].sort((a, b) => a.name.localeCompare(b.name));
}

/** Adds the recipe to the collection, or takes it out if it is already there. */
export function toggleRecipe(list: RecipeCollection, recipeId: string): RecipeCollection {
  const recipeIds = list.recipeIds.includes(recipeId)
    ? list.recipeIds.filter((id) => id !== recipeId)
    : [...list.recipeIds, recipeId];
  return { ...list, recipeIds };
}

/** Reads a saved document defensively: drops broken entries instead of failing. */
export function parseCollections(value: unknown): RecipeCollection[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const list = item as Partial<RecipeCollection>;
    if (typeof list?.id !== 'string' || typeof list.name !== 'string') return [];
    const recipeIds = Array.isArray(list.recipeIds)
      ? list.recipeIds.filter((id): id is string => typeof id === 'string')
      : [];
    return [{ id: list.id, name: list.name, recipeIds }];
  });
}
