import { PairingsFile } from '../models/pairing.model';
import { disclaimerWithoutAlcohol, pickPairing } from './pairing';

const pairings: PairingsFile = {
  version: 1,
  disclaimer: 'Automatic suggestion. Please drink responsibly.',
  rules: [
    {
      id: 'spicy',
      label: 'Spicy',
      keywords: ['chili', 'sos de soia'],
      categories: [],
      wine: 'Riesling',
      noAlcohol: 'Lassi',
    },
    {
      id: 'soup',
      label: 'Soup',
      keywords: [],
      categories: ['Soups'],
      wine: 'Dry white',
      noAlcohol: 'Tea',
    },
    {
      id: 'default',
      label: 'Default',
      keywords: [],
      categories: [],
      wine: 'Rosé',
      noAlcohol: 'Sparkling water',
    },
  ],
};

describe('pickPairing', () => {
  it('matches keywords in the name or ingredients, with Romanian diacritics', () => {
    expect(pickPairing({ name: 'Chili beans', category: 'Mains' }, pairings)?.id).toBe('spicy');
    expect(
      pickPairing(
        {
          name: 'Orez',
          category: 'Mains',
          ingredients: [{ qty: '', unit: '', name: 'Sos de soia' }],
        },
        pairings,
      )?.id,
    ).toBe('spicy');
  });

  it('falls back to the category, then to the default rule', () => {
    expect(pickPairing({ name: 'Leek soup', category: 'Soups' }, pairings)?.id).toBe('soup');
    expect(pickPairing({ name: 'Toast', category: 'Breakfast' }, pairings)?.id).toBe('default');
  });
});

describe('disclaimerWithoutAlcohol', () => {
  it('drops the alcohol sentence', () => {
    expect(disclaimerWithoutAlcohol(pairings.disclaimer)).toBe('Automatic suggestion.');
  });
});
