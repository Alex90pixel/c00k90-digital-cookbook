import { Ingredient } from '../models/recipe.model';
import {
  CiqualFile,
  CiqualFood,
  NutritionEstimate,
  NutritionPer100g,
} from '../models/nutrition.model';
import { knownUnit, parseQuantity, splitLeadingUnit } from './ingredients';
import {
  DEFAULT_PIECE_WEIGHT,
  FALLBACK_NUTRITION,
  PIECE_WEIGHTS,
  ROMANIAN_PIECE_NAMES,
  UNIT_TO_GRAMS,
} from './nutrition-data';
import { normalizeIngredientName, wholeWordRegExp } from './text';

interface AliasRule {
  pattern: RegExp;
  food: CiqualFood;
}

/** Words saying an ingredient is already cooked ("cooked rice", "orez fiert"). */
const COOKED_WORDS = /\b(cooked|boiled|steamed|fiert|fiarta|fierte|fierti|gatit|gatita)\b/;

const ROMANIAN_PIECE_RULES = Object.keys(ROMANIAN_PIECE_NAMES)
  .sort((a, b) => b.length - a.length)
  .map((key) => ({ pattern: wholeWordRegExp(key), english: ROMANIAN_PIECE_NAMES[key] }));

/**
 * Looks up nutrition values for ingredient names: first in the Ciqual table (by alias, then by
 * the food's main name), then in the small built-in table.
 */
export class NutritionIndex {
  private readonly cache = new Map<string, NutritionPer100g | null>();

  private constructor(
    private readonly aliases: readonly AliasRule[],
    private readonly foodsByMainName: ReadonlyMap<string, CiqualFood[]>,
  ) {}

  /** An index with only the built-in table, used until the Ciqual file has loaded. */
  static fallbackOnly(): NutritionIndex {
    return new NutritionIndex([], new Map());
  }

  static fromCiqual(file: CiqualFile): NutritionIndex {
    const byName = new Map<string, CiqualFood>();
    const byMainName = new Map<string, CiqualFood[]>();
    for (const [name, cal, protein, carbs, fat] of file.foods) {
      const food = { name, cal, protein, carbs, fat };
      byName.set(name, food);
      // "Tomato, raw" → "tomato"
      const mainName = name.split(',')[0].toLowerCase().trim();
      byMainName.set(mainName, [...(byMainName.get(mainName) ?? []), food]);
    }
    const aliases = Object.keys(file.aliases)
      .sort((a, b) => b.length - a.length)
      .flatMap((alias) => {
        const food = byName.get(file.aliases[alias]);
        return food ? [{ pattern: wholeWordRegExp(alias), food }] : [];
      });
    return new NutritionIndex(aliases, byMainName);
  }

  lookup(ingredientName: string): NutritionPer100g | null {
    if (!ingredientName) return null;
    const cached = this.cache.get(ingredientName);
    if (cached !== undefined) return cached;
    const found = this.lookupCiqual(ingredientName) ?? lookupFallback(ingredientName);
    this.cache.set(ingredientName, found);
    return found;
  }

  private lookupCiqual(ingredientName: string): CiqualFood | null {
    const name = normalizeIngredientName(ingredientName);
    if (!name) return null;
    const singular = name.replace(/(\w{3,})s\b/g, '$1');
    const alias = this.aliases.find((a) => a.pattern.test(name) || a.pattern.test(singular));
    if (alias)
      return COOKED_WORDS.test(name) ? (this.cookedVariant(alias.food) ?? alias.food) : alias.food;
    const candidates = this.foodsByMainName.get(name) ?? this.foodsByMainName.get(singular);
    if (!candidates?.length) return null;
    if (COOKED_WORDS.test(name)) {
      const cooked = candidates.find((food) => /\bcooked\b/i.test(food.name));
      if (cooked) return cooked;
    }
    return (
      candidates.find((food) => /\braw\b/i.test(food.name)) ??
      [...candidates].sort((a, b) => a.name.length - b.name.length)[0]
    );
  }

  /**
   * The cooked version of a raw food, when Ciqual has one: "Rice, white, raw" →
   * "Rice, white, cooked, no added salt". Cooked rice or pasta has about a third of the calories.
   */
  private cookedVariant(raw: CiqualFood): CiqualFood | null {
    const [main, ...details] = raw.name
      .toLowerCase()
      .split(',')
      .map((part) => part.trim());
    const wanted = details.filter((part) => part !== 'raw');
    const cooked = (this.foodsByMainName.get(main) ?? []).filter((food) =>
      /\bcooked\b/i.test(food.name),
    );
    return (
      cooked.find((food) => wanted.every((part) => food.name.toLowerCase().includes(part))) ??
      cooked[0] ??
      null
    );
  }
}

function lookupFallback(ingredientName: string): NutritionPer100g | null {
  const name = ingredientName.toLowerCase();
  const key = Object.keys(FALLBACK_NUTRITION).find((k) => name.includes(k));
  return key ? FALLBACK_NUTRITION[key] : null;
}

/** Translates Romanian piece names ("oua" → "egg"), so piece weights work for them too. */
function toEnglishPieceName(name: string): string {
  const normalized = normalizeIngredientName(name);
  return ROMANIAN_PIECE_RULES.find((rule) => rule.pattern.test(normalized))?.english ?? name;
}

export function pieceWeight(name: string): number {
  const lower = name.toLowerCase();
  const key = Object.keys(PIECE_WEIGHTS).find((k) => lower.includes(k));
  return key ? PIECE_WEIGHTS[key] : DEFAULT_PIECE_WEIGHT;
}

/** Approximate weight in grams of one ingredient line, or 0 when it has no usable quantity. */
export function ingredientGrams(ingredient: Ingredient, translatePieceNames = true): number {
  const qty = parseQuantity(ingredient.qty);
  if (!qty) return 0;
  // Older lines kept the unit in the name ("2" · "" · "tablespoons honey"): read it from there.
  const leading = ingredient.unit ? null : splitLeadingUnit(ingredient.name ?? '');
  if (leading) return ingredientGrams({ qty: ingredient.qty, ...leading }, translatePieceNames);
  const gramsPerUnit = UNIT_TO_GRAMS[(ingredient.unit ?? '').toLowerCase()];
  if (gramsPerUnit) return qty * gramsPerUnit;
  // A piece with its size in parentheses: "1 (6-ounce) chicken breast" is one 170 g piece.
  const size = pieceSizeGrams(ingredient.name ?? '');
  if (size) return qty * size;
  const name = translatePieceNames ? toEnglishPieceName(ingredient.name) : ingredient.name;
  return qty * pieceWeight(name);
}

/** The weight of one piece when the name starts with its size: "(6-ounce) chicken breast" → 170. */
export function pieceSizeGrams(name: string): number | null {
  const match = name.trim().match(/^\(\s*(\d+(?:[.,]\d+)?)\s*-?\s*([a-zA-Z]+)\.?\s*\)/);
  if (!match) return null;
  const unit = knownUnit(match[2]);
  const grams = unit ? UNIT_TO_GRAMS[unit] : undefined;
  return grams ? Number(match[1].replace(',', '.')) * grams : null;
}

/** Estimates nutrition per serving. Returns `null` when no ingredient could be counted. */
export function estimateNutrition(
  ingredients: readonly Ingredient[],
  servings: number | undefined,
  index: NutritionIndex,
): NutritionEstimate | null {
  const totals = { cal: 0, protein: 0, carbs: 0, fat: 0 };
  const unmatched: string[] = [];
  let counted = false;

  for (const ingredient of ingredients) {
    const values = index.lookup(ingredient.name ?? '');
    const grams = values ? ingredientGrams(ingredient) : 0;
    if (!values || !grams) {
      if (ingredient.name) unmatched.push(ingredient.name);
      continue;
    }
    const factor = grams / 100;
    totals.cal += values.cal * factor;
    totals.protein += values.protein * factor;
    totals.carbs += values.carbs * factor;
    totals.fat += values.fat * factor;
    counted = true;
  }

  if (!counted) return null;
  const perServing = Math.trunc(servings ?? 0) || 1;
  return {
    calories: Math.round(totals.cal / perServing),
    protein: Math.round(totals.protein / perServing),
    carbs: Math.round(totals.carbs / perServing),
    fat: Math.round(totals.fat / perServing),
    unmatched,
  };
}
