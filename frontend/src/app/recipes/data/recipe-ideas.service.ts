import { Injectable } from '@angular/core';
import { FirebaseApp } from 'firebase/app';
import { CATEGORIES } from '../models/recipe.constants';
import { Category } from '../models/recipe.model';
import { RecipeIdea } from '../models/recipe-idea.model';
import { connectAiApp } from './notebook-transcribe.service';

/** Ways to narrow the ideas, picked as chips in "What can I cook?". */
export type IdeaOption = 'quick' | 'vegetarian' | 'budget' | 'onePot' | 'kids' | 'protein';

const OPTION_PROMPTS: Record<IdeaOption, string> = {
  quick: 'All recipes must be quick: ready in 30 minutes or less in total.',
  vegetarian: 'All recipes must be vegetarian (no meat or fish).',
  budget: 'Keep them cheap: affordable, everyday ingredients and no expensive extras.',
  onePot: 'Each recipe must be cooked in a single pot, pan or tray, so there is little washing up.',
  kids: 'Make them kid-friendly: mild, simple flavours, nothing spicy.',
  protein: 'Make them high in protein (at least 25 g per serving).',
};

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  ro: 'Romanian',
  es: 'Spanish',
  fr: 'French',
  it: 'Italian',
  de: 'German',
};

/**
 * Suggests a few recipes from the ingredients the user has at home, with Gemini through the
 * same free AI project as the notebook transcription. Only the typed ingredients are sent.
 */
@Injectable({ providedIn: 'root' })
export class RecipeIdeasService {
  private aiApp?: Promise<FirebaseApp>;

  /**
   * `options` narrows the ideas (quick, for guests, vegetarian…); `avoid` lists names already
   * suggested, so "More ideas" brings new ones.
   */
  async suggest(
    ingredients: string,
    language: string,
    options: readonly IdeaOption[] = [],
    avoid: readonly string[] = [],
  ): Promise<RecipeIdea[]> {
    const { getAI, getGenerativeModel, GoogleAIBackend, Schema, ThinkingLevel } =
      await import('firebase/ai');
    const app = await (this.aiApp ??= connectAiApp());
    const categories = CATEGORIES.map((c) => c.id);

    const model = getGenerativeModel(getAI(app, { backend: new GoogleAIBackend() }), {
      model: 'gemini-3.5-flash-lite',
      generationConfig: {
        responseMimeType: 'application/json',
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseSchema: Schema.object({
          properties: {
            ideas: Schema.array({
              items: Schema.object({
                properties: {
                  name: Schema.string(),
                  description: Schema.string(),
                  category: Schema.enumString({ enum: categories }),
                  difficulty: Schema.enumString({ enum: ['Easy', 'Medium', 'Hard'] }),
                  extras: Schema.array({ items: Schema.string() }),
                  tip: Schema.string(),
                  servings: Schema.integer(),
                  prepMinutes: Schema.integer(),
                  cookMinutes: Schema.integer(),
                  ingredients: Schema.array({ items: Schema.string() }),
                  steps: Schema.array({ items: Schema.string() }),
                },
              }),
            }),
          },
        }),
      },
    });

    const prompt = `I have these ingredients at home: ${ingredients.slice(0, 500)}.
Suggest 3 different, tasty home-cooking recipes built around these ingredients, like a creative friend who cooks
well: one quick and easy, one a bit more elaborate, and one with a different cuisine or twist. Each may add common
pantry items (salt, pepper, oil, butter, spices, herbs, flour, eggs, onion, garlic, stock) and a few easy-to-find
fresh vegetables that go well with them.
Write everything in ${LANGUAGE_NAMES[language] ?? 'English'}.
For each recipe return: name; description (2 short sentences: what it is and why it is good, e.g. taste and texture);
category (one of ${categories.join(', ')}); difficulty (Easy, Medium or Hard); servings; prepMinutes; cookMinutes;
ingredients (one per item, with metric quantity and unit, e.g. "200 g rice");
steps (clear and in order, with times and heat where useful);
extras (2-3 optional additions that would go well, each with a short reason, e.g. "corn, for sweetness and crunch");
tip (one practical cook's tip). If the input is not food ingredients, return an empty list.${options
      .map((o) => `\n${OPTION_PROMPTS[o]}`)
      .join('')}${
      avoid.length
        ? `\nDo not suggest these again; suggest different dishes: ${avoid.join('; ').slice(0, 400)}.`
        : ''
    }`;

    const result = await model.generateContent(prompt);
    const parsed = JSON.parse(result.response.text()) as { ideas?: Partial<RecipeIdea>[] };
    return (parsed.ideas ?? []).flatMap((idea) => {
      const name = (idea.name ?? '').trim();
      if (!name || !idea.ingredients?.length || !idea.steps?.length) return [];
      return [
        {
          name,
          description: (idea.description ?? '').trim(),
          category: categories.includes(idea.category as Category)
            ? (idea.category as Category)
            : 'Other',
          difficulty:
            (['Easy', 'Medium', 'Hard'] as const).find((d) => d === idea.difficulty) ?? 'Easy',
          extras: (idea.extras ?? []).map((line) => line.trim()).filter(Boolean),
          tip: (idea.tip ?? '').trim(),
          servings: Math.max(1, Math.round(idea.servings ?? 2)),
          prepMinutes: Math.max(0, Math.round(idea.prepMinutes ?? 0)),
          cookMinutes: Math.max(0, Math.round(idea.cookMinutes ?? 0)),
          ingredients: idea.ingredients.map((line) => line.trim()).filter(Boolean),
          steps: idea.steps.map((line) => line.trim()).filter(Boolean),
        },
      ];
    });
  }
}
