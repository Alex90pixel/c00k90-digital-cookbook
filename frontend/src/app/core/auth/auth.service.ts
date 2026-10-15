import { Injectable, computed, inject, signal } from '@angular/core';
import {
  GoogleAuthProvider,
  User,
  deleteUser,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { environment } from '../../../environments/environment';
import { FIREBASE_AUTH } from '../firebase/firebase-auth.token';

/** The signed-in user, as Firebase Authentication reports it. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly auth = inject(FIREBASE_AUTH);
  /** `undefined` until Firebase has restored the session on page load. */
  private readonly state = signal<User | null | undefined>(undefined);

  readonly user = computed(() => this.state() ?? null);
  readonly isSignedIn = computed(() => !!this.state());
  readonly isAdmin = computed(() => this.user()?.uid === environment.adminUid);
  /** Profile photo, or a round badge with the first letter of the name. */
  readonly avatarUrl = computed(() => {
    const user = this.user();
    if (!user) return null;
    return user.photoURL || letterAvatar(user.displayName || (user.email ?? '?').split('@')[0]);
  });

  constructor() {
    onAuthStateChanged(this.auth, (user) => this.state.set(user));
  }

  /** Resolves once the session is restored, with the signed-in user or `null`. */
  async whenReady(): Promise<User | null> {
    await this.auth.authStateReady();
    return this.auth.currentUser;
  }

  /** The signed-in user; only call this from places that require sign-in. */
  requireUser(): User {
    const user = this.auth.currentUser;
    if (!user) throw new Error('Not signed in');
    return user;
  }

  async signInWithGoogle(): Promise<void> {
    await signInWithPopup(this.auth, new GoogleAuthProvider());
  }

  signOut(): Promise<void> {
    return signOut(this.auth);
  }

  /** Deletes the Firebase account. Fails with `auth/requires-recent-login` on old sessions. */
  deleteAccount(): Promise<void> {
    return deleteUser(this.requireUser());
  }
}

function letterAvatar(name: string): string {
  const letter = name
    .charAt(0)
    .toUpperCase()
    .replace(/[<>&"']/g, '');
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" rx="32" fill="#2E8F72"/>` +
    `<text x="32" y="41" font-family="sans-serif" font-size="28" font-weight="700" fill="#fff" text-anchor="middle">${letter}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
