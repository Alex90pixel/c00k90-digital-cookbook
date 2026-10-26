import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { arrayRemove, arrayUnion, deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { AuthService } from '../../core/auth/auth.service';
import { FIRESTORE } from '../../core/firebase/firestore.token';

const FAVORITES = 'favorites';

/** A document in the private Firestore `favorites` collection (document id = the user's id). */
interface FavoritesDocument {
  recipeIds: string[];
  updatedAt: number;
}

/**
 * Other cooks' shared recipes that the signed-in user saved as favorites (`favorites/{userId}`,
 * private to that user). The user's own recipes can't be favorites.
 *
 * Note: recipe documents from the first version of the app may still have a `favorite` flag on
 * the user's own recipes; it's no longer used.
 */
@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private readonly db = inject(FIRESTORE);
  private readonly auth = inject(AuthService);

  private readonly ids = signal<string[]>([]);

  readonly recipeIds = this.ids.asReadonly();
  private readonly idSet = computed(() => new Set(this.ids()));

  constructor() {
    effect(() => {
      const user = this.auth.user();
      untracked(() => {
        if (user) void this.load(user.uid);
        else this.ids.set([]);
      });
    });
  }

  isFavorite(recipeId: string): boolean {
    return this.idSet().has(recipeId);
  }

  async add(recipeId: string): Promise<void> {
    const userId = this.auth.requireUser().uid;
    if (this.isFavorite(recipeId)) return;
    await setDoc(
      doc(this.db, FAVORITES, userId),
      { recipeIds: arrayUnion(recipeId), updatedAt: Date.now() },
      { merge: true },
    );
    this.ids.update((ids) => [...ids, recipeId]);
  }

  async remove(recipeId: string): Promise<void> {
    const userId = this.auth.requireUser().uid;
    await setDoc(
      doc(this.db, FAVORITES, userId),
      { recipeIds: arrayRemove(recipeId), updatedAt: Date.now() },
      { merge: true },
    );
    this.ids.update((ids) => ids.filter((id) => id !== recipeId));
  }

  /** Used when deleting the account. */
  delete(userId: string): Promise<void> {
    return deleteDoc(doc(this.db, FAVORITES, userId));
  }

  private async load(userId: string): Promise<void> {
    try {
      const snapshot = await getDoc(doc(this.db, FAVORITES, userId));
      const data = snapshot.data() as Partial<FavoritesDocument> | undefined;
      this.ids.set(Array.isArray(data?.recipeIds) ? data.recipeIds : []);
    } catch (error) {
      console.error('Could not load favorites', error);
      this.ids.set([]);
    }
  }
}
