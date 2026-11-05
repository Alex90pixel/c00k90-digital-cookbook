import { Injectable, effect, inject, untracked } from '@angular/core';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { AuthService } from '../../core/auth/auth.service';
import { FIRESTORE } from '../../core/firebase/firestore.token';
import { I18nService } from '../../core/i18n/i18n.service';
import { EXAMPLE_PHOTO_URL, exampleRecipe } from '../domain/example-recipe';
import { RecipeStore } from './recipe.store';

/**
 * Every new cookbook starts with one example recipe, so the first visit already shows what a
 * recipe looks like. It is added once per account (field `exampleAdded` in the private
 * `profiles/{userId}` document): deleting it doesn't bring it back, and cooks who already have
 * recipes never get it.
 */
@Injectable({ providedIn: 'root' })
export class ExampleRecipeService {
  private readonly store = inject(RecipeStore);
  private readonly auth = inject(AuthService);
  private readonly db = inject(FIRESTORE);
  private readonly i18n = inject(I18nService);
  private checkedFor: string | null = null;

  constructor() {
    effect(() => {
      const user = this.auth.user();
      if (!user || !this.store.mineLoaded() || this.checkedFor === user.uid) return;
      this.checkedFor = user.uid;
      untracked(() => void this.addOnce(user.uid));
    });
  }

  private async addOnce(userId: string): Promise<void> {
    const profile = doc(this.db, 'profiles', userId);
    try {
      if ((await getDoc(profile)).data()?.['exampleAdded']) return;
      if (!this.store.myRecipes().length) {
        await this.store.addExample(
          exampleRecipe(this.i18n.language(), this.i18n.t('list.exampleSource')),
          await loadPhoto(),
        );
      }
      await setDoc(profile, { exampleAdded: true }, { merge: true });
    } catch (error) {
      // Not worth bothering the cook: it is tried again on the next visit.
      console.error('Could not add the example recipe', error);
    }
  }
}

async function loadPhoto(): Promise<Blob | null> {
  try {
    const response = await fetch(EXAMPLE_PHOTO_URL);
    return response.ok ? await response.blob() : null;
  } catch {
    return null;
  }
}
