import { shoppingLine, shoppingListText } from './shopping-list';

describe('shopping list', () => {
  it('joins quantity, unit and name, skipping empty parts', () => {
    expect(shoppingLine({ qty: '200', unit: 'g', name: 'flour' })).toBe('200 g flour');
    expect(shoppingLine({ qty: '2', unit: '', name: 'eggs' })).toBe('2 eggs');
    expect(shoppingLine({ qty: '', unit: '', name: 'Salt' })).toBe('Salt');
  });

  it('builds a text with a title and one line per ingredient', () => {
    const text = shoppingListText('🛒 Pancakes (4 servings)', [
      { qty: '200', unit: 'g', name: 'flour' },
      { qty: '', unit: '', name: '' },
      { qty: '2', unit: '', name: 'eggs' },
    ]);
    expect(text).toBe('🛒 Pancakes (4 servings)\n- 200 g flour\n- 2 eggs');
  });
});
