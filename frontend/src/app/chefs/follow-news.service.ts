import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { AuthService } from '../core/auth/auth.service';
import { FIRESTORE } from '../core/firebase/firestore.token';
import { safeLocalStorage } from '../core/storage/local-storage';
import { RecipeStore } from '../recipes/data/recipe.store';
import { FollowService } from './follow.service';

const LAST_SEEN_KEY = 'c00k90-chefs-last-seen';

/**
 * "What's new from the chefs I follow": the recipes they shared since my last visit to
 * Followed Chefs, for the count on the tab and the "New" labels on that page. The last visit is
 * saved privately in the user's `profiles/{userId}` document (field `chefsSeenAt`), so every
 * device agrees; this device's copy is only used until that has loaded.
 */
@Injectable({ providedIn: 'root' })
export class FollowNewsService {
  private readonly store = inject(RecipeStore);
  private readonly follows = inject(FollowService);
  private readonly auth = inject(AuthService);
  private readonly db = inject(FIRESTORE);

  /** Last visit to Followed Chefs (ms). The very first time it starts now, not with a big count. */
  private readonly lastSeen = signal(readLastSeen());
  /** What counted as "new" when the page was opened, so the labels stay during the visit. */
  readonly newSince = signal<number | null>(null);

  readonly newRecipes = computed(() => {
    const followed = new Set(this.follows.followed());
    const me = this.auth.user()?.uid;
    const since = this.lastSeen();
    return this.store
      .sharedRecipes()
      .filter((r) => followed.has(r.userId) && r.userId !== me && (r.createdAt ?? 0) > since);
  });
  readonly count = computed(() => this.newRecipes().length);

  constructor() {
    // The shared recipes are loaded once someone follows a chef, so the count can show.
    effect(() => {
      if (this.auth.user() && this.follows.followed().length) {
        untracked(() => this.store.ensureSharedLoaded());
      }
    });
    effect(() => {
      const user = this.auth.user();
      if (user) untracked(() => void this.loadLastSeen(user.uid));
    });
  }

  /** Opening Followed Chefs: keep the labels for this visit and clear the count. */
  markSeen(): void {
    this.newSince.set(this.lastSeen());
    const now = Date.now();
    safeLocalStorage.set(LAST_SEEN_KEY, String(now));
    this.lastSeen.set(now);
    const user = this.auth.user();
    if (user) {
      setDoc(doc(this.db, 'profiles', user.uid), { chefsSeenAt: now }, { merge: true }).catch(
        (error) => console.error('Could not save the last visit to Followed Chefs', error),
      );
    }
  }

  /** The account's last visit wins when it is more recent than this device's. */
  private async loadLastSeen(userId: string): Promise<void> {
    try {
      const snapshot = await getDoc(doc(this.db, 'profiles', userId));
      const saved = Number(snapshot.data()?.['chefsSeenAt']);
      if (saved > this.lastSeen()) {
        this.lastSeen.set(saved);
        safeLocalStorage.set(LAST_SEEN_KEY, String(saved));
      }
    } catch (error) {
      console.error('Could not load the last visit to Followed Chefs', error);
    }
  }

  isNew(createdAt: number | undefined): boolean {
    const since = this.newSince();
    return since !== null && (createdAt ?? 0) > since;
  }
}

function readLastSeen(): number {
  const saved = Number(safeLocalStorage.get(LAST_SEEN_KEY));
  if (saved > 0) return saved;
  const now = Date.now();
  safeLocalStorage.set(LAST_SEEN_KEY, String(now));
  return now;
}
