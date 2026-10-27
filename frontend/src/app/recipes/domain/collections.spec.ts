import {
  cleanCollectionName,
  nameTaken,
  parseCollections,
  sortCollections,
  toggleRecipe,
} from './collections';

const list = (id: string, name: string, recipeIds: string[] = []) => ({ id, name, recipeIds });

describe('collections', () => {
  it('cleans names', () => {
    expect(cleanCollectionName('  Quick   dinners ')).toBe('Quick dinners');
    expect(cleanCollectionName('x'.repeat(40)).length).toBe(30);
  });

  it('spots names already used, ignoring case', () => {
    const lists = [list('a', 'Christmas')];
    expect(nameTaken(lists, ' christmas ')).toBe(true);
    expect(nameTaken(lists, 'Christmas', 'a')).toBe(false);
    expect(nameTaken(lists, 'Easter')).toBe(false);
  });

  it('sorts A to Z', () => {
    expect(
      sortCollections([list('1', 'Soups'), list('2', 'Breakfast')]).map((l) => l.name),
    ).toEqual(['Breakfast', 'Soups']);
  });

  it('adds and removes a recipe', () => {
    const added = toggleRecipe(list('a', 'Quick', ['r1']), 'r2');
    expect(added.recipeIds).toEqual(['r1', 'r2']);
    expect(toggleRecipe(added, 'r1').recipeIds).toEqual(['r2']);
  });

  it('reads saved documents defensively', () => {
    expect(parseCollections(undefined)).toEqual([]);
    expect(
      parseCollections([
        list('a', 'Quick', ['r1']),
        { id: 3 },
        { id: 'b', name: 'Soups', recipeIds: [1, 'r2'] },
      ]),
    ).toEqual([list('a', 'Quick', ['r1']), list('b', 'Soups', ['r2'])]);
  });
});
