import { RecipeData, RecipeImage } from '../models/recipe.model';

const ALLOWED_IMAGE_PREFIXES = ['data:image/', 'https://firebasestorage.googleapis.com/'];

/** Only shows images from our own Firebase Storage (or legacy inline images). */
export function safeImageUrl(url: string | undefined): string | null {
  if (typeof url !== 'string' || url.includes('"')) return null;
  return ALLOWED_IMAGE_PREFIXES.some((prefix) => url.startsWith(prefix)) ? url : null;
}

/** The recipe's photos, including the older single-photo formats. */
export function recipeImages(
  recipe: Pick<RecipeData, 'images' | 'imageUrl' | 'imagePath' | 'imageData'>,
): RecipeImage[] {
  if (recipe.images?.length) return recipe.images;
  if (recipe.imageUrl) return [{ url: recipe.imageUrl, path: recipe.imagePath ?? '' }];
  if (recipe.imageData) return [{ url: recipe.imageData, path: '' }];
  return [];
}

/** Small cover image for cards: thumbnail first, then the full photo. */
export function cardImageUrl(
  recipe: Pick<RecipeData, 'thumbUrl' | 'imageUrl' | 'imageData'>,
): string | null {
  return safeImageUrl(recipe.thumbUrl || recipe.imageUrl || recipe.imageData);
}

/** Every Storage path (photo and thumbnail) used by a recipe. */
export function recipeStoragePaths(
  recipe: Pick<RecipeData, 'images' | 'imageUrl' | 'imagePath' | 'imageData'>,
): string[] {
  return recipeImages(recipe)
    .flatMap((image) => [image.path, image.thumbPath ?? ''])
    .filter(Boolean);
}
