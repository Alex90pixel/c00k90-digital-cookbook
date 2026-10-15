import { InjectionToken, inject } from '@angular/core';
import { Firestore, getFirestore } from 'firebase/firestore';
import { FIREBASE_APP } from './firebase.providers';

export const FIRESTORE = new InjectionToken<Firestore>('FIRESTORE', {
  providedIn: 'root',
  factory: () => getFirestore(inject(FIREBASE_APP)),
});
