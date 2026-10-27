import {
  addDays,
  combineIngredients,
  fromIsoDate,
  isoDate,
  parsePlan,
  prunePlan,
  weekDates,
  weekStart,
} from './meal-plan';

describe('meal plan', () => {
  it('works with local dates', () => {
    expect(isoDate(new Date(2026, 9, 27, 23, 30))).toBe('2026-10-27');
    expect(isoDate(fromIsoDate('2026-03-01'))).toBe('2026-03-01');
    expect(isoDate(addDays(fromIsoDate('2026-10-31'), 1))).toBe('2026-11-01');
  });

  it('starts weeks on Monday', () => {
    expect(isoDate(weekStart(fromIsoDate('2026-10-27')))).toBe('2026-10-26'); // Tuesday
    expect(isoDate(weekStart(fromIsoDate('2026-11-01')))).toBe('2026-10-26'); // Sunday
    expect(weekDates(fromIsoDate('2026-10-26'))).toEqual([
      '2026-10-26',
      '2026-10-27',
      '2026-10-28',
      '2026-10-29',
      '2026-10-30',
      '2026-10-31',
      '2026-11-01',
    ]);
  });

  it('drops old and empty days', () => {
    const today = fromIsoDate('2026-10-27');
    expect(
      prunePlan({ '2026-01-01': ['a'], '2026-10-20': ['b'], '2026-10-28': [] }, today),
    ).toEqual({ '2026-10-20': ['b'] });
  });

  it('reads saved plans defensively', () => {
    expect(parsePlan(null)).toEqual({});
    expect(parsePlan({ '2026-10-27': ['a', 3], monday: ['b'], '2026-10-28': 'x' })).toEqual({
      '2026-10-27': ['a'],
    });
  });

  it('adds up the same ingredients for the week', () => {
    expect(
      combineIngredients([
        [
          { qty: '200', unit: 'g', name: 'flour' },
          { qty: '2', unit: '', name: 'eggs' },
          { qty: '', unit: '', name: 'salt' },
        ],
        [
          { qty: '300', unit: 'g', name: 'Flour' },
          { qty: '1', unit: '', name: 'eggs' },
          { qty: '', unit: '', name: 'salt' },
          { qty: '1', unit: 'cup', name: 'flour' },
        ],
      ]),
    ).toEqual(['3 eggs', '500 g flour', '1 cup flour', 'salt']);
  });
});
