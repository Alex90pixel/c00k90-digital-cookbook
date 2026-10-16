import { Injectable, inject, signal } from '@angular/core';
import {
  collection,
  deleteDoc,
  doc,
  documentId,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import { FIRESTORE } from '../core/firebase/firestore.token';
import { ChefDocument, ChefProfile } from './chef.model';

const CHEFS = 'chefs';
/** Firestore allows at most 30 values in an `in` query. */
const IN_QUERY_LIMIT = 30;

/**
 * Public chef profiles (`chefs/{userId}`), cached for the session. Lookups made in the same
 * moment (e.g. by every card of a grid) are batched into as few queries as possible.
 */
@Injectable({ providedIn: 'root' })
export class ChefService {
  private readonly db = inject(FIRESTORE);

  /** `null` means "no public profile" (never shared, or stopped sharing). */
  private readonly cache = signal<ReadonlyMap<string, ChefProfile | null>>(new Map());
  private readonly queued = new Set<string>();
  private readonly loading = new Set<string>();

  /** The profile if it's loaded, `null` if the chef has none, `undefined` while unknown. */
  chef(id: string): ChefProfile | null | undefined {
    return this.cache().get(id);
  }

  /** Asks for profiles; they appear in `chef()` when loaded. Safe to call often. */
  request(ids: readonly string[]): void {
    const wanted = ids.filter((id) => id && !this.cache().has(id) && !this.loading.has(id));
    if (!wanted.length) return;
    const flushNow = this.queued.size === 0;
    wanted.forEach((id) => this.queued.add(id));
    if (flushNow) queueMicrotask(() => void this.flush());
  }

  /** Creates or updates the signed-in user's public profile. */
  async publish(userId: string, profile: Omit<ChefDocument, 'updatedAt'>): Promise<void> {
    const document: ChefDocument = { ...profile, updatedAt: Date.now() };
    await setDoc(doc(this.db, CHEFS, userId), document);
    this.remember(userId, { id: userId, ...profile });
  }

  async isPublished(userId: string): Promise<boolean> {
    return (await getDoc(doc(this.db, CHEFS, userId))).exists();
  }

  /** Removes the public profile (stopped sharing, or account deleted). */
  async unpublish(userId: string): Promise<void> {
    await deleteDoc(doc(this.db, CHEFS, userId));
    this.remember(userId, null);
  }

  private async flush(): Promise<void> {
    const ids = [...this.queued];
    this.queued.clear();
    ids.forEach((id) => this.loading.add(id));
    try {
      for (let i = 0; i < ids.length; i += IN_QUERY_LIMIT) {
        const chunk = ids.slice(i, i + IN_QUERY_LIMIT);
        const snapshot = await getDocs(
          query(collection(this.db, CHEFS), where(documentId(), 'in', chunk)),
        );
        const found = new Map(
          snapshot.docs.map((d) => [d.id, toProfile(d.id, d.data() as Partial<ChefDocument>)]),
        );
        this.cache.update((cache) => {
          const next = new Map(cache);
          chunk.forEach((id) => next.set(id, found.get(id) ?? null));
          return next;
        });
      }
    } catch (error) {
      // Unknown chefs are shown as "a C00K90 cook"; a later request may retry.
      console.error('Could not load chef profiles', error);
    } finally {
      ids.forEach((id) => this.loading.delete(id));
    }
  }

  private remember(id: string, profile: ChefProfile | null): void {
    this.cache.update((cache) => new Map(cache).set(id, profile));
  }
}

function toProfile(id: string, data: Partial<ChefDocument>): ChefProfile {
  const text = (value: unknown) => (typeof value === 'string' ? value : '');
  return {
    id,
    displayName: text(data.displayName),
    photoUrl: text(data.photoUrl),
    facebook: text(data.facebook),
    instagram: text(data.instagram),
    tiktok: text(data.tiktok),
    youtube: text(data.youtube),
  };
}
