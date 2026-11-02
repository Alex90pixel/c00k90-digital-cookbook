import { Recipe } from '../models/recipe.model';
import { sortRecipes } from './sort';

function recipe(name: string, minutes: number, extra: Partial<Recipe> = {}): Recipe {
  return {
    id: name,
    name,
    category: 'Mains',
    userId: 'u',
    createdAt: 1,
    prepTime: minutes,
    ...extra,
  };
}

const names = (list: Recipe[]) => list.map((r) => r.name);

describe('sortRecipes', () => {
  const list = [recipe('Soup', 40), recipe('No time', 0), recipe('Toast', 5), recipe('Apple', 40)];

  it('puts the quickest first and recipes without a time last', () => {
    expect(names(sortRecipes(list, 'time'))).toEqual(['Toast', 'Apple', 'Soup', 'No time']);
  });

  it('puts the longest first, still with recipes without a time last', () => {
    expect(names(sortRecipes(list, 'time-desc'))).toEqual(['Apple', 'Soup', 'Toast', 'No time']);
  });

  it('sorts A to Z and Z to A', () => {
    expect(names(sortRecipes(list, 'alpha'))).toEqual(['Apple', 'No time', 'Soup', 'Toast']);
    expect(names(sortRecipes(list, 'alpha-desc'))).toEqual(['Toast', 'Soup', 'No time', 'Apple']);
  });

  it('puts the easiest first', () => {
    const mixed = [
      recipe('Hard one', 1, { difficulty: 'Hard' }),
      recipe('Easy one', 1, { difficulty: 'Easy' }),
      recipe('Medium one', 1, { difficulty: 'Medium' }),
    ];
    expect(names(sortRecipes(mixed, 'easy'))).toEqual(['Easy one', 'Medium one', 'Hard one']);
  });

  it('puts the fewest ingredients first and recipes without ingredients last', () => {
    const one = { qty: '1', unit: '', name: 'x' };
    const mixed = [
      recipe('Three', 1, { ingredients: [one, one, one] }),
      recipe('None', 1, { ingredients: [] }),
      recipe('One', 1, { ingredients: [one] }),
    ];
    expect(names(sortRecipes(mixed, 'ingredients'))).toEqual(['One', 'Three', 'None']);
  });

  it('sorts by calories (lowest first) and protein (highest first) from the estimate', () => {
    const nutrition: Record<string, { calories: number; protein: number }> = {
      Light: { calories: 200, protein: 5 },
      Rich: { calories: 800, protein: 40 },
    };
    const mixed = [recipe('Rich', 1), recipe('Unknown', 1), recipe('Light', 1)];
    const of = (r: Recipe) => (nutrition[r.name] as never) ?? null;
    expect(names(sortRecipes(mixed, 'calories', of))).toEqual(['Light', 'Rich', 'Unknown']);
    expect(names(sortRecipes(mixed, 'protein', of))).toEqual(['Rich', 'Light', 'Unknown']);
  });
});
