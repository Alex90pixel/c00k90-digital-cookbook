import { NutritionEstimate } from '../models/nutrition.model';
import { dietLabels } from './diets';

const lean: NutritionEstimate = { calories: 300, protein: 30, carbs: 5, fat: 8, unmatched: [] };

describe('dietLabels', () => {
  it('adds nutrition labels only when every ingredient was recognized', () => {
    expect(dietLabels({ diets: ['vegan'] }, lean)).toEqual([
      'vegan',
      'high-protein',
      'low-carb',
      'low-fat',
      'keto',
    ]);
    expect(dietLabels({ diets: ['vegan'] }, { ...lean, unmatched: ['water'] })).toEqual(['vegan']);
  });

  it('adds "quick" under 30 minutes in total', () => {
    expect(dietLabels({ prepTime: 10, cookTime: 15 }, null)).toEqual(['quick']);
    expect(dietLabels({ prepTime: 10, cookTime: 20 }, null)).toEqual([]);
    expect(dietLabels({}, null)).toEqual([]);
  });
});
