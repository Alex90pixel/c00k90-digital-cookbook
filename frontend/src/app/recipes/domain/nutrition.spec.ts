import { CiqualFile } from '../models/nutrition.model';
import { NutritionIndex, estimateNutrition, ingredientGrams } from './nutrition';

const ciqual: CiqualFile = {
  source: 'test',
  license: 'test',
  fields: ['name', 'kcal', 'protein', 'carbs', 'fat'],
  per: '100g',
  foods: [
    ['Wheat flour, type 55 (for bread)', 340, 10, 70, 1],
    ['Tomato, raw', 20, 1, 3, 0],
    ['Tomato, canned', 25, 1, 4, 0],
  ],
  aliases: { flour: 'Wheat flour, type 55 (for bread)' },
};

describe('NutritionIndex', () => {
  const index = NutritionIndex.fromCiqual(ciqual);

  it('finds foods by alias, ignoring words like "chopped"', () => {
    expect(index.lookup('Chopped flour (sifted)')?.cal).toBe(340);
  });

  it('prefers the raw food when several share the main name', () => {
    expect(index.lookup('tomato')?.cal).toBe(20);
  });

  it('falls back to the built-in table', () => {
    expect(index.lookup('butter')?.fat).toBe(81);
    expect(NutritionIndex.fallbackOnly().lookup('flour')?.cal).toBe(364);
  });

  it('returns null for unknown ingredients', () => {
    expect(index.lookup('unicorn dust')).toBeNull();
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
