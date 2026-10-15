import { PairingRule, PairingsFile } from '../models/pairing.model';
import { RecipeData } from '../models/recipe.model';
import { normalizeIngredientName } from './text';

/**
 * Picks the drink suggestion for a recipe: the first rule with a keyword in the recipe name or
 * ingredients, otherwise the rule for its category, otherwise the default rule.
 */
export function pickPairing(
  recipe: Pick<RecipeData, 'name' | 'category' | 'ingredients'>,
  pairings: PairingsFile,
): PairingRule | null {
  const text =
    ' ' +
    normalizeIngredientName(
      [recipe.name, ...(recipe.ingredients ?? []).map((i) => i.name)].join(' '),
    );
  return (
    pairings.rules.find((rule) =>
      rule.keywords.some((k) => text.includes(' ' + normalizeIngredientName(k))),
    ) ??
    pairings.rules.find((rule) => rule.categories.includes(recipe.category)) ??
    pairings.rules.find((rule) => rule.id === 'default') ??
    null
  );
}

/** The disclaimer without its alcohol sentence, for suggestions without wine. */
export function disclaimerWithoutAlcohol(disclaimer: string): string {
  return disclaimer.split('. Please')[0] + '.';
}
