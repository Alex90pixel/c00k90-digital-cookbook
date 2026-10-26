import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { ProfileService } from '../../account/profile/profile.service';
import { ChefService } from '../../chefs/chef.service';
import { AuthService } from '../../core/auth/auth.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { ToastService } from '../../core/toast/toast.service';
import { dietLabels, totalMinutes } from '../domain/diets';
import { formToRecipeData } from '../domain/recipe-form';
import { recipeStoragePaths } from '../domain/recipe-images';
import { matchesSearch } from '../domain/search';
import { FormPhoto, RecipeFormValue } from '../models/recipe-form.model';
import {
  Category,
  DietId,
  Recipe,
  RecipeData,
  RecipeImage,
  RecipeSort,
  RecipeView,
} from '../models/recipe.model';
import { NutritionService } from './nutrition.service';
import { FavoritesService } from './favorites.service';
import { RecipePhotoService } from './recipe-photo.service';
import { RecipeRepository, newestFirst } from './recipe.repository';

/**
 * State of the cookbook: the user's recipes, the shared "Get Inspired" recipes, and the current
 * view, search, filters and sort. All changes go through this store, so every screen stays in sync.
 */
@Injectable({ providedIn: 'root' })
export class RecipeStore {
  private readonly auth = inject(AuthService);
  private readonly repository = inject(RecipeRepository);
  private readonly photos = inject(RecipePhotoService);
  private readonly nutrition = inject(NutritionService);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(I18nService);
  private readonly profiles = inject(ProfileService);
  private readonly chefs = inject(ChefService);
  private readonly favorites = inject(FavoritesService);

  private readonly mine = signal<Recipe[]>([]);
  private readonly shared = signal<Recipe[]>([]);
  private readonly loadingMine = signal(false);
  private readonly loadingShared = signal(false);
  private sharedLoaded = false;

  /** All recipes shared to "Get Inspired", newest first (loaded on demand). */
  readonly sharedRecipes = this.shared.asReadonly();
  readonly sharedLoading = this.loadingShared.asReadonly();

  readonly view = signal<RecipeView>('all');
  readonly search = signal('');
  readonly category = signal<Category | 'all'>('all');
  readonly diet = signal<DietId | null>(null);
  readonly sort = signal<RecipeSort>('recent');

  /** Favorites and Get Inspired show shared recipes; My Recipes shows the user's own. */
  readonly loading = computed(() =>
    this.view() === 'all' ? this.loadingMine() : this.loadingShared(),
  );

  /** The recipes of the current view, after search, filters and sort. */
  readonly visible = computed(() => {
    const view = this.view();
    const query = this.search().toLowerCase().trim();
    const category = this.category();
    const diet = this.diet();

    let recipes = view === 'all' ? this.mine() : this.shared();
    if (view === 'favorites') recipes = recipes.filter((r) => this.favorites.isFavorite(r.id));
    if (category !== 'all') recipes = recipes.filter((r) => r.category === category);
    if (diet) recipes = recipes.filter((r) => this.dietLabelsOf(r).includes(diet));
    if (query) recipes = recipes.filter((r) => matchesSearch(r, query));
    return this.sorted(recipes, this.sort());
  });

  constructor() {
    // Load the cookbook on sign-in and forget it on sign-out.
    effect(() => {
      const user = this.auth.user();
      untracked(() => {
        if (user) void this.loadMine(user.uid);
        else this.reset();
      });
    });
  }

  findById(id: string): Recipe | undefined {
    return this.mine().find((r) => r.id === id) ?? this.shared().find((r) => r.id === id);
  }

  isOwner(recipe: Recipe): boolean {
    return recipe.userId === this.auth.user()?.uid;
  }

  dietLabelsOf(recipe: Recipe): string[] {
    return dietLabels(recipe, this.nutrition.estimate(recipe.ingredients, recipe.servings));
  }

  /** Switching views starts from a clean search. */
  setView(view: RecipeView): void {
    if (view === this.view()) return;
    this.view.set(view);
    this.search.set('');
    this.category.set('all');
    if (view === 'inspired') void this.loadShared();
    if (view === 'favorites') this.ensureSharedLoaded();
  }

  /** Loads the shared recipes once (Followed Chefs, chef profiles); `loadShared` reloads. */
  ensureSharedLoaded(): void {
    if (!this.sharedLoaded && !this.loadingShared()) void this.loadShared();
  }

  async loadShared(): Promise<void> {
    this.loadingShared.set(true);
    try {
      this.shared.set(await this.repository.listShared());
      this.sharedLoaded = true;
    } catch {
      this.toast.show(this.i18n.t('recipes.loadInspiredFailed'));
    } finally {
      this.loadingShared.set(false);
    }
  }

  isFavorite(recipe: Recipe): boolean {
    return this.favorites.isFavorite(recipe.id);
  }

  /** Saves or removes another cook's recipe from the user's favorites (own recipes can't be). */
  async toggleFavorite(recipe: Recipe): Promise<void> {
    if (this.isOwner(recipe)) return;
    const favorite = !this.isFavorite(recipe);
    try {
      if (favorite) await this.favorites.add(recipe.id);
      else await this.favorites.remove(recipe.id);
      this.toast.show(this.i18n.t(favorite ? 'recipes.favoriteAdded' : 'recipes.favoriteRemoved'));
    } catch {
      this.toast.show(this.i18n.t('recipes.favoriteFailed'));
    }
  }

  async toggleShared(recipe: Recipe): Promise<void> {
    const shared = !recipe.shared;
    try {
      await this.repository.update(recipe.id, { shared });
      this.patchMine(recipe.id, { shared });
      this.shared.update((list) =>
        shared
          ? [{ ...recipe, shared }, ...list].sort(newestFirst)
          : list.filter((r) => r.id !== recipe.id),
      );
      this.toast.show(this.i18n.t(shared ? 'recipes.sharedOn' : 'recipes.sharedOff'));
    } catch {
      this.toast.show(this.i18n.t('recipes.shareFailed'));
      return;
    }
    await this.syncChefProfile();
  }

  /**
   * Creates or updates a recipe: uploads new photos, saves the document, then deletes the photos
   * that were removed. Returns `true` when saved.
   */
  async save(
    value: RecipeFormValue,
    photos: readonly FormPhoto[],
    existing: Recipe | null,
  ): Promise<boolean> {
    const userId = this.auth.requireUser().uid;
    try {
      const images = await this.uploadPhotos(userId, photos);
      const data = formToRecipeData(value, userId, images, existing);
      if (existing) {
        await this.repository.update(existing.id, data);
        this.patchMine(existing.id, data);
      } else {
        const id = await this.repository.create(data);
        this.mine.update((list) => [{ ...data, id }, ...list]);
      }
      const removed = existing
        ? recipeStoragePaths(existing).filter((p) => !recipeStoragePaths(data).includes(p))
        : [];
      this.photos.deleteInBackground(removed);
      this.toast.show(this.i18n.t(existing ? 'recipes.updated' : 'recipes.saved'));
      return true;
    } catch (error) {
      this.toast.show(this.i18n.t('recipes.saveFailed', { error: errorMessage(error) }));
      return false;
    }
  }

  async delete(recipe: Recipe): Promise<boolean> {
    try {
      await this.repository.delete(recipe.id);
      this.photos.deleteInBackground(recipeStoragePaths(recipe));
      this.mine.update((list) => list.filter((r) => r.id !== recipe.id));
      this.shared.update((list) => list.filter((r) => r.id !== recipe.id));
      this.toast.show(this.i18n.t('recipes.deleted'));
      if (recipe.shared) await this.syncChefProfile();
      return true;
    } catch {
      this.toast.show(this.i18n.t('recipes.deleteFailed'));
      return false;
    }
  }

  /** Moderator action: removes a recipe from "Get Inspired"; the author keeps it privately. */
  async hideFromInspired(recipeId: string): Promise<void> {
    await this.repository.update(recipeId, { shared: false, hiddenByModerator: true });
    this.shared.update((list) => list.filter((r) => r.id !== recipeId));
    this.patchMine(recipeId, { shared: false, hiddenByModerator: true });
  }

  private async loadMine(userId: string): Promise<void> {
    this.loadingMine.set(true);
    try {
      this.mine.set(await this.repository.listByOwner(userId));
    } catch {
      this.toast.show(this.i18n.t('recipes.loadFailed'));
      return;
    } finally {
      this.loadingMine.set(false);
    }
    // Refreshes the public profile (e.g. a new Google photo), or creates it for recipes
    // shared before profiles existed.
    if (this.sharesRecipes()) await this.syncChefProfile();
  }

  private sharesRecipes(): boolean {
    return this.mine().some((r) => r.shared && !r.hiddenByModerator);
  }

  /**
   * The public chef profile exists exactly while the user shares at least one recipe.
   * A failure here never undoes the recipe change; it's retried on the next load.
   */
  private async syncChefProfile(): Promise<void> {
    const userId = this.auth.user()?.uid;
    if (!userId) return;
    try {
      if (this.sharesRecipes()) await this.profiles.publishChefProfile();
      else await this.chefs.unpublish(userId);
    } catch (error) {
      console.error('Could not update the public chef profile', error);
    }
  }

  private async uploadPhotos(userId: string, photos: readonly FormPhoto[]): Promise<RecipeImage[]> {
    const images: RecipeImage[] = [];
    let uploaded = 0;
    for (const photo of photos) {
      if (photo.image) {
        images.push(photo.image);
      } else if (photo.file) {
        this.toast.show(this.i18n.t('recipes.uploading', { number: ++uploaded }));
        images.push(await this.photos.upload(userId, photo.file));
      }
    }
    return images;
  }

  private patchMine(id: string, changes: Partial<RecipeData>): void {
    this.mine.update((list) => list.map((r) => (r.id === id ? { ...r, ...changes } : r)));
  }

  private reset(): void {
    this.mine.set([]);
    this.shared.set([]);
    this.sharedLoaded = false;
    this.view.set('all');
    this.search.set('');
    this.category.set('all');
    this.diet.set(null);
  }

  private sorted(recipes: Recipe[], sort: RecipeSort): Recipe[] {
    const list = [...recipes];
    switch (sort) {
      case 'alpha':
        return list.sort((a, b) => a.name.localeCompare(b.name));
      case 'time':
        return list.sort((a, b) => totalMinutes(a) - totalMinutes(b));
      case 'protein': {
        const protein = (r: Recipe) =>
          this.nutrition.estimate(r.ingredients, r.servings)?.protein ?? -1;
        return list.sort((a, b) => protein(b) - protein(a));
      }
      case 'kcal': {
        // Recipes without an estimate go last.
        const kcal = (r: Recipe) =>
          this.nutrition.estimate(r.ingredients, r.servings)?.calories ?? Number.MAX_VALUE;
        return list.sort((a, b) => kcal(a) - kcal(b));
      }
      default:
        return list.sort(newestFirst);
    }
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
