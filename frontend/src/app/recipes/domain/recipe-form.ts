import { MANUAL_DIET_IDS, categoryEmoji } from '../models/recipe.constants';
import { RecipeFormValue } from '../models/recipe-form.model';
import { Category, Recipe, RecipeData, RecipeImage } from '../models/recipe.model';
import { youtubeVideoId, youtubeWatchUrl } from './video';

export function emptyRecipeForm(): RecipeFormValue {
  return {
    name: '',
    category: '',
    diets: {
      vegetarian: false,
      vegan: false,
      'gluten-free': false,
      'dairy-free': false,
      'kid-friendly': false,
    },
    difficulty: 'Easy',
    prepTime: null,
    cookTime: null,
    servings: null,
    ingredients: [],
    steps: [],
    source: '',
    pairing: '',
    videoUrl: '',
    notes: '',
  };
}

/** Form values for editing an existing recipe. */
export function recipeToForm(recipe: Recipe): RecipeFormValue {
  const empty = emptyRecipeForm();
  return {
    ...empty,
    name: recipe.name ?? '',
    category: (recipe.category as Category) ?? '',
    diets: Object.fromEntries(
      MANUAL_DIET_IDS.map((id) => [id, !!recipe.diets?.includes(id)]),
    ) as RecipeFormValue['diets'],
    difficulty: recipe.difficulty ?? 'Easy',
    prepTime: recipe.prepTime || null,
    cookTime: recipe.cookTime || null,
    servings: recipe.servings || null,
    ingredients: (recipe.ingredients ?? []).map((i) => ({
      qty: String(i.qty ?? ''),
      unit: i.unit ?? '',
      name: i.name ?? '',
    })),
    steps: [...(recipe.steps ?? [])],
    source: recipe.source ?? '',
    pairing: recipe.pairing ?? '',
    videoUrl: recipe.videoUrl ?? '',
    // The old "description" field is no longer edited separately; it's merged into the notes.
    notes: [recipe.description, recipe.notes].filter(Boolean).join('\n\n'),
  };
}

/**
 * The Firestore document for the form values. When editing, `existing` keeps the fields the form
 * doesn't edit (creation date, favorite, sharing, tags).
 */
export function formToRecipeData(
  value: RecipeFormValue,
  userId: string,
  images: RecipeImage[],
  existing: Recipe | null,
): RecipeData {
  // The very first app versions stored one photo inline; keep it while the user keeps it.
  const legacyInline = images.find((image) => image.url.startsWith('data:'));
  const uploaded = images.filter((image) => !image.url.startsWith('data:'));
  const cover = uploaded[0];
  return {
    name: value.name.trim(),
    description: '',
    category: value.category,
    difficulty: value.difficulty,
    prepTime: Math.trunc(value.prepTime ?? 0) || 0,
    cookTime: Math.trunc(value.cookTime ?? 0) || 0,
    servings: Math.trunc(value.servings ?? 0) || 0,
    imageEmoji: categoryEmoji(value.category),
    ingredients: value.ingredients
      .map((i) => ({ qty: i.qty.trim(), unit: i.unit.trim(), name: i.name.trim() }))
      .filter((i) => i.name),
    steps: value.steps.map((step) => step.trim()).filter(Boolean),
    tags: [...(existing?.tags ?? [])],
    diets: MANUAL_DIET_IDS.filter((id) => value.diets[id]),
    source: value.source.trim(),
    notes: value.notes.trim(),
    pairing: value.pairing.trim(),
    videoUrl: videoUrlOf(value.videoUrl),
    images: uploaded,
    imageUrl: cover?.url ?? '',
    imagePath: cover?.path ?? '',
    thumbUrl: cover?.thumbUrl ?? '',
    imageData: legacyInline?.url ?? '',
    userId,
    createdAt: existing?.createdAt ?? Date.now(),
    favorite: existing?.favorite ?? false,
  };
}

/** A standard YouTube watch link, or empty when there's no (valid) video. */
function videoUrlOf(input: string): string {
  const id = youtubeVideoId(input);
  return id ? youtubeWatchUrl(id) : '';
}
