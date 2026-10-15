/** Nutrition values per 100 g. */
export interface NutritionPer100g {
  cal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface CiqualFood extends NutritionPer100g {
  name: string;
}

/** Estimated nutrition per serving, rounded. */
export interface NutritionEstimate {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  /** Ingredients that couldn't be counted (unknown food or no quantity). */
  unmatched: string[];
}

/** Format of `public/data/ciqual-2025.json`. */
export interface CiqualFile {
  source: string;
  license: string;
  fields: string[];
  per: string;
  /** [name, kcal, protein, carbs, fat] */
  foods: [string, number, number, number, number][];
  /** Common ingredient name → exact Ciqual food name. */
  aliases: Record<string, string>;
}
