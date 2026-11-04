import { Recipe } from '../models/recipe.model';
import { localDay, recipeOfTheDay } from './recipe-of-the-day';

const recipe = (id: string, photo = false): Recipe => ({
  id,
  name: id,
  category: 'Mains',
  userId: 'u',
  createdAt: 1,
  imageUrl: photo ? 'https://example.com/a.jpg' : '',
});

describe('recipeOfTheDay', () => {
  it('picks the same recipe all day and prefers recipes with a photo', () => {
    const list = [recipe('a'), recipe('b', true), recipe('c', true)];
    const today = recipeOfTheDay(list, '2026-11-04', 'u1');
    expect(recipeOfTheDay([...list].reverse(), '2026-11-04', 'u1')).toBe(today);
    expect(today?.id).not.toBe('a');
  });

  it('shows every recipe once before any comes back', () => {
    const list = Array.from({ length: 7 }, (_, i) => recipe(`r${i}`, true));
    const days = Array.from({ length: 7 }, (_, i) => `2026-11-${String(i + 1).padStart(2, '0')}`);
    const picks = days.map((d) => recipeOfTheDay(list, d, 'u1')?.id);
    expect(new Set(picks).size).toBe(7);
    expect(recipeOfTheDay(list, '2026-11-08', 'u1')?.id).toBe(picks[0]);
  });

  it('has nothing to show without recipes', () => {
    expect(recipeOfTheDay([], '2026-11-04')).toBeNull();
  });

  it('formats the local day', () => {
    expect(localDay(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});
