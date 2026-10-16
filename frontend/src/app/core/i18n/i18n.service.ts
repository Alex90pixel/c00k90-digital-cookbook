import { DOCUMENT, Injectable, computed, effect, inject, signal } from '@angular/core';
import { STORAGE_KEYS, safeLocalStorage } from '../storage/local-storage';
import { PluralText, TranslationKey, TranslationParams, Translations } from './i18n.types';
import { en } from './translations/en';
import { ro } from './translations/ro';

export type Language = 'en' | 'ro';

export interface LanguageOption {
  id: Language;
  label: string;
  /** Short badge shown in the picker; flags stand for countries, not languages. */
  code: string;
  /** BCP 47 locale for dates and plural rules. */
  locale: string;
}

export const LANGUAGES: readonly LanguageOption[] = [
  { id: 'en', label: 'English', code: 'EN', locale: 'en-GB' },
  { id: 'ro', label: 'Română', code: 'RO', locale: 'ro-RO' },
];

const DICTIONARIES: Record<Language, Translations> = { en, ro };

/**
 * The app's language. Texts come from typed dictionaries, so every screen switches instantly,
 * without reloading. Recipes themselves stay as their authors wrote them.
 */
@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly document = inject(DOCUMENT);

  readonly language = signal<Language>(initialLanguage(this.document));
  readonly option = computed(() => LANGUAGES.find((l) => l.id === this.language())!);
  private readonly dictionary = computed(() => DICTIONARIES[this.language()]);
  private readonly pluralRules = computed(() => new Intl.PluralRules(this.option().locale));
  private readonly dateFormat = computed(
    () =>
      new Intl.DateTimeFormat(this.option().locale, { dateStyle: 'medium', timeStyle: 'short' }),
  );

  constructor() {
    effect(() => this.document.documentElement.setAttribute('lang', this.language()));
  }

  setLanguage(language: Language): void {
    this.language.set(language);
    safeLocalStorage.set(STORAGE_KEYS.language, language);
  }

  /**
   * The text for `key` in the current language, with `{name}` placeholders filled in.
   * Plural texts use `params.count`. Reactive when called in a template, `computed` or effect.
   */
  readonly t = (key: TranslationKey, params?: TranslationParams): string => {
    const value = lookup(this.dictionary(), key) ?? lookup(en, key);
    if (value === undefined) return key;
    const text = typeof value === 'string' ? value : this.pluralForm(value, params?.['count']);
    return params ? fill(text, params) : text;
  };

  /**
   * Label of a value stored in English in Firestore (category, difficulty, diet). Unknown values,
   * e.g. from older app versions, are shown as they are.
   */
  label(group: 'categories' | 'difficulty' | 'diets', id: string | undefined): string {
    if (!id) return '';
    const value = lookup(this.dictionary(), `${group}.${id}`);
    return typeof value === 'string' ? value : id;
  }

  /** Date and time in the current language, e.g. "16 Oct 2026, 10:30" / "16 oct. 2026, 10:30". */
  dateTime(milliseconds: number): string {
    return this.dateFormat().format(new Date(milliseconds || 0));
  }

  private pluralForm(value: PluralText, count: string | number | undefined): string {
    const rule = this.pluralRules().select(Number(count ?? 0));
    return (rule === 'one' ? value.one : rule === 'few' ? value.few : undefined) ?? value.other;
  }
}

function lookup(dictionary: Translations, key: string): string | PluralText | undefined {
  let node: unknown = dictionary;
  for (const part of key.split('.')) {
    if (typeof node !== 'object' || node === null) return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === 'string' || (typeof node === 'object' && node !== null && 'other' in node)
    ? (node as string | PluralText)
    : undefined;
}

function fill(text: string, params: TranslationParams): string {
  return text.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}

/** The saved choice, otherwise Romanian for Romanian browsers and English for everyone else. */
function initialLanguage(document: Document): Language {
  const saved = safeLocalStorage.get(STORAGE_KEYS.language);
  if (saved === 'en' || saved === 'ro') return saved;
  const browser = document.defaultView?.navigator.language ?? 'en';
  return browser.toLowerCase().startsWith('ro') ? 'ro' : 'en';
}
