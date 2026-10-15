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

  /** Cloud Function that reads title/author/thumbnail of a YouTube or TikTok link (oEmbed). */
  importFunctionUrl:
    'https://us-central1-a-pinch-of-everything-e7101.cloudfunctions.net/getRecipeMetadata',

  /** The moderator account: sees reports and the feedback inbox. */
  adminUid: '6uZpc802wDVjgA0SAjEdtZCCJem2',
} as const;
