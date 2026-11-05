import { starterRecipes } from './starter-recipes';

describe('starterRecipes', () => {
  it('gives three complete recipes in every language', () => {
    for (const language of ['en', 'ro', 'es', 'fr', 'it', 'de'] as const) {
      const recipes = starterRecipes(language, 'Example');
      expect(recipes.length).toBe(3);
      for (const recipe of recipes) {
        expect(recipe.name).toBeTruthy();
        expect(recipe.ingredients.every((i) => i.name)).toBe(true);
        expect(recipe.steps.length).toBeGreaterThan(2);
        expect(recipe.source).toBe('Example');
      }
    }
  });

  it('sets the allergens and the vegetarian label', () => {
    const [pancakes, , chicken] = starterRecipes('en', '');
    expect(pancakes.allergens.gluten).toBe(true);
    expect(pancakes.diets.vegetarian).toBe(true);
    expect(chicken.diets.vegetarian).toBe(false);
  });
});
