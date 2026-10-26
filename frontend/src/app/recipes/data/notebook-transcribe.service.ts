import { Injectable } from '@angular/core';
import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import { environment } from '../../../environments/environment';
import { ImageRegion } from '../../core/images/image-processing';

/** What the AI read from a photo of a handwritten recipe. */
export interface TranscribedRecipe {
  name: string;
  /** One ingredient per line, e.g. "200 g faina". */
  ingredients: string[];
  /** One step per line. */
  steps: string[];
  /** Where the photo of the finished dish is on the page, if there is one. */
  dishPhoto?: ImageRegion;
}

/** The raw JSON answer; `dishPhotoBox` is [ymin, xmin, ymax, xmax] on a 0–1000 scale. */
interface TranscriptionAnswer {
  name?: string;
  ingredients?: string[];
  steps?: string[];
  dishPhotoBox?: number[];
}

const PROMPT = `This is a photo of a handwritten or printed recipe, often from an old notebook.
Transcribe it faithfully, in the same language it is written in. Do not translate and do not invent anything.
Return the recipe title (empty string if there is none), the ingredients (one per item, with quantity and unit as written)
and the preparation steps (one per item, in order). If a word is unreadable, write your best guess followed by "(?)".
If the page also shows a photo of the finished dish, return its bounding box as dishPhotoBox: [ymin, xmin, ymax, xmax],
normalized to 0-1000. Leave dishPhotoBox out if there is no such photo (handwriting, drawings or text only).`;

/** Name of the second Firebase app, connected to the free `c00k90-ai` project. */
const AI_APP_NAME = 'ai';

/**
 * Reads a recipe from a photo (e.g. a page from a recipe notebook) with Gemini, through
 * Firebase AI Logic on a separate free project, protected by App Check (reCAPTCHA Enterprise).
 * The photo is only sent for the transcription; it is not stored.
 */
@Injectable({ providedIn: 'root' })
export class NotebookTranscribeService {
  private aiApp?: Promise<FirebaseApp>;

  async transcribe(photo: Blob): Promise<TranscribedRecipe> {
    // Loaded only when someone uses this feature, so the app stays light.
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
            name: Schema.string(),
            ingredients: Schema.array({ items: Schema.string() }),
            steps: Schema.array({ items: Schema.string() }),
            dishPhotoBox: Schema.array({ items: Schema.number() }),
          },
          optionalProperties: ['dishPhotoBox'],
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
    const parsed = JSON.parse(result.response.text()) as TranscriptionAnswer;
    return {
      name: (parsed.name ?? '').trim(),
      ingredients: (parsed.ingredients ?? []).map((line) => line.trim()).filter(Boolean),
      steps: (parsed.steps ?? []).map((line) => line.trim()).filter(Boolean),
      dishPhoto: toRegion(parsed.dishPhotoBox),
    };
  }
}

/** Starts the second Firebase app and its App Check once. */
async function connectAiApp(): Promise<FirebaseApp> {
  if (getApps().some((a) => a.name === AI_APP_NAME)) return getApp(AI_APP_NAME);
  const app = initializeApp(environment.aiFirebase, AI_APP_NAME);
  const { initializeAppCheck, ReCaptchaEnterpriseProvider } = await import('firebase/app-check');
  // On localhost, App Check prints a debug token in the console; register it once in
  // Firebase (App Check → Apps → Manage debug tokens) so local testing works.
  if (location.hostname === 'localhost') {
    const debug = self as unknown as { FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean };
    debug.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }
  initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider(environment.aiRecaptchaSiteKey),
    isTokenAutoRefreshEnabled: true,
  });
  return app;
}

/** Turns Gemini's 0–1000 box into fractions; ignores boxes that are missing, odd or tiny. */
export function toRegion(box: number[] | undefined): ImageRegion | undefined {
  if (!box || box.length !== 4 || box.some((n) => !Number.isFinite(n))) return undefined;
  const clamp = (n: number) => Math.min(1, Math.max(0, n / 1000));
  const [top, left, bottom, right] = box.map(clamp);
  // A real dish photo covers a fair part of the page; skip slivers and icons.
  if (right - left < 0.1 || bottom - top < 0.1) return undefined;
  return { left, top, right, bottom };
}

function toBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
