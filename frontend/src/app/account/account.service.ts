import { DOCUMENT, Injectable, inject } from '@angular/core';
import { ChefService } from '../chefs/chef.service';
import { FollowService } from '../chefs/follow.service';
import { AuthService } from '../core/auth/auth.service';
import { FavoritesService } from '../recipes/data/favorites.service';
import { RecipePhotoService } from '../recipes/data/recipe-photo.service';
import { RecipeRepository } from '../recipes/data/recipe.repository';
import { ProfileService } from './profile/profile.service';

const EXPORT_FILE_NAME = 'c00k90-my-data.json';

/** The user's rights over their data: download a copy, or delete everything. */
@Injectable({ providedIn: 'root' })
export class AccountService {
  private readonly auth = inject(AuthService);
  private readonly repository = inject(RecipeRepository);
  private readonly photos = inject(RecipePhotoService);
  private readonly profiles = inject(ProfileService);
  private readonly chefs = inject(ChefService);
  private readonly follows = inject(FollowService);
  private readonly favorites = inject(FavoritesService);
  private readonly document = inject(DOCUMENT);

  /** Downloads the user's profile, followed chefs, favorites and recipes as a JSON file. */
  async exportData(): Promise<void> {
    const user = this.auth.requireUser();
    const [recipes, profile] = await Promise.all([
      this.repository.listByOwner(user.uid),
      this.profiles.load().catch(() => null),
    ]);
    const data = {
      exportedAt: new Date().toISOString(),
      user: { name: user.displayName, email: user.email },
      profile,
      followedChefIds: this.follows.followed(),
      favoriteRecipeIds: this.favorites.recipeIds(),
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
   * Deletes the user's photos, profiles (private and public), followed chefs, favorites, recipes
   * and account.
   * Throws `auth/requires-recent-login` when the session is too old; the user must sign in again
   * and retry.
   */
  async deleteAccount(): Promise<void> {
    const userId = this.auth.requireUser().uid;
    try {
      await this.photos.deleteAllOf(userId);
    } catch (error) {
      // Missing photos must not block deleting the account.
      console.error('Could not delete photos', error);
    }
    await this.profiles.delete(userId);
    await this.chefs.unpublish(userId);
    await this.follows.delete(userId);
    await this.favorites.delete(userId);
    await this.repository.deleteAllByOwner(userId);
    await this.auth.deleteAccount();
  }
}
