import { en } from './translations/en';

/** A text that changes with a number: "1 recipe" / "2 recipes" (Romanian also uses `few`). */
export interface PluralText {
  one: string;
  few?: string;
  other: string;
}

type Dictionary<T> = {
  [K in keyof T]: T[K] extends string
    ? string
    : T[K] extends PluralText
      ? PluralText
      : Dictionary<T[K]>;
};

/** Every language must have exactly the same keys as the English dictionary. */
export type Translations = Dictionary<typeof en>;

type Leaves<T, Prefix extends string = ''> = {
  [K in keyof T & string]: T[K] extends string | PluralText
    ? `${Prefix}${K}`
    : Leaves<T[K], `${Prefix}${K}.`>;
}[keyof T & string];

/** All translation keys, e.g. `'settings.title'`; a typo is a compile error. */
export type TranslationKey = Leaves<typeof en>;

export type TranslationParams = Record<string, string | number>;
