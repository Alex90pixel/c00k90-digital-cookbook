import { AiUsageService } from '../../core/ai/ai-usage.service';
import { lazyImport } from '../../core/app-update/stale-chunk';
import { Injectable, inject } from '@angular/core';
import { FirebaseApp } from 'firebase/app';
import { ALLERGEN_IDS } from '../models/recipe.constants';
import { AllergenId, ManualDietId } from '../models/recipe.model';

/** The diets that can be read from the ingredients alone. */
export const DETECTABLE_DIETS = ['vegetarian', 'vegan', 'gluten-free', 'dairy-free'] as const;
export type DetectableDiet = (typeof DETECTABLE_DIETS)[number] & ManualDietId;
import { connectAiApp } from './notebook-transcribe.service';

/**
 * Finds which of the 14 EU allergens a list of ingredients contains, with Gemini through the
 * same free AI project as the notebook transcription. Only the ingredient lines are sent.
 * The result is a suggestion: the author checks and confirms it in the form.
 */
@Injectable({ providedIn: 'root' })
export class AllergenDetectService {
  private readonly usage = inject(AiUsageService);
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

    this.usage.take();
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

  /**
   * The allergens of one recipe and the diets it fits (vegetarian, vegan, gluten-free,
   * dairy-free), in one request. Both are suggestions the author checks in the form.
   */
  async detectWithDiets(
    ingredients: string[],
  ): Promise<{ allergens: AllergenId[]; diets: DetectableDiet[] }> {
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
            allergens: Schema.array({ items: Schema.enumString({ enum: [...ALLERGEN_IDS] }) }),
            diets: Schema.array({ items: Schema.enumString({ enum: [...DETECTABLE_DIETS] }) }),
          },
        }),
      },
    });
    const prompt = `These are the ingredients of a recipe (in any language):

${ingredients.join('\n').slice(0, 2000)}

1. Which of the 14 EU food allergens do they contain? Use these ids: ${ALLERGEN_IDS.join(', ')}.
"gluten" means cereals with gluten (wheat, rye, barley, oats, spelt); "nuts" means tree nuts; "milk" includes
butter, cream, cheese and yogurt. Count allergens hidden in common products (mayonnaise, soy sauce, wine, stock
cubes). When in doubt, include it: people with allergies rely on it.
2. Which of these diets does the recipe fit: ${DETECTABLE_DIETS.join(', ')}?
vegetarian = no meat, poultry, fish or seafood (also no gelatin, lard, fish sauce or meat stock);
vegan = vegetarian and also no eggs, milk products or honey; gluten-free = no gluten at all;
dairy-free = no milk products. When in doubt, leave the diet out.`;
    this.usage.take();
    const result = await model.generateContent(prompt);
    const parsed = JSON.parse(result.response.text()) as { allergens?: string[]; diets?: string[] };
    const allergens = ALLERGEN_IDS.filter((id) => parsed.allergens?.includes(id));
    // A diet can't contradict the allergens found (e.g. no "gluten-free" when gluten was found).
    const diets = DETECTABLE_DIETS.filter(
      (id) =>
        parsed.diets?.includes(id) &&
        !(id === 'gluten-free' && allergens.includes('gluten')) &&
        !(id === 'dairy-free' && allergens.includes('milk')) &&
        !(id === 'vegan' && (allergens.includes('milk') || allergens.includes('eggs'))),
    );
    return { allergens, diets };
  }
}
