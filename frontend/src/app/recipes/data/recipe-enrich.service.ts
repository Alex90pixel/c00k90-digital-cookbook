import { lazyImport } from '../../core/app-update/stale-chunk';
import { Injectable } from '@angular/core';
import { FirebaseApp } from 'firebase/app';
import { connectAiApp } from './notebook-transcribe.service';

/** What the AI adds to a recipe: a short intro, things that go well with it and a cook's tip. */
export interface RecipeEnrichment {
  description: string;
  extras: string[];
  tip: string;
}

/** The parts of a recipe the AI reads. */
export interface RecipeToEnrich {
  name: string;
  ingredients: string[];
  steps: string[];
}

/**
 * Writes a short description, 2-3 pairings and a tip for recipes, with Gemini through the same
 * free AI project as the notebook transcription. Only the name, ingredients and steps are sent.
 */
@Injectable({ providedIn: 'root' })
export class RecipeEnrichService {
  private aiApp?: Promise<FirebaseApp>;

  async enrich(recipe: RecipeToEnrich): Promise<RecipeEnrichment> {
    const [result] = await this.enrichMany([recipe]);
    return result;
  }

  /** Several recipes in one request; one result per recipe, in the same order. */
  async enrichMany(recipes: RecipeToEnrich[]): Promise<RecipeEnrichment[]> {
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
                  description: Schema.string(),
                  extras: Schema.array({ items: Schema.string() }),
                  tip: Schema.string(),
                },
              }),
            }),
          },
        }),
      },
    });

    const list = recipes
      .map(
        (r, index) =>
          `Recipe ${index}: ${r.name}\nIngredients:\n${r.ingredients.join('\n')}\nSteps:\n${r.steps
            .join('\n')
            .slice(0, 1500)}`,
      )
      .join('\n\n');
    const prompt = `${list}

For each recipe above (by its index), write in THE SAME LANGUAGE as that recipe's text:
- description: 1-2 short, warm sentences about what the dish is and why it is good (taste, texture, occasion).
  No exaggeration, no exclamation marks.
- extras: 2-3 optional additions or sides that go well with it, each with a short reason
  (e.g. "corn, for sweetness and crunch").
- tip: one practical cook's tip for this recipe.
Do not change or repeat the recipe itself.`;

    const result = await model.generateContent(prompt);
    const parsed = JSON.parse(result.response.text()) as {
      recipes?: { index?: number; description?: string; extras?: string[]; tip?: string }[];
    };
    return recipes.map((_, index) => {
      const found = parsed.recipes?.find((r) => r.index === index);
      if (!found) throw new Error(`No answer for recipe ${index}`);
      return {
        description: (found.description ?? '').trim(),
        extras: (found.extras ?? []).map((e) => e.trim()).filter(Boolean),
        tip: (found.tip ?? '').trim(),
      };
    });
  }
}
