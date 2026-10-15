export interface PairingRule {
  id: string;
  label: string;
  /** Matched against the recipe name and ingredient names. */
  keywords: string[];
  /** Used when no keyword matches. */
  categories: string[];
  /** Alcoholic suggestion; empty for rules that shouldn't suggest alcohol. */
  wine?: string;
  noAlcohol: string;
}

/** Format of `public/data/pairings.json`. */
export interface PairingsFile {
  version: number;
  disclaimer: string;
  rules: PairingRule[];
}
