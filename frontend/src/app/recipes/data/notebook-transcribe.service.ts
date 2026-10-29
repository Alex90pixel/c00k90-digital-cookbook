import { Injectable, isDevMode } from '@angular/core';
import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import { environment } from '../../../environments/environment';
import { ImageRegion } from '../../core/images/models/image-region.model';
import { TranscribedRecipe, TranscriptionAnswer } from '../models/transcription.model';

const PROMPT = `This is a photo of a handwritten or printed recipe, often from an old notebook.
Transcribe it faithfully, in the same language it is written in. Do not translate and do not invent anything.
Return the recipe title (empty string if there is none), the ingredients (one per item, with quantity and unit as written)
and the preparation steps (one per item, in order). If a word is unreadable, write your best guess followed by "(?)".
Always answer hasDishPhoto: true if the page shows a photo of the finished dish (a plate, bowl, pan or tray with the cooked
food), which is common in magazines, cookbooks and Pinterest-style recipe cards, even when raw ingredients, cloths, cutlery or
text are around it; false only for handwriting, drawings, raw ingredients or text without such a photo.
When hasDishPhoto is true, return dishPhotoBox: the bounding box of that photo as [ymin, xmin, ymax, xmax], normalized to
0-1000, boxing the whole photo area with the dish in it (the largest such photo if there are several). When false, return [].
If the page shows where it comes from (magazine or book title, issue, website), return it as source; otherwise leave source out.
If the page states the number of servings ("Serves 4", "4 portii"), the preparation time or the cooking time, return them as
servings, prepMinutes and cookMinutes (whole numbers, times in minutes). Leave out any that are not written on the page.`;

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
            source: Schema.string(),
            servings: Schema.integer(),
            prepMinutes: Schema.integer(),
            cookMinutes: Schema.integer(),
            hasDishPhoto: Schema.boolean(),
            dishPhotoBox: Schema.array({ items: Schema.number() }),
          },
          optionalProperties: ['source', 'servings', 'prepMinutes', 'cookMinutes'],
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
    // While developing, shows what the model found, to check the dish photo crop.
    if (isDevMode()) {
      console.info('Transcription: dish photo', parsed.hasDishPhoto, parsed.dishPhotoBox ?? 'none');
    }
    return {
      name: (parsed.name ?? '').trim(),
      ingredients: (parsed.ingredients ?? []).map(normalizeIngredientLine).filter(Boolean),
      steps: (parsed.steps ?? []).map((line) => line.trim()).filter(Boolean),
      source: (parsed.source ?? '').trim(),
      servings: wholeNumber(parsed.servings, 1),
      prepTime: wholeNumber(parsed.prepMinutes, 0),
      cookTime: wholeNumber(parsed.cookMinutes, 0),
      dishPhoto: parsed.hasDishPhoto ? toRegion(parsed.dishPhotoBox) : undefined,
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

const UNICODE_FRACTIONS: Record<string, string> = {
  '½': '1/2',
  '⅓': '1/3',
  '⅔': '2/3',
  '¼': '1/4',
  '¾': '3/4',
  '⅕': '1/5',
  '⅙': '1/6',
  '⅛': '1/8',
  '⅜': '3/8',
  '⅝': '5/8',
  '⅞': '7/8',
};

/** Long unit names written on printed pages, shortened to the units the app recognizes. */
const UNIT_ALIASES: Record<string, string> = {
  tablespoon: 'tbsp',
  tablespoons: 'tbsp',
  teaspoon: 'tsp',
  teaspoons: 'tsp',
  gram: 'g',
  grams: 'g',
  kilogram: 'kg',
  kilograms: 'kg',
  ounce: 'oz',
  ounces: 'oz',
  pound: 'lb',
  pounds: 'lb',
};

/**
 * Makes a printed ingredient line easy for the app to read: "¼ cup onion" → "1/4 cup onion",
 * "1½ cups rice" or "1 1/2 cups rice" → "1.5 cups rice", "2 tablespoons honey" → "2 tbsp honey".
 */
export function normalizeIngredientLine(line: string): string {
  let text = line.trim();
  for (const [symbol, fraction] of Object.entries(UNICODE_FRACTIONS)) {
    text = text.replace(new RegExp(`(\\d)?\\s*${symbol}`, 'g'), (_, whole) =>
      whole ? `${whole} ${fraction}` : fraction,
    );
  }
  // A whole number plus a fraction ("1 1/2") becomes a decimal, which the ingredient parser reads.
  text = text.replace(/^(\d+)\s+(\d+)\/(\d+)/, (match, whole, num, den) =>
    Number(den)
      ? String(Math.round((Number(whole) + Number(num) / Number(den)) * 100) / 100)
      : match,
  );
  return text.replace(/^([\d./]+)\s+([a-zA-Z]+)\b/, (match, qty, unit) => {
    const short = UNIT_ALIASES[unit.toLowerCase()];
    return short ? `${qty} ${short}` : match;
  });
}

/** A sensible whole number read from the page, or undefined (missing, odd or out of range). */
export function wholeNumber(value: number | undefined, min: number): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value)) return undefined;
  const rounded = Math.round(value);
  return rounded >= min && rounded <= 1000 ? rounded : undefined;
}

/** Turns Gemini's 0–1000 box into fractions; ignores boxes that are missing, odd or tiny. */
export function toRegion(box: number[] | undefined): ImageRegion | undefined {
  if (!box || box.length !== 4 || box.some((n) => !Number.isFinite(n))) return undefined;
  // Asked for 0-1000, but the model sometimes answers in fractions (0-1).
  const scale = box.every((n) => n <= 1) ? 1 : 1000;
  const clamp = (n: number) => Math.min(1, Math.max(0, n / scale));
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
