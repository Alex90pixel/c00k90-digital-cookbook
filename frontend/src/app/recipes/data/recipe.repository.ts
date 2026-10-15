import { Injectable, inject } from '@angular/core';
import {
  QueryConstraint,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { FIRESTORE } from '../../core/firebase/firestore.token';
import { Recipe, RecipeData } from '../models/recipe.model';

const RECIPES = 'recipes';

/** Reads and writes documents in the Firestore `recipes` collection. */
@Injectable({ providedIn: 'root' })
export class RecipeRepository {
  private readonly db = inject(FIRESTORE);

  /** All recipes of one user, newest first. */
  listByOwner(userId: string): Promise<Recipe[]> {
    return this.list(where('userId', '==', userId));
  }

  /** All recipes shared to "Get Inspired", newest first. */
  listShared(): Promise<Recipe[]> {
    return this.list(where('shared', '==', true));
  }

  async create(data: RecipeData): Promise<string> {
    const ref = await addDoc(collection(this.db, RECIPES), data);
    return ref.id;
  }

  update(id: string, changes: Partial<RecipeData>): Promise<void> {
    return updateDoc(doc(this.db, RECIPES, id), changes);
  }

  delete(id: string): Promise<void> {
    return deleteDoc(doc(this.db, RECIPES, id));
  }

  /** Deletes every recipe of a user (used when deleting the account). */
  async deleteAllByOwner(userId: string): Promise<void> {
    const snapshot = await getDocs(
      query(collection(this.db, RECIPES), where('userId', '==', userId)),
    );
    const batch = writeBatch(this.db);
    snapshot.docs.forEach((document) => batch.delete(document.ref));
    await batch.commit();
  }

  private async list(constraint: QueryConstraint): Promise<Recipe[]> {
    const snapshot = await getDocs(query(collection(this.db, RECIPES), constraint));
    return snapshot.docs
      .map((document) => ({ ...(document.data() as RecipeData), id: document.id }))
      .sort(newestFirst);
  }
}

export function newestFirst(a: Pick<Recipe, 'createdAt'>, b: Pick<Recipe, 'createdAt'>): number {
  return (b.createdAt || 0) - (a.createdAt || 0);
}
