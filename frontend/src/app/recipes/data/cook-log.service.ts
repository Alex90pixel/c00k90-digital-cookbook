import { Injectable, effect, inject, signal, untracked } from '@angular/core';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { AuthService } from '../../core/auth/auth.service';
import { FIRESTORE } from '../../core/firebase/firestore.token';

/** How often and when the user last cooked a recipe. */
export interface CookEntry {
  count: number;
  /** Milliseconds since epoch. */
  last: number;
}

/**
 * Remembers which recipes the user cooked (finishing Cook mode), for the "Cooked recently" and
 * "Cooked most often" sorts. Saved privately in the user's `profiles/{userId}` document
 * (field `cooked`), so it also works for other cooks' recipes.
 */
@Injectable({ providedIn: 'root' })
export class CookLogService {
  private readonly db = inject(FIRESTORE);
  private readonly auth = inject(AuthService);

  private readonly log = signal<Readonly<Record<string, CookEntry>>>({});
  readonly entries = this.log.asReadonly();

  constructor() {
    effect(() => {
      const user = this.auth.user();
      untracked(() => {
        this.log.set({});
        if (user) void this.load(user.uid);
      });
    });
  }

  async record(recipeId: string): Promise<void> {
    const user = this.auth.user();
    if (!user) return;
    const previous = this.log()[recipeId];
    const entry: CookEntry = { count: (previous?.count ?? 0) + 1, last: Date.now() };
    this.log.update((log) => ({ ...log, [recipeId]: entry }));
    try {
      await setDoc(
        doc(this.db, 'profiles', user.uid),
        { cooked: { [recipeId]: entry } },
        { merge: true },
      );
    } catch (error) {
      console.error('Could not save the cook log', error);
    }
  }

  private async load(userId: string): Promise<void> {
    try {
      const snapshot = await getDoc(doc(this.db, 'profiles', userId));
      const saved = snapshot.data()?.['cooked'];
      if (saved && typeof saved === 'object') this.log.set(saved as Record<string, CookEntry>);
    } catch (error) {
      console.error('Could not load the cook log', error);
    }
  }
}
