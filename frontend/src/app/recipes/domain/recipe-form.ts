import { ALLERGEN_IDS, MANUAL_DIET_IDS, categoryEmoji } from '../models/recipe.constants';
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
    allergens: Object.fromEntries(
      ALLERGEN_IDS.map((id) => [id, false]),
    ) as RecipeFormValue['allergens'],
    difficulty: 'Easy',
    prepTime: null,
    cookTime: null,
    servings: null,
    ingredients: [],
    steps: [],
    source: '',
    pairing: '',
    description: '',
    extras: '',
    tip: '',
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
    allergens: Object.fromEntries(
      ALLERGEN_IDS.map((id) => [id, !!recipe.allergens?.includes(id)]),
    ) as RecipeFormValue['allergens'],
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
    description: recipe.description ?? '',
    extras: (recipe.extras ?? []).join('\n'),
    tip: recipe.tip ?? '',
    videoUrl: recipe.videoUrl ?? '',
    notes: recipe.notes ?? '',
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
    description: value.description.trim(),
    extras: value.extras
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean),
    tip: value.tip.trim(),
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
    allergens: ALLERGEN_IDS.filter((id) => value.allergens[id]),
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
