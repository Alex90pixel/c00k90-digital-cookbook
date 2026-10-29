import { stepToMetric, toMetric, usesUsUnits } from './metric';

describe('metric conversion', () => {
  it('converts US units to grams and millilitres, rounded for cooking', () => {
    expect(toMetric({ qty: '8', unit: 'oz', name: 'pasta' })).toEqual({
      qty: '230',
      unit: 'g',
      name: 'pasta',
    });
    expect(toMetric({ qty: '1', unit: 'cup', name: 'milk' })).toEqual({
      qty: '240',
      unit: 'ml',
      name: 'milk',
    });
    expect(toMetric({ qty: '0.25', unit: 'cup', name: 'cashews' })).toEqual({
      qty: '60',
      unit: 'ml',
      name: 'cashews',
    });
    expect(toMetric({ qty: '3', unit: 'lb', name: 'pork' })).toEqual({
      qty: '1.4',
      unit: 'kg',
      name: 'pork',
    });
    expect(toMetric({ qty: '2', unit: 'cups', name: 'flour' })).toEqual({
      qty: '480',
      unit: 'ml',
      name: 'flour',
    });
  });

  it('keeps metric and other units as they are', () => {
    const tbsp = { qty: '2', unit: 'tbsp', name: 'honey' };
    expect(toMetric(tbsp)).toEqual(tbsp);
    const grams = { qty: '200', unit: 'g', name: 'flour' };
    expect(toMetric(grams)).toEqual(grams);
  });

  it('reads units left in the name and sizes in parentheses', () => {
    expect(toMetric({ qty: '2', unit: '', name: 'ounces cheddar' })).toEqual({
      qty: '55',
      unit: 'g',
      name: 'cheddar',
    });
    expect(toMetric({ qty: '1', unit: '', name: '(6-ounce) chicken breast' })).toEqual({
      qty: '1',
      unit: '',
      name: '(170 g) chicken breast',
    });
  });

  it('converts oven temperatures', () => {
    expect(stepToMetric('Bake at 350°F for 20 minutes.')).toBe('Bake at 175°C for 20 minutes.');
    expect(stepToMetric('Preheat the oven to 425 degrees F.')).toBe('Preheat the oven to 220°C.');
    expect(stepToMetric('Simmer 5 minutes.')).toBe('Simmer 5 minutes.');
  });

  it('tells when a recipe uses US units', () => {
    expect(usesUsUnits([{ qty: '1', unit: 'cup', name: 'rice' }], [])).toBe(true);
    expect(usesUsUnits([], ['Bake at 400°F.'])).toBe(true);
    expect(usesUsUnits([{ qty: '200', unit: 'g', name: 'rice' }], ['Boil.'])).toBe(false);
  });
});
