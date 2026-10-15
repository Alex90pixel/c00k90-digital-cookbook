const FILLER_WORDS =
  /\b(fresh|chopped|diced|sliced|grated|large|small|medium|finely|roughly|to taste|optional|proaspat|tocat|mare|mic)\b/g;

/**
 * Normalizes an ingredient name for matching: lowercase, no diacritics (ă → a),
 * no text in parentheses, no digits/punctuation, and without preparation words like "chopped".
 */
export function normalizeIngredientName(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\(.*?\)/g, ' ')
    .replace(/[^a-z\s-]/g, ' ')
    .replace(FILLER_WORDS, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Matches `word` as a whole word (letters only count as word characters). */
export function wholeWordRegExp(word: string): RegExp {
  return new RegExp(`(^|[^a-z])${escapeRegExp(word)}([^a-z]|$)`);
}
