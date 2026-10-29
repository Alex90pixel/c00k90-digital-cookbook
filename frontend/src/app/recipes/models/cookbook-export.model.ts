import { Recipe } from './recipe.model';

/** The looks of the printable cookbook. */
export type CookbookStyle = 'classic' | 'notebook' | 'minimal' | 'moody';

/** Words printed in the cookbook, in the user's language. */
export interface CookbookLabels {
  by: string;
  contents: string;
  ingredients: string;
  steps: string;
  notes: string;
  source: string;
  serves: (count: number) => string;
  minutes: (count: number) => string;
  recipeCount: (count: number) => string;
  category: (id: string) => string;
}

/** Everything needed to build the printable cookbook. */
export interface CookbookOptions {
  style: CookbookStyle;
  /** Language of the texts, for the document's `lang` (e.g. "ro"). */
  lang: string;
  title: string;
  author: string;
  recipes: readonly Recipe[];
  labels: CookbookLabels;
}
