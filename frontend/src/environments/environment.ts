import { FirebaseOptions } from 'firebase/app';

/**
 * App-wide configuration. The Firebase web config is public by design: access is
 * controlled by the Firestore / Storage security rules, not by keeping these values secret.
 */
export const environment = {
  firebase: {
    apiKey: 'AIzaSyDwZE0QIzeq6hzgO6F3HSi1DLZzcYoapYg',
    authDomain: 'a-pinch-of-everything-e7101.firebaseapp.com',
    projectId: 'a-pinch-of-everything-e7101',
    storageBucket: 'a-pinch-of-everything-e7101.firebasestorage.app',
    messagingSenderId: '559214365284',
    appId: '1:559214365284:web:a793efbdaad3f30fbdad71',
  } satisfies FirebaseOptions,
  
     /** Separate free project, used only for the AI notebook transcription (Gemini). */
     aiFirebase: {
       apiKey: 'AIzaSyBZwJgMBT83ZKaMHpgB76gTEheMowAJgpQ',
       authDomain: 'c00k90-ai.firebaseapp.com',
       projectId: 'c00k90-ai',
       storageBucket: 'c00k90-ai.firebasestorage.app',
       messagingSenderId: '957155254460',
       appId: '1:957155254460:web:46b8b5b50548a0b55370b9',
     } satisfies FirebaseOptions,
          /** reCAPTCHA Enterprise site key (public) for App Check on the AI project. */
     aiRecaptchaSiteKey: '6LcUcgEuAAAAAEXTB6LAWRh_FTJeqapHXecvlqbq',

  /** Cloud Function that reads title/author/thumbnail of a YouTube or TikTok link (oEmbed). */
  importFunctionUrl:
    'https://us-central1-a-pinch-of-everything-e7101.cloudfunctions.net/getRecipeMetadata',

  /** The moderator account: sees reports and the feedback inbox. */
  adminUid: '6uZpc802wDVjgA0SAjEdtZCCJem2',
} as const;
