import { normalizeIngredientLine, toRegion, wholeNumber } from './notebook-transcribe.service';

describe('toRegion', () => {
  it('turns a 0–1000 box [ymin, xmin, ymax, xmax] into fractions', () => {
    expect(toRegion([100, 200, 600, 900])).toEqual({
      top: 0.1,
      left: 0.2,
      bottom: 0.6,
      right: 0.9,
    });
  });

  it('keeps the box inside the image', () => {
    expect(toRegion([-50, 0, 1200, 1000])).toEqual({ top: 0, left: 0, bottom: 1, right: 1 });
  });

  it('ignores missing, malformed or tiny boxes', () => {
    expect(toRegion(undefined)).toBeUndefined();
    expect(toRegion([1, 2, 3])).toBeUndefined();
    expect(toRegion([0, 0, 50, 500])).toBeUndefined();
  });
});

describe('wholeNumber', () => {
  it('keeps sensible numbers, rounded', () => {
    expect(wholeNumber(4, 1)).toBe(4);
    expect(wholeNumber(4.6, 1)).toBe(5);
    expect(wholeNumber(0, 0)).toBe(0);
  });

  it('drops missing or out-of-range values', () => {
    expect(wholeNumber(undefined, 1)).toBeUndefined();
    expect(wholeNumber(0, 1)).toBeUndefined();
    expect(wholeNumber(5000, 0)).toBeUndefined();
    expect(wholeNumber(Number.NaN, 0)).toBeUndefined();
  });
});

describe('normalizeIngredientLine', () => {
  it('turns printed fractions into ones the app can read', () => {
    expect(normalizeIngredientLine('¼ cup peeled onion')).toBe('1/4 cup peeled onion');
    expect(normalizeIngredientLine('⅛ teaspoon kosher salt')).toBe('1/8 tsp kosher salt');
    expect(normalizeIngredientLine('1½ cups rice')).toBe('1.5 cups rice');
    expect(normalizeIngredientLine('1 1/2 cups rice')).toBe('1.5 cups rice');
  });

  it('shortens long unit names', () => {
    expect(normalizeIngredientLine('2 tablespoons pure honey')).toBe('2 tbsp pure honey');
    expect(normalizeIngredientLine('1 teaspoon olive oil')).toBe('1 tsp olive oil');
  });

  it('leaves other lines as they are', () => {
    expect(normalizeIngredientLine('1 (6-ounce) chicken breast')).toBe(
      '1 (6-ounce) chicken breast',
    );
    expect(normalizeIngredientLine('Salt')).toBe('Salt');
    expect(normalizeIngredientLine('  ')).toBe('');
  });
});
