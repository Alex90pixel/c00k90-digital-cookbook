import { estimateTimeAndServings } from './time-estimate';

describe('estimateTimeAndServings', () => {
  const ingredients = [{ qty: '600', unit: 'g', name: 'potatoes' }];

  it('needs at least one step and one ingredient', () => {
    expect(estimateTimeAndServings(0, ingredients, 'Mains', null)).toBeNull();
    expect(estimateTimeAndServings(3, [], 'Mains', null)).toBeNull();
  });

  it('estimates times from the steps and servings from the weight', () => {
    // 10 + 3 × 6 = 28 minutes; 600 g / 300 g per serving = 2 servings
    expect(estimateTimeAndServings(3, ingredients, 'Mains', null)).toEqual({
      prepTime: 10,
      cookTime: 18,
      servings: 2,
      minMinutes: 22,
      maxMinutes: 34,
    });
  });

  it('uses calories per category when the nutrition estimate is reliable', () => {
    const nutrition = { calories: 2200, protein: 0, carbs: 0, fat: 0, unmatched: [] };
    expect(estimateTimeAndServings(3, ingredients, 'Mains', nutrition)?.servings).toBe(4);
  });
});
