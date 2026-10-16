export interface PairingText {
  /** Alcoholic suggestion; empty for rules that shouldn't suggest alcohol. */
  wine?: string;
  noAlcohol: string;
}

export interface PairingRule extends PairingText {
  id: string;
  label: string;
  /** Matched against the recipe name and ingredient names. */
  keywords: string[];
  /** Used when no keyword matches. */
  categories: string[];
  /** Romanian version of the suggestion (the English one is `wine` / `noAlcohol`). */
  ro?: PairingText;
}

/** Format of `public/data/pairings.json`. */
export interface PairingsFile {
  version: number;
  /** English disclaimer; its first sentence is used when no alcohol is suggested. */
  disclaimer: string;
  rules: PairingRule[];
  translations?: {
    ro?: { disclaimer: string; disclaimerWithoutAlcohol: string };
  };
}
