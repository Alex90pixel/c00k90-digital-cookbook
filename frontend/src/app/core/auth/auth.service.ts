import { Injectable, computed, inject, signal } from '@angular/core';
import {
  GoogleAuthProvider,
  User,
  deleteUser,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { environment } from '../../../environments/environment';
import { FIREBASE_AUTH } from '../firebase/firebase-auth.token';
import { letterAvatar } from '../images/letter-avatar';

/** The signed-in user, as Firebase Authentication reports it. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly auth = inject(FIREBASE_AUTH);
  /** `undefined` until Firebase has restored the session on page load. */
  private readonly state = signal<User | null | undefined>(undefined);
  /**
   * Name and photo, kept apart from `state`: updating the profile changes the same Firebase
   * `User` object, which a signal holding that object wouldn't notice.
   */
  private readonly appearance = signal<Appearance>({ name: null, photoUrl: null });

  readonly user = computed(() => this.state() ?? null);
  readonly displayName = computed(() => this.appearance().name);
  readonly isSignedIn = computed(() => !!this.state());
  readonly isAdmin = computed(() => this.user()?.uid === environment.adminUid);
  /** The avatar without a chosen photo: the Google photo, or the first letter of the name. */
  readonly defaultAvatarUrl = computed(() => {
    const user = this.user();
    if (!user) return null;
    return (
      googlePhotoUrl(user) ||
      letterAvatar(this.appearance().name || (user.email ?? '?').split('@')[0])
    );
  });
  /** The account photo, or the default avatar. */
  readonly avatarUrl = computed(() => this.appearance().photoUrl || this.defaultAvatarUrl());

  constructor() {
    onAuthStateChanged(this.auth, (user) => {
      this.state.set(user);
      this.appearance.set({ name: user?.displayName ?? null, photoUrl: user?.photoURL ?? null });
    });
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

  /**
   * Changes the name and/or photo on the Firebase account (used for the avatar).
   * A `null` photo goes back to the Google photo, if the account has one.
   */
  async updateAppearance(changes: {
    displayName?: string;
    photoUrl?: string | null;
  }): Promise<void> {
    const user = this.requireUser();
    const photoURL =
      changes.photoUrl === undefined ? undefined : changes.photoUrl || googlePhotoUrl(user);
    await updateProfile(user, { displayName: changes.displayName, photoURL });
    this.appearance.set({ name: user.displayName, photoUrl: user.photoURL });
  }

  /** Deletes the Firebase account. Fails with `auth/requires-recent-login` on old sessions. */
  deleteAccount(): Promise<void> {
    return deleteUser(this.requireUser());
  }
}

interface Appearance {
  name: string | null;
  photoUrl: string | null;
}

function googlePhotoUrl(user: User): string | null {
  return user.providerData.find((p) => p.providerId === 'google.com')?.photoURL ?? null;
}
