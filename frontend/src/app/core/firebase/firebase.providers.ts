import { EnvironmentProviders, InjectionToken, makeEnvironmentProviders } from '@angular/core';
import { FirebaseApp, FirebaseOptions, initializeApp } from 'firebase/app';

export const FIREBASE_APP = new InjectionToken<FirebaseApp>('FIREBASE_APP');

/**
 * Registers the Firebase app. The Auth, Firestore and Storage instances have their own tokens
 * (next to this file), so each SDK is only downloaded by the pages that use it.
 */
export function provideFirebase(options: FirebaseOptions): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: FIREBASE_APP, useFactory: () => initializeApp(options) },
  ]);
}
