import { recipeShareText } from './share-text';

describe('recipeShareText', () => {
  it('writes the recipe as a readable message', () => {
    const text = recipeShareText(
      { name: 'Pancakes', tip: 'Rest the batter.' },
      'Serves 4',
      [
        { qty: '200', unit: 'g', name: 'flour' },
        { qty: '', unit: '', name: 'a pinch of salt' },
      ],
      ['Mix', 'Fry'],
      {
        serves: '',
        ingredients: 'Ingredients',
        steps: 'Steps',
        tip: 'Tip',
        footer: 'From my C00K90 cookbook',
      },
    );
    expect(text).toBe(
      [
        '🍽️ Pancakes',
        'Serves 4',
        '',
        '🥕 Ingredients',
        '• 200 g flour',
        '• a pinch of salt',
        '',
        '👩‍🍳 Steps',
        '1. Mix',
        '2. Fry',
        '',
        '💡 Tip: Rest the batter.',
        '',
        'From my C00K90 cookbook',
      ].join('\n'),
    );
  });
});
