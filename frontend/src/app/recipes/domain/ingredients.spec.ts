import {
  withQuantity,
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

describe('parseIngredientLines in any order', () => {
  it('reads the quantity and unit after the name', () => {
    expect(
      parseIngredientLines('flour 200 g\neggs: 2\nmilk - 300ml\nfăină 200 gr\n- sugar 1/2 cup'),
    ).toEqual([
      { qty: '200', unit: 'g', name: 'flour' },
      { qty: '2', unit: '', name: 'eggs' },
      { qty: '300', unit: 'ml', name: 'milk' },
      { qty: '200', unit: 'g', name: 'făină' },
      { qty: '1/2', unit: 'cup', name: 'sugar' },
    ]);
  });

  it('understands units in Romanian and comma decimals', () => {
    expect(parseIngredientLines('2 linguri ulei\n0,5 kg cartofi\n1 linguriță sare')).toEqual([
      { qty: '2', unit: 'tbsp', name: 'ulei' },
      { qty: '0,5', unit: 'kg', name: 'cartofi' },
      { qty: '1', unit: 'tsp', name: 'sare' },
    ]);
  });

  it('keeps names with numbers or unknown words after the number as they are', () => {
    expect(parseIngredientLines('eggs 2 large')).toEqual([
      { qty: '', unit: '', name: 'eggs 2 large' },
    ]);
  });
});

describe('parseStepLines on one line', () => {
  it('splits a short list of actions', () => {
    expect(parseStepLines('wash rice, chop chicken, boil rice')).toEqual([
      'wash rice',
      'chop chicken',
      'boil rice',
    ]);
  });

  it('splits numbering and several sentences', () => {
    expect(parseStepLines('1. Mix the flour 2. Add the eggs 3) Fry')).toEqual([
      'Mix the flour',
      'Add the eggs',
      'Fry',
    ]);
    expect(parseStepLines('Mix it. Let it rest 10 minutes. Bake.')).toEqual([
      'Mix it.',
      'Let it rest 10 minutes.',
      'Bake.',
    ]);
  });

  it('keeps one step with a comma or two sentences as it is', () => {
    expect(parseStepLines('Add the flour, then stir well')).toEqual([
      'Add the flour, then stir well',
    ]);
    expect(parseStepLines('Bake 30 minutes. Let it cool.')).toEqual([
      'Bake 30 minutes. Let it cool.',
    ]);
  });
});

describe('parseIngredientLines on one line', () => {
  it('splits a list separated by commas, but not decimal commas', () => {
    expect(parseIngredientLines('chicken, 0,5 kg rice, peppers 2')).toEqual([
      { qty: '', unit: '', name: 'chicken' },
      { qty: '0,5', unit: 'kg', name: 'rice' },
      { qty: '2', unit: '', name: 'peppers' },
    ]);
  });
});

describe('parseIngredientLines with more units', () => {
  it('reads units in many languages, before or after the name', () => {
    expect(
      parseIngredientLines(
        'ouă 3 bucăți\n200 de grame făină\nusturoi 2 căței\nlapte 1 pahar\n1 plic praf de copt\nsare 1 vârf',
      ),
    ).toEqual([
      { qty: '3', unit: 'pcs', name: 'ouă' },
      { qty: '200', unit: 'g', name: 'făină' },
      { qty: '2', unit: 'cloves', name: 'usturoi' },
      { qty: '1', unit: 'glass', name: 'lapte' },
      { qty: '1', unit: 'packet', name: 'praf de copt' },
      { qty: '1', unit: 'pinch', name: 'sare' },
    ]);
    expect(parseIngredientLines('2 cucharadas aceite\nail 2 gousses\n2 EL Öl')).toEqual([
      { qty: '2', unit: 'tbsp', name: 'aceite' },
      { qty: '2', unit: 'cloves', name: 'ail' },
      { qty: '2', unit: 'tbsp', name: 'Öl' },
    ]);
  });
});

describe('withQuantity', () => {
  it('takes the amount out of the name of older ingredients', () => {
    expect(withQuantity({ qty: '', unit: '', name: '2 tablespoons tbsp milk' })).toEqual({
      qty: '2',
      unit: 'tbsp',
      name: 'milk',
    });
    expect(withQuantity({ qty: '', unit: '', name: '30 grams fresh spinach' })).toEqual({
      qty: '30',
      unit: 'g',
      name: 'fresh spinach',
    });
  });

  it('leaves ingredients that already have a quantity, or have none, alone', () => {
    const eggs = { qty: '3', unit: '', name: 'eggs' };
    expect(withQuantity(eggs)).toBe(eggs);
    const salt = { qty: '', unit: '', name: 'salt' };
    expect(withQuantity(salt)).toBe(salt);
  });
});
