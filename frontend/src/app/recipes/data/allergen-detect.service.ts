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
    const { getAI, getGenerativeModel, GoogleAIBackend, Schema, ThinkingLevel } =
      await import('firebase/ai');
    const app = await (this.aiApp ??= connectAiApp());

    const model = getGenerativeModel(getAI(app, { backend: new GoogleAIBackend() }), {
      model: 'gemini-3.5-flash-lite',
      generationConfig: {
        responseMimeType: 'application/json',
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseSchema: Schema.object({
          properties: {
            allergens: Schema.array({ items: Schema.enumString({ enum: [...ALLERGEN_IDS] }) }),
          },
        }),
      },
    });

    const prompt = `These are the ingredients of a recipe (in any language):
${ingredients.join('\n').slice(0, 3000)}

Which of the 14 EU food allergens do they contain? Use these ids: ${ALLERGEN_IDS.join(', ')}.
"gluten" means cereals with gluten (wheat, rye, barley, oats, spelt); "nuts" means tree nuts (almonds, walnuts,
hazelnuts, cashews, pecans, pistachios...); "milk" includes butter, cream, cheese and yogurt.
Also count allergens usually hidden in common products (e.g. mustard and eggs in mayonnaise, gluten and soy in
soy sauce, sulphites in wine, celery in stock cubes). When in doubt, include it: people with allergies rely on it.`;

    const result = await model.generateContent(prompt);
    const parsed = JSON.parse(result.response.text()) as { allergens?: string[] };
    return ALLERGEN_IDS.filter((id) => parsed.allergens?.includes(id));
  }
}
