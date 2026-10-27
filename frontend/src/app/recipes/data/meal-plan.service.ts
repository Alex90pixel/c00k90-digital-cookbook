import { Injectable, effect, inject, signal, untracked } from '@angular/core';
import { deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { AuthService } from '../../core/auth/auth.service';
import { FIRESTORE } from '../../core/firebase/firestore.token';
import { parsePlan, prunePlan } from '../domain/meal-plan';
import { MealPlanDocument } from '../models/meal-plan.model';

const MEAL_PLANS = 'mealPlans';

/**
 * The user's meal plan: which recipes they want to cook on which day. Stored privately in
 * Firestore at `mealPlans/{userId}`, like favorites (the security rules must enforce that).
 */
@Injectable({ providedIn: 'root' })
export class MealPlanService {
  private readonly db = inject(FIRESTORE);
  private readonly auth = inject(AuthService);

  private readonly state = signal<Record<string, string[]>>({});

  /** Recipe ids by local date ("2026-10-27"). */
  readonly days = this.state.asReadonly();

  constructor() {
    effect(() => {
      const user = this.auth.user();
      untracked(() => {
        if (user) void this.load(user.uid);
        else this.state.set({});
      });
    });
  }

  recipesOn(date: string): string[] {
    return this.state()[date] ?? [];
  }

  async add(date: string, recipeId: string): Promise<void> {
    await this.save({ ...this.state(), [date]: [...this.recipesOn(date), recipeId] });
  }

  /** Removes one planned recipe (by its position, as a recipe can be planned twice a day). */
  async remove(date: string, index: number): Promise<void> {
    await this.save({
      ...this.state(),
      [date]: this.recipesOn(date).filter((_, i) => i !== index),
    });
  }

  /** Used when deleting the account. */
  delete(userId: string): Promise<void> {
    return deleteDoc(doc(this.db, MEAL_PLANS, userId));
  }

  private async save(days: Record<string, string[]>): Promise<void> {
    const userId = this.auth.requireUser().uid;
    const document: MealPlanDocument = { days: prunePlan(days, new Date()), updatedAt: Date.now() };
    await setDoc(doc(this.db, MEAL_PLANS, userId), document);
    this.state.set(document.days);
  }

  private async load(userId: string): Promise<void> {
    try {
      const snapshot = await getDoc(doc(this.db, MEAL_PLANS, userId));
      this.state.set(parsePlan(snapshot.data()?.['days']));
    } catch (error) {
      console.error('Could not load the meal plan', error);
      this.state.set({});
    }
  }
}
