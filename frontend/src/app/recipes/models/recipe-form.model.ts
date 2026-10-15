import { Category, Difficulty, Ingredient, ManualDietId, RecipeImage } from './recipe.model';

/** The values edited in the recipe form. */
export interface RecipeFormValue {
  name: string;
  category: Category | '';
  diets: Record<ManualDietId, boolean>;
  difficulty: Difficulty;
  prepTime: number | null;
  cookTime: number | null;
  servings: number | null;
  ingredients: Ingredient[];
  steps: string[];
  source: string;
  pairing: string;
  notes: string;
}

/** A photo in the form: either already uploaded (`image`) or just picked (`file`). */
export interface FormPhoto {
  /** Object URL or download URL, for the preview. */
  previewUrl: string;
  image?: RecipeImage;
  file?: Blob;
}
