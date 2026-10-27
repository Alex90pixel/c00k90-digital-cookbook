import {
  formatQuantity,
  parseIngredientLines,
  parseQuantity,
  parseStepLines,
  scaleIngredients,
} from './ingredients';

describe('parseQuantity', () => {
  it('reads whole numbers, decimals and comma decimals', () => {
    expect(parseQuantity('2')).toBe(2);
    expect(parseQuantity('0.5')).toBe(0.5);
    expect(parseQuantity('¼')).toBe(0.25);
    expect(parseQuantity('1½')).toBe(1.5);
    expect(parseQuantity('0,5')).toBe(0.5);
  });

  it('reads fractions and mixed numbers', () => {
    expect(parseQuantity('1/2')).toBe(0.5);
    expect(parseQuantity('1 1/2')).toBe(1.5);
  });

  it('returns null for text without a number', () => {
    expect(parseQuantity('a pinch')).toBeNull();
    expect(parseQuantity('')).toBeNull();
    expect(parseQuantity('1/0')).toBeNull();
  });
});

describe('formatQuantity', () => {
  it('shows whole numbers and kitchen fractions', () => {
    expect(formatQuantity(2)).toBe('2');
    expect(formatQuantity(1.5)).toBe('1½');
    expect(formatQuantity(0.25)).toBe('¼');
    expect(formatQuantity(0.125)).toBe('⅛');
    expect(formatQuantity(1 / 3)).toBe('⅓');
    expect(formatQuantity(2.75)).toBe('2¾');
  });

  it('keeps at most two decimals for other values', () => {
    expect(formatQuantity(0.08)).toBe('0.08');
    expect(formatQuantity(1.4)).toBe('1.4');
  });
});

describe('scaleIngredients', () => {
  it('scales numeric quantities and leaves the others alone', () => {
    const scaled = scaleIngredients(
      [
        { qty: '200', unit: 'g', name: 'flour' },
        { qty: '1/2', unit: 'tsp', name: 'salt' },
        { qty: '', unit: '', name: 'pepper' },
      ],
      2,
    );
    expect(scaled.map((i) => i.qty)).toEqual(['400', '1', '']);
  });

  it('shows halved quantities as fractions', () => {
    expect(scaleIngredients([{ qty: '1/2', unit: 'cup', name: 'rice' }], 0.5)[0].qty).toBe('¼');
  });
});

describe('parseIngredientLines with long unit names', () => {
  it('shortens tablespoons, teaspoon and grams to known units', () => {
    expect(parseIngredientLines('2 tablespoons honey\n1 teaspoon salt\n200 grams flour')).toEqual([
      { qty: '2', unit: 'tbsp', name: 'honey' },
      { qty: '1', unit: 'tsp', name: 'salt' },
      { qty: '200', unit: 'g', name: 'flour' },
    ]);
  });
});

describe('parseIngredientLines', () => {
  it('splits quantity, known unit and name', () => {
    expect(parseIngredientLines('200g flour\n2 eggs\n\nSalt')).toEqual([
      { qty: '200', unit: 'g', name: 'flour' },
      { qty: '2', unit: '', name: 'eggs' },
      { qty: '', unit: '', name: 'Salt' },
    ]);
  });

  it('treats an unknown unit as part of the name', () => {
    expect(parseIngredientLines('3 large onions')).toEqual([
      { qty: '3', unit: '', name: 'large onions' },
    ]);
  });
});

describe('parseStepLines', () => {
  it('removes numbering and bullets and skips empty lines', () => {
    expect(parseStepLines('1. Mix\n2) Bake\n\n- Serve\n• Enjoy')).toEqual([
      'Mix',
      'Bake',
      'Serve',
      'Enjoy',
    ]);
  });
});
