import { Ingredient } from '../models/recipe.model';

export interface ShareTextLabels {
  serves: string;
  ingredients: string;
  steps: string;
  tip: string;
  footer: string;
}

/**
 * The recipe as plain text, ready for WhatsApp, a message or an email: name, servings,
 * ingredients (as shown, e.g. scaled) and numbered steps.
 */
export function recipeShareText(
  recipe: { name: string; description?: string; tip?: string },
  servingsLine: string,
  ingredients: readonly Ingredient[],
  steps: readonly string[],
  labels: ShareTextLabels,
): string {
  const lines = [`🍽️ ${recipe.name}`];
  if (recipe.description?.trim()) lines.push(recipe.description.trim());
  if (servingsLine) lines.push(servingsLine);
  if (ingredients.length) {
    lines.push('', `🥕 ${labels.ingredients}`);
    for (const i of ingredients) {
      const amount = [i.qty, i.unit].filter((part) => part?.trim()).join(' ');
      lines.push(`• ${amount ? `${amount} ` : ''}${i.name}`.trim());
    }
  }
  if (steps.length) {
    lines.push('', `👩‍🍳 ${labels.steps}`);
    steps.forEach((step, n) => lines.push(`${n + 1}. ${step}`));
  }
  if (recipe.tip?.trim()) lines.push('', `💡 ${labels.tip}: ${recipe.tip.trim()}`);
  lines.push('', labels.footer);
  return lines.join('\n');
}
