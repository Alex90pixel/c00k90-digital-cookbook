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
});
