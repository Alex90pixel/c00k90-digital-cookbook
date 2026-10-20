import { Injectable, inject } from '@angular/core';
import { FIREBASE_APP } from '../../core/firebase/firebase.providers';

/** What the AI read from a photo of a handwritten recipe. */
export interface TranscribedRecipe {
  name: string;
  /** One ingredient per line, e.g. "200 g faina". */
  ingredients: string[];
  /** One step per line. */
  steps: string[];
}

const PROMPT = `This is a photo of a handwritten or printed recipe, often from an old notebook.
Transcribe it faithfully, in the same language it is written in. Do not translate and do not invent anything.
Return the recipe title (empty string if there is none), the ingredients (one per item, with quantity and unit as written)
and the preparation steps (one per item, in order). If a word is unreadable, write your best guess followed by "(?)".`;

/**
 * Reads a recipe from a photo (e.g. a page from a recipe notebook) with Gemini, through
 * Firebase AI Logic. The photo is only sent for the transcription; it is not stored.
 */
@Injectable({ providedIn: 'root' })
export class NotebookTranscribeService {
  private readonly app = inject(FIREBASE_APP);

  async transcribe(photo: Blob): Promise<TranscribedRecipe> {
    // Loaded only when someone uses this feature, so the app stays light.
    const { getAI, getGenerativeModel, GoogleAIBackend, Schema } = await import('firebase/ai');

    const model = getGenerativeModel(getAI(this.app, { backend: new GoogleAIBackend() }), {
       model: 'gemini-3.8-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: Schema.object({
          properties: {
            name: Schema.string(),
            ingredients: Schema.array({ items: Schema.string() }),
            steps: Schema.array({ items: Schema.string() }),
          },
        }),
      },
    });

    const result = await model.generateContent([
      PROMPT,
      {
        type: 'inlineData',
        inlineData: { mimeType: photo.type || 'image/jpeg', data: await toBase64(photo) },
      },
    ]);
    const parsed = JSON.parse(result.response.text()) as Partial<TranscribedRecipe>;
    return {
      name: (parsed.name ?? '').trim(),
      ingredients: (parsed.ingredients ?? []).map((line) => line.trim()).filter(Boolean),
      steps: (parsed.steps ?? []).map((line) => line.trim()).filter(Boolean),
    };
  }
}

function toBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
