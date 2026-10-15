import { InjectionToken, inject } from '@angular/core';
import { FirebaseStorage, getStorage } from 'firebase/storage';
import { FIREBASE_APP } from './firebase.providers';

export const FIREBASE_STORAGE = new InjectionToken<FirebaseStorage>('FIREBASE_STORAGE', {
  providedIn: 'root',
  factory: () => getStorage(inject(FIREBASE_APP)),
});
