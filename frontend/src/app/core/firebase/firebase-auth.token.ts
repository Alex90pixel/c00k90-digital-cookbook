import { InjectionToken, inject } from '@angular/core';
import { Auth, getAuth } from 'firebase/auth';
import { FIREBASE_APP } from './firebase.providers';

export const FIREBASE_AUTH = new InjectionToken<Auth>('FIREBASE_AUTH', {
  providedIn: 'root',
  factory: () => getAuth(inject(FIREBASE_APP)),
});
