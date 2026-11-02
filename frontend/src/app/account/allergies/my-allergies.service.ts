import { Injectable, effect, inject, signal, untracked } from '@angular/core';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { AuthService } from '../../core/auth/auth.service';
import { FIRESTORE } from '../../core/firebase/firestore.token';
import { ALLERGEN_IDS } from '../../recipes/models/recipe.constants';
import { AllergenId } from '../../recipes/models/recipe.model';

/**
 * The allergens the user wants to avoid. Saved privately in the user's `profiles/{userId}`
 * document (field `allergies`), and used to warn on recipes that contain them.
 */
@Injectable({ providedIn: 'root' })
export class MyAllergiesService {
  private readonly db = inject(FIRESTORE);
  private readonly auth = inject(AuthService);

  private readonly list = signal<readonly AllergenId[]>([]);
  readonly allergies = this.list.asReadonly();

  constructor() {
    effect(() => {
      const user = this.auth.user();
      untracked(() => {
        this.list.set([]);
        if (user) void this.load(user.uid);
      });
    });
  }

  /** The user's allergens that this recipe declares. */
  foundIn(allergens: readonly string[] | undefined): AllergenId[] {
    return this.list().filter((id) => allergens?.includes(id));
  }

  async save(allergies: readonly AllergenId[]): Promise<void> {
    const user = this.auth.requireUser();
    const clean = ALLERGEN_IDS.filter((id) => allergies.includes(id));
    await setDoc(doc(this.db, 'profiles', user.uid), { allergies: clean }, { merge: true });
    this.list.set(clean);
  }

  private async load(userId: string): Promise<void> {
    try {
      const snapshot = await getDoc(doc(this.db, 'profiles', userId));
      const saved = snapshot.data()?.['allergies'];
      if (Array.isArray(saved)) this.list.set(ALLERGEN_IDS.filter((id) => saved.includes(id)));
    } catch (error) {
      console.error('Could not load my allergies', error);
    }
  }
}
