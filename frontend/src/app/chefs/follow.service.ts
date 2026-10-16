import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { arrayRemove, arrayUnion, deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { AuthService } from '../core/auth/auth.service';
import { FIRESTORE } from '../core/firebase/firestore.token';
import { FollowsDocument } from './chef.model';

const FOLLOWS = 'follows';

/** The chefs the signed-in user follows (`follows/{userId}`, private to that user). */
@Injectable({ providedIn: 'root' })
export class FollowService {
  private readonly db = inject(FIRESTORE);
  private readonly auth = inject(AuthService);

  private readonly ids = signal<string[]>([]);

  readonly followed = this.ids.asReadonly();
  private readonly followedSet = computed(() => new Set(this.ids()));

  constructor() {
    effect(() => {
      const user = this.auth.user();
      untracked(() => {
        if (user) void this.load(user.uid);
        else this.ids.set([]);
      });
    });
  }

  isFollowing(chefId: string): boolean {
    return this.followedSet().has(chefId);
  }

  async follow(chefId: string): Promise<void> {
    const userId = this.auth.requireUser().uid;
    if (chefId === userId || this.isFollowing(chefId)) return;
    await setDoc(
      doc(this.db, FOLLOWS, userId),
      { chefIds: arrayUnion(chefId), updatedAt: Date.now() },
      { merge: true },
    );
    this.ids.update((ids) => [...ids, chefId]);
  }

  async unfollow(chefId: string): Promise<void> {
    const userId = this.auth.requireUser().uid;
    await setDoc(
      doc(this.db, FOLLOWS, userId),
      { chefIds: arrayRemove(chefId), updatedAt: Date.now() },
      { merge: true },
    );
    this.ids.update((ids) => ids.filter((id) => id !== chefId));
  }

  /** Used when deleting the account. */
  delete(userId: string): Promise<void> {
    return deleteDoc(doc(this.db, FOLLOWS, userId));
  }

  private async load(userId: string): Promise<void> {
    try {
      const snapshot = await getDoc(doc(this.db, FOLLOWS, userId));
      const data = snapshot.data() as Partial<FollowsDocument> | undefined;
      this.ids.set(Array.isArray(data?.chefIds) ? data.chefIds : []);
    } catch (error) {
      console.error('Could not load followed chefs', error);
      this.ids.set([]);
    }
  }
}
