import { ingredientTerms, matchesIngredients, withinTime } from './filters';

const recipe = {
  ingredients: [
    { qty: '1', unit: '', name: 'Chicken breast' },
    { qty: '200', unit: 'g', name: 'ciuperci' },
    { qty: '1', unit: 'cup', name: 'cooked white rice' },
  ],
};

describe('recipe filters', () => {
  it('splits what the user typed into ingredients', () => {
    expect(ingredientTerms(' Chicken, rice ;; Ciupercă,x ')).toEqual([
      'chicken',
      'rice',
      'ciuperca',
    ]);
    expect(ingredientTerms('')).toEqual([]);
  });

  it('keeps recipes with every "with" ingredient and none of the "without" ones', () => {
    expect(matchesIngredients(recipe, ['chicken', 'rice'], [])).toBe(true);
    expect(matchesIngredients(recipe, ['chick'], [])).toBe(true);
    expect(matchesIngredients(recipe, ['chicken', 'beef'], [])).toBe(false);
    expect(matchesIngredients(recipe, [], ['ciuperci'])).toBe(false);
    expect(matchesIngredients(recipe, [], ['onion'])).toBe(true);
    // Only the start of a word counts: "ice" is not in "rice".
    expect(matchesIngredients(recipe, ['ice'], [])).toBe(false);
  });

  it('keeps recipes within the time limit', () => {
    expect(withinTime({ prepTime: 10, cookTime: 15 }, 30)).toBe(true);
    expect(withinTime({ prepTime: 10, cookTime: 25 }, 30)).toBe(false);
    expect(withinTime({}, 30)).toBe(false);
  });
});
