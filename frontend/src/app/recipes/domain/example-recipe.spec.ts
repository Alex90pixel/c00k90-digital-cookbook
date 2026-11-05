import { stepDurations } from './step-timers';
import { exampleRecipe } from './example-recipe';

describe('exampleRecipe', () => {
  it('is complete in every language', () => {
    for (const language of ['en', 'ro', 'es', 'fr', 'it', 'de'] as const) {
      const recipe = exampleRecipe(language, 'Example');
      expect(recipe.name).toBeTruthy();
      expect(recipe.description && recipe.tip && recipe.pairing && recipe.extras).toBeTruthy();
      expect(recipe.ingredients.every((i) => i.name)).toBe(true);
      expect(recipe.steps.length).toBe(6);
      expect(recipe.source).toBe('Example');
      // Cook mode offers timers for the baking and cooling steps.
      expect(stepDurations(recipe.steps[4])).toEqual([1800]);
    }
  });

  it('is vegetarian and declares its allergens', () => {
    const cake = exampleRecipe('en', '');
    expect(cake.diets.vegetarian).toBe(true);
    expect(cake.allergens.gluten && cake.allergens.eggs && cake.allergens.milk).toBe(true);
    expect(cake.allergens.nuts).toBe(false);
  });
});
