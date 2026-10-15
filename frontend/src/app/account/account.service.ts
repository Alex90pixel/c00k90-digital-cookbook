import { DOCUMENT, Injectable, inject } from '@angular/core';
import { AuthService } from '../core/auth/auth.service';
import { RecipePhotoService } from '../recipes/data/recipe-photo.service';
import { RecipeRepository } from '../recipes/data/recipe.repository';

const EXPORT_FILE_NAME = 'c00k90-my-data.json';

/** The user's rights over their data: download a copy, or delete everything. */
@Injectable({ providedIn: 'root' })
export class AccountService {
  private readonly auth = inject(AuthService);
  private readonly repository = inject(RecipeRepository);
  private readonly photos = inject(RecipePhotoService);
  private readonly document = inject(DOCUMENT);

  /** Downloads all of the user's recipes as a JSON file. */
  async exportData(): Promise<void> {
    const user = this.auth.requireUser();
    const recipes = await this.repository.listByOwner(user.uid);
    const data = {
      exportedAt: new Date().toISOString(),
      user: { name: user.displayName, email: user.email },
      recipes,
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
    );
    const link = this.document.createElement('a');
    link.href = url;
    link.download = EXPORT_FILE_NAME;
    link.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Deletes the user's photos, recipes and account. Throws `auth/requires-recent-login` when the
   * session is too old; the user must sign in again and retry.
   */
  async deleteAccount(): Promise<void> {
    const userId = this.auth.requireUser().uid;
    try {
      await this.photos.deleteAllOf(userId);
    } catch (error) {
      // Missing photos must not block deleting the account.
      console.error('Could not delete photos', error);
    }
    await this.repository.deleteAllByOwner(userId);
    await this.auth.deleteAccount();
  }
}
