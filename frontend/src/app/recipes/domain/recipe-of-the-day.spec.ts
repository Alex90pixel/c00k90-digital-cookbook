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

  it('changes from one day to another', () => {
    const list = Array.from({ length: 20 }, (_, i) => recipe(`r${i}`, true));
    const days = ['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04'];
    const picks = new Set(days.map((d) => recipeOfTheDay(list, d, 'u1')?.id));
    expect(picks.size).toBeGreaterThan(1);
  });

  it('has nothing to show without recipes', () => {
    expect(recipeOfTheDay([], '2026-11-04')).toBeNull();
  });

  it('formats the local day', () => {
    expect(localDay(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});
