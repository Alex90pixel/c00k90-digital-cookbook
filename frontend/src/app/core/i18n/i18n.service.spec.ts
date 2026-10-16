import { TestBed } from '@angular/core/testing';
import { I18nService } from './i18n.service';
import { en } from './translations/en';
import { ro } from './translations/ro';

describe('I18nService', () => {
  let i18n: I18nService;

  beforeEach(() => {
    localStorage.clear();
    i18n = TestBed.inject(I18nService);
    i18n.setLanguage('en');
  });

  it('fills placeholders', () => {
    expect(i18n.t('detail.prep', { minutes: 15 })).toBe('🥄 Prep: 15 min');
  });

  it('picks English plural forms', () => {
    expect(i18n.t('list.count', { count: 1 })).toBe('1 recipe');
    expect(i18n.t('list.count', { count: 3 })).toBe('3 recipes');
  });

  it('picks the three Romanian plural forms', () => {
    i18n.setLanguage('ro');
    expect(i18n.t('list.count', { count: 1 })).toBe('1 rețetă');
    expect(i18n.t('list.count', { count: 5 })).toBe('5 rețete');
    expect(i18n.t('list.count', { count: 20 })).toBe('20 de rețete');
  });

  it('switches language, remembers the choice and updates <html lang>', () => {
    i18n.setLanguage('ro');
    TestBed.tick();
    expect(i18n.t('settings.title')).toBe('⚙️ Setări');
    expect(localStorage.getItem('c00k90-lang')).toBe('ro');
    expect(document.documentElement.lang).toBe('ro');
  });

  it('translates values stored in English and keeps unknown ones as they are', () => {
    i18n.setLanguage('ro');
    expect(i18n.label('categories', 'Soups')).toBe('Supe și ciorbe');
    expect(i18n.label('difficulty', 'Hard')).toBe('Dificil');
    expect(i18n.label('categories', 'Brunch')).toBe('Brunch');
  });

  it('has no empty Romanian texts', () => {
    const empty: string[] = [];
    const walk = (node: object, path: string) => {
      for (const [key, value] of Object.entries(node)) {
        if (typeof value === 'string') {
          if (!value.trim()) empty.push(`${path}${key}`);
        } else walk(value, `${path}${key}.`);
      }
    };
    walk(ro, '');
    expect(empty).toEqual([]);
    // Same top-level groups as English (the compiler checks the rest of the shape).
    expect(Object.keys(ro)).toEqual(Object.keys(en));
  });
});
