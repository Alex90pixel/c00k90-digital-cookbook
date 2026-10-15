import { Recipe } from '../models/recipe.model';
import { emptyRecipeForm, formToRecipeData, recipeToForm } from './recipe-form';

const existing: Recipe = {
  id: 'r1',
  name: 'Pancakes',
  category: 'Breakfast',
  userId: 'u1',
  createdAt: 1000,
  description: 'Old description',
  notes: 'Use cold milk',
  diets: ['vegetarian', 'quick'],
  tags: ['sunday'],
  favorite: true,
  shared: true,
  servings: 4,
  ingredients: [{ qty: '200', unit: 'g', name: 'flour' }],
  steps: ['Mix'],
  images: [
    {
      url: 'https://firebasestorage.googleapis.com/a.jpg',
      path: 'recipes/u1/a.jpg',
      thumbUrl: 't',
      thumbPath: 'recipes/u1/a_thumb.jpg',
    },
  ],
};

describe('recipeToForm', () => {
  it('merges the old description into the notes and keeps only the manual diets', () => {
    const value = recipeToForm(existing);
    expect(value.notes).toBe('Old description\n\nUse cold milk');
    expect(value.diets.vegetarian).toBe(true);
    expect(Object.keys(value.diets)).not.toContain('quick');
    expect(value.prepTime).toBeNull();
  });
});

describe('formToRecipeData', () => {
  it('keeps the fields the form does not edit when updating', () => {
    const data = formToRecipeData(recipeToForm(existing), 'u1', existing.images ?? [], existing);
    expect(data).toMatchObject({
      createdAt: 1000,
      favorite: true,
      tags: ['sunday'],
      description: '',
    });
    // `shared` is left untouched by updates, so it isn't part of the saved data.
    expect('shared' in data).toBe(false);
    expect(data.imageUrl).toBe(existing.images?.[0].url);
    expect(data.thumbUrl).toBe('t');
  });

  it('trims values and drops empty ingredients and steps', () => {
    const value = {
      ...emptyRecipeForm(),
      name: '  Soup ',
      category: 'Soups' as const,
      ingredients: [
        { qty: ' 1 ', unit: ' l ', name: ' water ' },
        { qty: '2', unit: '', name: '  ' },
      ],
      steps: ['  Boil ', ' '],
      prepTime: 12.7,
    };
    const data = formToRecipeData(value, 'u1', [], null);
    expect(data.name).toBe('Soup');
    expect(data.ingredients).toEqual([{ qty: '1', unit: 'l', name: 'water' }]);
    expect(data.steps).toEqual(['Boil']);
    expect(data.prepTime).toBe(12);
    expect(data.imageEmoji).toBe('🍲');
    expect(data.favorite).toBe(false);
  });

  it('keeps a legacy inline photo apart from the uploaded ones', () => {
    const inline = { url: 'data:image/png;base64,AAA', path: '' };
    const data = formToRecipeData(emptyRecipeForm(), 'u1', [inline], null);
    expect(data.imageData).toBe(inline.url);
    expect(data.images).toEqual([]);
  });
});
