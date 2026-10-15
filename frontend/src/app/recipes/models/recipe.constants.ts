import { Category, DietId, Difficulty, ManualDietId, RecipeSort } from './recipe.model';

export interface CategoryOption {
  id: Category;
  emoji: string;
}

export const CATEGORIES: readonly CategoryOption[] = [
  { id: 'Breakfast', emoji: '🍳' },
  { id: 'Mains', emoji: '🍽️' },
  { id: 'Soups', emoji: '🍲' },
  { id: 'Salads', emoji: '🥗' },
  { id: 'Baking', emoji: '🍞' },
  { id: 'Desserts', emoji: '🍮' },
  { id: 'Drinks', emoji: '🥤' },
  { id: 'Other', emoji: '✨' },
];

const DEFAULT_RECIPE_EMOJI = '🍽️';

export function categoryEmoji(category: string | undefined): string {
  return CATEGORIES.find((c) => c.id === category)?.emoji ?? DEFAULT_RECIPE_EMOJI;
}

export interface DietOption {
  id: DietId;
  label: string;
  /** Manual labels are chosen by the author; the others are estimated by the app. */
  manual: boolean;
}

export const DIETS: readonly DietOption[] = [
  { id: 'vegetarian', label: '🥕 Vegetarian', manual: true },
  { id: 'vegan', label: '🌱 Vegan', manual: true },
  { id: 'gluten-free', label: '🌾 Gluten-free', manual: true },
  { id: 'dairy-free', label: '🥛 Dairy-free', manual: true },
  { id: 'kid-friendly', label: '🧒 Kid-friendly', manual: true },
  { id: 'quick', label: '⚡ Quick', manual: true },
  { id: 'high-protein', label: '💪 High protein', manual: false },
  { id: 'low-carb', label: '🥦 Low carb', manual: false },
  { id: 'low-fat', label: '🫒 Low fat', manual: false },
  { id: 'keto', label: '🥑 Keto', manual: false },
];

/** The diets the author can tick in the recipe form. */
export const MANUAL_DIET_IDS: readonly ManualDietId[] = [
  'vegetarian',
  'vegan',
  'gluten-free',
  'dairy-free',
  'kid-friendly',
];

export interface DifficultyOption {
  id: Difficulty;
  icon: string;
}

export const DIFFICULTIES: readonly DifficultyOption[] = [
  { id: 'Easy', icon: '🟢' },
  { id: 'Medium', icon: '🟡' },
  { id: 'Hard', icon: '🔴' },
];

export function difficultyIcon(difficulty: string | undefined): string {
  return DIFFICULTIES.find((d) => d.id === difficulty)?.icon ?? '🔴';
}

export const SORT_OPTIONS: readonly { id: RecipeSort; label: string }[] = [
  { id: 'recent', label: 'Recently added' },
  { id: 'alpha', label: 'Alphabetical' },
  { id: 'time', label: 'Shortest prep time' },
  { id: 'protein', label: 'Most protein' },
  { id: 'kcal', label: 'Fewest calories' },
];

export const MAX_PHOTOS_PER_RECIPE = 3;
