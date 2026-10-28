import { aiFirebase, aiRecaptchaSiteKey, firebase } from './firebase.config';

/**
 * App-wide configuration. The Firebase values come from firebase.config.ts, which
 * scripts/write-firebase-config.mjs generates from environment variables (GitHub secrets in CI).
 * They still end up in the public bundle: access is controlled by the Firestore / Storage
 * security rules and App Check, not by keeping these values secret.
 */
export const environment = {
  firebase,

  /** Separate free project, used only for the AI notebook transcription (Gemini). */
  aiFirebase,
  /** reCAPTCHA Enterprise site key (public) for App Check on the AI project. */
  aiRecaptchaSiteKey,

  /** Cloud Function that reads title/author/thumbnail of a YouTube or TikTok link (oEmbed). */
  importFunctionUrl:
    'https://us-central1-a-pinch-of-everything-e7101.cloudfunctions.net/getRecipeMetadata',

    /**
   * The moderator accounts (Alexandra, Adrian): they see reports and the feedback inbox. Keep in
   * sync with isAdmin() in backend/firestore.rules.
   */
  adminUids: ['YNeChEaSuUYQMKxsuiJfA4CKp9J2', 'E5UJm2sOUSRBDaeB5fEb47wRyva2'] as readonly string[],
} as const;
