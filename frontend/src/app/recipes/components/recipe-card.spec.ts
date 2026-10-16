import { TestBed } from '@angular/core/testing';
import { Recipe } from '../models/recipe.model';
import { RecipeCard } from './recipe-card';

const recipe: Recipe = {
  id: 'r1',
  name: 'Tomato soup',
  category: 'Soups',
  userId: 'u1',
  createdAt: 1,
  prepTime: 10,
  cookTime: 25,
  difficulty: 'Medium',
  imageEmoji: '🍲',
  ingredients: [
    { qty: '1', unit: 'kg', name: 'tomatoes' },
    { qty: '1', unit: '', name: 'onion' },
  ],
};

function render(inputs: { recipe: Recipe; showFavorite?: boolean; favorite?: boolean }) {
  const fixture = TestBed.createComponent(RecipeCard);
  fixture.componentRef.setInput('recipe', inputs.recipe);
  if (inputs.showFavorite !== undefined) {
    fixture.componentRef.setInput('showFavorite', inputs.showFavorite);
  }
  if (inputs.favorite !== undefined) fixture.componentRef.setInput('favorite', inputs.favorite);
  fixture.detectChanges();
  return { fixture, element: fixture.nativeElement as HTMLElement };
}

describe('RecipeCard', () => {
  it('shows the name, total time, difficulty and the first ingredients', () => {
    const { element } = render({ recipe });
    expect(element.querySelector('.card-title')?.textContent).toContain('Tomato soup');
    expect(element.textContent).toContain('⏱ 35 min');
    expect(element.textContent).toContain('🟡 Medium');
    expect(element.querySelector('.card-desc')?.textContent).toBe('tomatoes, onion');
  });

  it('shows the category emoji when there is no photo', () => {
    const { element } = render({ recipe });
    expect(element.querySelector('img')).toBeNull();
    expect(element.querySelector('.card-image-placeholder')?.textContent).toContain('🍲');
  });

  it('has no heart by default (your own recipes cannot be favorites)', () => {
    const { element } = render({ recipe });
    expect(element.querySelector('.heart-btn')).toBeNull();
  });

  it('shows the favorite state and emits open and toggleFavorite', () => {
    const { fixture, element } = render({ recipe, showFavorite: true, favorite: true });
    const opened = vi.fn();
    const toggled = vi.fn();
    fixture.componentInstance.open.subscribe(opened);
    fixture.componentInstance.toggleFavorite.subscribe(toggled);

    const heart = element.querySelector<HTMLButtonElement>('.heart-btn');
    expect(heart?.getAttribute('aria-pressed')).toBe('true');
    expect(heart?.textContent).toContain('❤️');

    element.querySelector<HTMLButtonElement>('.card-open')?.click();
    heart?.click();

    expect(opened).toHaveBeenCalledTimes(1);
    expect(toggled).toHaveBeenCalledTimes(1);
  });
});
