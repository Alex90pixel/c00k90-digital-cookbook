import { Category, Difficulty } from './recipe.model';

/** A recipe suggested by the AI from the ingredients the user has at home. */
export interface RecipeIdea {
  name: string;
  description: string;
  category: Category;
  difficulty: Difficulty;
  servings: number;
  prepMinutes: number;
  cookMinutes: number;
  /** One per line, with quantity and unit, e.g. "200 g rice". */
  ingredients: string[];
  steps: string[];
  /** Optional additions that go well with it, e.g. "corn, for sweetness". */
  extras: string[];
  /** One cook's tip, e.g. how to get the rice crispy. */
  tip: string;
}
