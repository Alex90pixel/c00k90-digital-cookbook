import { Recipe } from '../models/recipe.model';
import { buildCookbookHtml, escapeHtml, groupByCategory } from './cookbook-html';

const recipe = (
  id: string,
  name: string,
  category: string,
  extra: Partial<Recipe> = {},
): Recipe => ({
  id,
  name,
  category,
  userId: 'u1',
  createdAt: 0,
  ...extra,
});

const labels = {
  by: 'by',
  contents: 'Contents',
  ingredients: 'Ingredients',
  steps: 'Steps',
  notes: 'My notes',
  source: 'Source',
  serves: (n: number) => `Serves ${n}`,
  minutes: (n: number) => `${n} min`,
  recipeCount: (n: number) => `${n} recipes`,
  category: (id: string) => id,
};

describe('cookbook html', () => {
  it('escapes recipe text', () => {
    expect(escapeHtml('<b>"Tom & Jerry"</b>')).toBe(
      '&lt;b&gt;&quot;Tom &amp; Jerry&quot;&lt;/b&gt;',
    );
  });

  it('groups recipes by category in the app order, sorted by name', () => {
    const groups = groupByCategory([
      recipe('1', 'Soup B', 'Soups'),
      recipe('2', 'Pancakes', 'Breakfast'),
      recipe('3', 'Soup A', 'Soups'),
      recipe('4', 'Mystery', 'Unknown'),
    ]);
    expect(groups.map((g) => g.category)).toEqual(['Breakfast', 'Soups', 'Other']);
    expect(groups[1].recipes.map((r) => r.name)).toEqual(['Soup A', 'Soup B']);
  });

  it('builds a cover, contents with page numbers and one page per recipe', () => {
    const html = buildCookbookHtml({
      style: 'classic',
      lang: 'en',
      title: 'My Cookbook',
      author: 'Sora',
      labels,
      recipes: [
        recipe('1', 'Cashew Chicken', 'Mains', {
          servings: 1,
          prepTime: 5,
          cookTime: 15,
          ingredients: [{ qty: '0.25', unit: 'cup', name: 'cashews' }],
          steps: ['Whisk the sauce.'],
          source: 'Food magazine',
        }),
        recipe('2', 'Pancakes', 'Breakfast'),
      ],
    });
    expect(html).toContain('<h1>My Cookbook</h1>');
    expect(html).toContain('by Sora');
    expect(html).toContain('2 recipes');
    expect(html).toMatch(/Pancakes<\/span><i><\/i><span>3/);
    expect(html).toMatch(/Cashew Chicken<\/span><i><\/i><span>4/);
    expect(html).toContain('<b>¼ cup</b>');
    expect(html).toContain('Serves 1');
    expect(html).toContain('20 min');
    expect(html).toContain('Source: Food magazine');
    expect(html.match(/class="page recipe"/g)?.length).toBe(2);
  });
});
