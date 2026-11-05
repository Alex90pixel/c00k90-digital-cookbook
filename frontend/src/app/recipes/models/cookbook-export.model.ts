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

/** A chapter of the cookbook: a category, its printed title and its recipes, in order. */
export interface CookbookSection {
  category: string;
  /** The heading printed for the chapter; the category's name when empty. */
  title: string;
  recipes: Recipe[];
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
  /** Chapters in the user's order; when missing, the recipes are grouped by category. */
  sections?: readonly CookbookSection[];
  /** A dedication or preface, printed on its own page after the cover. */
  dedication?: string;
  /** Just the recipe pages: no cover, dedication or contents (printing one recipe). */
  recipesOnly?: boolean;
}
