import { TranslationKey } from '../../core/i18n/i18n.types';
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

/** Diet labels are translated with `I18nService.label('diets', id)`. */
export interface DietOption {
  id: DietId;
  /** Manual labels are chosen by the author; the others are estimated by the app. */
  manual: boolean;
}

export const DIETS: readonly DietOption[] = [
  { id: 'vegetarian', manual: true },
  { id: 'vegan', manual: true },
  { id: 'gluten-free', manual: true },
  { id: 'dairy-free', manual: true },
  { id: 'kid-friendly', manual: true },
  { id: 'quick', manual: true },
  { id: 'high-protein', manual: false },
  { id: 'low-carb', manual: false },
  { id: 'low-fat', manual: false },
  { id: 'keto', manual: false },
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

export const SORT_OPTIONS: readonly { id: RecipeSort; labelKey: TranslationKey }[] = [
  { id: 'recent', labelKey: 'sort.recent' },
  { id: 'alpha', labelKey: 'sort.alpha' },
  { id: 'time', labelKey: 'sort.time' },
  { id: 'protein', labelKey: 'sort.protein' },
  { id: 'kcal', labelKey: 'sort.kcal' },
];

export const MAX_PHOTOS_PER_RECIPE = 3;
