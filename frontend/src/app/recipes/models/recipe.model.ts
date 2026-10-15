export type Category =
  'Breakfast' | 'Mains' | 'Soups' | 'Salads' | 'Baking' | 'Desserts' | 'Drinks' | 'Other';

export type Difficulty = 'Easy' | 'Medium' | 'Hard';

/** Diet labels the author picks in the form. */
export type ManualDietId = 'vegetarian' | 'vegan' | 'gluten-free' | 'dairy-free' | 'kid-friendly';
/** Diet labels the app adds by itself (from total time and the nutrition estimate). */
export type AutoDietId = 'quick' | 'high-protein' | 'low-carb' | 'low-fat' | 'keto';
export type DietId = ManualDietId | AutoDietId;

export interface Ingredient {
  qty: string;
  unit: string;
  name: string;
}

export interface RecipeImage {
  url: string;
  path: string;
  thumbUrl?: string;
  thumbPath?: string;
}

/**
 * A document in the Firestore `recipes` collection.
 *
 * The old app (repo root) reads and writes the same documents, so field names and types must
 * stay compatible with it. Most fields are optional because older documents may not have them.
 */
export interface RecipeData {
  name: string;
  category: string;
  userId: string;
  /** Milliseconds since epoch. */
  createdAt: number;
  description?: string;
  difficulty?: Difficulty;
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  imageEmoji?: string;
  ingredients?: Ingredient[];
  steps?: string[];
  tags?: string[];
  diets?: string[];
  source?: string;
  notes?: string;
  pairing?: string;
  images?: RecipeImage[];
  /** Cover photo, kept in sync with `images[0]` for older readers. */
  imageUrl?: string;
  imagePath?: string;
  thumbUrl?: string;
  /** Legacy inline photo (`data:image/...`) from the very first versions of the app. */
  imageData?: string;
  favorite?: boolean;
  shared?: boolean;
  hiddenByModerator?: boolean;
}

export interface Recipe extends RecipeData {
  id: string;
}

export type RecipeView = 'all' | 'favorites' | 'inspired';
export type RecipeSort = 'recent' | 'alpha' | 'time' | 'protein' | 'kcal';
