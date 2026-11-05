import { lazyImport } from '../../core/app-update/stale-chunk';
import { Injectable } from '@angular/core';
import { FirebaseApp } from 'firebase/app';
import { ALLERGEN_IDS } from '../models/recipe.constants';
import { AllergenId } from '../models/recipe.model';
import { connectAiApp } from './notebook-transcribe.service';

/**
 * Finds which of the 14 EU allergens a list of ingredients contains, with Gemini through the
 * same free AI project as the notebook transcription. Only the ingredient lines are sent.
 * The result is a suggestion: the author checks and confirms it in the form.
 */
@Injectable({ providedIn: 'root' })
export class AllergenDetectService {
  private aiApp?: Promise<FirebaseApp>;

  async detect(ingredients: string[]): Promise<AllergenId[]> {
    const [result] = await this.detectMany([ingredients]);
    return result;
  }

  /**
   * Several recipes in one request (the free tier allows only a few requests per minute).
   * Returns one allergen list per recipe, in the same order.
   */
  async detectMany(recipes: string[][]): Promise<AllergenId[][]> {
    const { getAI, getGenerativeModel, GoogleAIBackend, Schema, ThinkingLevel } = await lazyImport(
      () => import('firebase/ai'),
    );
    const app = await (this.aiApp ??= connectAiApp());

    const model = getGenerativeModel(getAI(app, { backend: new GoogleAIBackend() }), {
      model: 'gemini-3.5-flash-lite',
      generationConfig: {
        responseMimeType: 'application/json',
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseSchema: Schema.object({
          properties: {
            recipes: Schema.array({
              items: Schema.object({
                properties: {
                  index: Schema.integer(),
                  allergens: Schema.array({
                    items: Schema.enumString({ enum: [...ALLERGEN_IDS] }),
                  }),
                },
              }),
            }),
          },
        }),
      },
    });

    const list = recipes
      .map((lines, index) => `Recipe ${index}:\n${lines.join('\n').slice(0, 2000)}`)
      .join('\n\n');
    const prompt = `These are the ingredients of ${recipes.length} recipe(s) (in any language):

${list}

For each recipe (by its index), which of the 14 EU food allergens do its ingredients contain? Use these ids: ${ALLERGEN_IDS.join(', ')}.
"gluten" means cereals with gluten (wheat, rye, barley, oats, spelt); "nuts" means tree nuts (almonds, walnuts,
hazelnuts, cashews, pecans, pistachios...); "milk" includes butter, cream, cheese and yogurt.
Also count allergens usually hidden in common products (e.g. mustard and eggs in mayonnaise, gluten and soy in
soy sauce, sulphites in wine, celery in stock cubes). When in doubt, include it: people with allergies rely on it.`;

    const result = await model.generateContent(prompt);
    const parsed = JSON.parse(result.response.text()) as {
      recipes?: { index?: number; allergens?: string[] }[];
    };
    return recipes.map((_, index) => {
      const found = parsed.recipes?.find((r) => r.index === index);
      if (!found) throw new Error(`No answer for recipe ${index}`);
      return ALLERGEN_IDS.filter((id) => found.allergens?.includes(id));
    });
  }
}
