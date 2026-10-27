import { CiqualFile } from '../models/nutrition.model';
import { NutritionIndex, estimateNutrition, ingredientGrams, pieceSizeGrams } from './nutrition';

const ciqual: CiqualFile = {
  source: 'test',
  license: 'test',
  fields: ['name', 'kcal', 'protein', 'carbs', 'fat'],
  per: '100g',
  foods: [
    ['Wheat flour, type 55 (for bread)', 340, 10, 70, 1],
    ['Tomato, raw', 20, 1, 3, 0],
    ['Tomato, canned', 25, 1, 4, 0],
    ['Rice, white, raw', 350, 7, 77.5, 0.8],
    ['Rice, wholegrain, cooked, no added salt', 187, 3.9, 37.6, 1.8],
    ['Rice, white, cooked, no added salt', 155, 3.2, 33.2, 0.7],
  ],
  aliases: { flour: 'Wheat flour, type 55 (for bread)', 'white rice': 'Rice, white, raw' },
};

describe('NutritionIndex', () => {
  const index = NutritionIndex.fromCiqual(ciqual);

  it('finds foods by alias, ignoring words like "chopped"', () => {
    expect(index.lookup('Chopped flour (sifted)')?.cal).toBe(340);
  });

  it('prefers the raw food when several share the main name', () => {
    expect(index.lookup('tomato')?.cal).toBe(20);
  });

  it('uses the cooked food for cooked ingredients', () => {
    expect(index.lookup('white rice')?.cal).toBe(350);
    expect(index.lookup('cooked white rice')?.cal).toBe(155);
  });

  it('falls back to the built-in table', () => {
    expect(index.lookup('butter')?.fat).toBe(81);
    expect(NutritionIndex.fallbackOnly().lookup('flour')?.cal).toBe(364);
  });

  it('returns null for unknown ingredients', () => {
    expect(index.lookup('unicorn dust')).toBeNull();
  });
});

describe('pieceSizeGrams', () => {
  it('reads a size in parentheses at the start of the name', () => {
    expect(pieceSizeGrams('(6-ounce) chicken breast')).toBeCloseTo(170, 0);
    expect(pieceSizeGrams('(400 g) can tomatoes')).toBe(400);
    expect(pieceSizeGrams('(14.5-oz.) can tomatoes')).toBeCloseTo(411, 0);
    expect(pieceSizeGrams('chicken breast')).toBeNull();
    expect(pieceSizeGrams('(large) egg')).toBeNull();
  });

  it('counts sized pieces by their size', () => {
    expect(ingredientGrams({ qty: '2', unit: '', name: '(6-ounce) chicken breasts' })).toBeCloseTo(
      340,
      0,
    );
  });
});

describe('ingredientGrams', () => {
  it('uses units, then piece weights, including Romanian piece names', () => {
    expect(ingredientGrams({ qty: '2', unit: 'tbsp', name: 'oil' })).toBe(30);
    expect(ingredientGrams({ qty: '2', unit: '', name: 'eggs' })).toBe(100);
    expect(ingredientGrams({ qty: '3', unit: '', name: 'oua' })).toBe(150);
    expect(ingredientGrams({ qty: '', unit: 'g', name: 'salt' })).toBe(0);
  });

  it('reads a unit left at the start of the name by older recipes', () => {
    // Was counted as 3 pieces of 100 g (300 g of oil) before.
    expect(ingredientGrams({ qty: '3', unit: '', name: 'tablespoons olive oil' })).toBe(45);
    expect(ingredientGrams({ qty: '1/4', unit: '', name: 'teaspoon ground ginger' })).toBe(1.25);
  });
});

describe('estimateNutrition', () => {
  const index = NutritionIndex.fromCiqual(ciqual);

  it('sums the ingredients and divides by servings', () => {
    const estimate = estimateNutrition(
      [
        { qty: '500', unit: 'g', name: 'flour' },
        { qty: '', unit: '', name: 'water' },
      ],
      2,
      index,
    );
    expect(estimate).toEqual({
      calories: 850,
      protein: 25,
      carbs: 175,
      fat: 3,
      unmatched: ['water'],
    });
  });

  it('returns null when nothing could be counted', () => {
    expect(estimateNutrition([{ qty: '1', unit: '', name: 'unicorn dust' }], 1, index)).toBeNull();
  });
});
