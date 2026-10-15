import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, computed, effect, inject, linkedSignal, signal } from '@angular/core';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../../../core/toast/toast.service';
import { AppDialog } from '../../../shared/dialog/app-dialog.service';
import { NutritionService } from '../../data/nutrition.service';
import { PairingService } from '../../data/pairing.service';
import { RecipeStore } from '../../data/recipe.store';
import { totalMinutes } from '../../domain/diets';
import { scaleIngredients } from '../../domain/ingredients';
import { recipeImages, safeImageUrl } from '../../domain/recipe-images';
import { DIETS, difficultyIcon } from '../../models/recipe.constants';
import { Recipe } from '../../models/recipe.model';
import { RecipeDialogs } from '../../recipe-dialogs.service';

@Component({
  selector: 'app-recipe-detail-dialog',
  templateUrl: './recipe-detail-dialog.html',
  styleUrl: './recipe-detail-dialog.scss',
})
export class RecipeDetailDialog {
  private readonly recipeId = inject<string>(DIALOG_DATA);
  private readonly ref = inject(DialogRef);
  private readonly store = inject(RecipeStore);
  private readonly auth = inject(AuthService);
  private readonly dialog = inject(AppDialog);
  private readonly dialogs = inject(RecipeDialogs);
  private readonly toast = inject(ToastService);
  private readonly nutritionService = inject(NutritionService);
  private readonly pairingService = inject(PairingService);

  /** Read from the store, so favorite/share changes show up immediately. */
  protected readonly recipe = computed(() => this.store.findById(this.recipeId));
  protected readonly isOwner = computed(() => this.recipe()?.userId === this.auth.user()?.uid);
  protected readonly isAdmin = this.auth.isAdmin;

  protected readonly totalMinutes = computed(() => totalMinutes(this.recipe() ?? {}));
  protected readonly difficulty = computed(() => this.recipe()?.difficulty ?? 'Easy');
  protected readonly difficultyIcon = computed(() => difficultyIcon(this.difficulty()));
  protected readonly dietPills = computed(() => {
    const recipe = this.recipe();
    if (!recipe) return [];
    return this.store.dietLabelsOf(recipe).flatMap((id) => DIETS.filter((d) => d.id === id));
  });

  // Servings: the ingredient list scales with the stepper.
  private readonly baseServings = computed(() => Math.trunc(this.recipe()?.servings ?? 0) || 1);
  protected readonly servings = linkedSignal(() => this.baseServings());
  protected readonly ingredients = computed(() =>
    scaleIngredients(this.recipe()?.ingredients ?? [], this.servings() / this.baseServings()),
  );

  protected readonly nutrition = computed(() => {
    const recipe = this.recipe();
    return recipe ? this.nutritionService.estimate(recipe.ingredients, recipe.servings) : null;
  });
  protected readonly drinks = computed(() => {
    const recipe = this.recipe();
    return recipe ? this.pairingService.suggestionFor(recipe) : null;
  });

  // Photo gallery.
  protected readonly images = computed(() =>
    recipeImages(this.recipe() ?? { images: [] }).filter((image) => safeImageUrl(image.url)),
  );
  protected readonly activeImage = signal(0);
  protected readonly activeImageUrl = computed(
    () => this.images()[this.activeImage()]?.url ?? null,
  );

  protected readonly sourceIsLink = computed(() =>
    /^https?:\/\//i.test(this.recipe()?.source ?? ''),
  );

  constructor() {
    // Close when the recipe disappears (deleted, or hidden by the moderator).
    effect(() => {
      if (!this.recipe()) this.ref.close();
    });
  }

  protected close(): void {
    this.ref.close();
  }

  protected changeServings(step: number): void {
    this.servings.update((value) => Math.max(1, value + step));
  }

  protected toggleFavorite(recipe: Recipe): void {
    void this.store.toggleFavorite(recipe);
  }

  protected toggleShared(recipe: Recipe): void {
    void this.store.toggleShared(recipe);
  }

  protected edit(recipe: Recipe): void {
    this.ref.close();
    void this.dialogs.openForm(recipe);
  }

  protected async delete(recipe: Recipe): Promise<void> {
    const confirmed = await this.dialog.confirm({
      icon: '🗑️',
      title: 'Delete Recipe?',
      message: 'Are you sure you want to delete this recipe? This cannot be undone.',
      cancelLabel: 'Keep it',
      confirmLabel: 'Delete',
    });
    if (confirmed) await this.store.delete(recipe);
  }

  protected report(recipe: Recipe): void {
    void this.dialogs.openReport(recipe);
  }

  protected async hideFromInspired(recipe: Recipe): Promise<void> {
    const confirmed = await this.dialog.confirm({
      icon: '🛡️',
      title: 'Hide from Get Inspired?',
      message: `Hide "${recipe.name || 'this recipe'}" from Get Inspired? The author keeps it privately.`,
      confirmLabel: 'Hide',
    });
    if (!confirmed) return;
    try {
      await this.store.hideFromInspired(recipe.id);
      this.toast.show('🛡️ Hidden from Get Inspired');
    } catch (error) {
      this.toast.show(`⚠️ Could not hide: ${error instanceof Error ? error.message : error}`);
    }
  }
}
