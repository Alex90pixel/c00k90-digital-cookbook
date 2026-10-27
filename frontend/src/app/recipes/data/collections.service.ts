import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { AuthService } from '../../core/auth/auth.service';
import { FIRESTORE } from '../../core/firebase/firestore.token';
import {
  cleanCollectionName,
  parseCollections,
  sortCollections,
  toggleRecipe,
} from '../domain/collections';
import { CollectionsDocument, RecipeCollection } from '../models/collection.model';

const COLLECTIONS = 'collections';

/**
 * The user's own recipe collections ("Christmas", "Quick dinners"), stored privately in Firestore
 * at `collections/{userId}`, like favorites. A collection can hold the user's own recipes and
 * other cooks' shared recipes. Only the user can read or change it (the security rules must
 * enforce that).
 */
@Injectable({ providedIn: 'root' })
export class CollectionsService {
  private readonly db = inject(FIRESTORE);
  private readonly auth = inject(AuthService);

  private readonly state = signal<RecipeCollection[]>([]);

  /** The collections, A to Z. */
  readonly lists = computed(() => sortCollections(this.state()));

  constructor() {
    effect(() => {
      const user = this.auth.user();
      untracked(() => {
        if (user) void this.load(user.uid);
        else this.state.set([]);
      });
    });
  }

  find(id: string): RecipeCollection | undefined {
    return this.state().find((list) => list.id === id);
  }

  /** The ids of the collections that hold this recipe. */
  collectionsOf(recipeId: string): Set<string> {
    return new Set(
      this.state()
        .filter((l) => l.recipeIds.includes(recipeId))
        .map((l) => l.id),
    );
  }

  /** Creates an empty collection and returns it (or `null` for an empty name). */
  async create(name: string): Promise<RecipeCollection | null> {
    const clean = cleanCollectionName(name);
    if (!clean) return null;
    const list: RecipeCollection = { id: crypto.randomUUID(), name: clean, recipeIds: [] };
    await this.save([...this.state(), list]);
    return list;
  }

  async rename(id: string, name: string): Promise<void> {
    const clean = cleanCollectionName(name);
    if (!clean) return;
    await this.save(this.state().map((list) => (list.id === id ? { ...list, name: clean } : list)));
  }

  /** Deletes the collection only; its recipes stay in the cookbook. */
  async remove(id: string): Promise<void> {
    await this.save(this.state().filter((list) => list.id !== id));
  }

  /** Adds the recipe to the collection, or takes it out if it is already there. */
  async toggle(id: string, recipeId: string): Promise<void> {
    await this.save(
      this.state().map((list) => (list.id === id ? toggleRecipe(list, recipeId) : list)),
    );
  }

  /** Used when deleting the account. */
  delete(userId: string): Promise<void> {
    return deleteDoc(doc(this.db, COLLECTIONS, userId));
  }

  private async save(lists: RecipeCollection[]): Promise<void> {
    const userId = this.auth.requireUser().uid;
    const document: CollectionsDocument = { lists, updatedAt: Date.now() };
    await setDoc(doc(this.db, COLLECTIONS, userId), document);
    this.state.set(lists);
  }

  private async load(userId: string): Promise<void> {
    try {
      const snapshot = await getDoc(doc(this.db, COLLECTIONS, userId));
      this.state.set(parseCollections(snapshot.data()?.['lists']));
    } catch (error) {
      console.error('Could not load collections', error);
      this.state.set([]);
    }
  }
}
