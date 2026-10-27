import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, computed, effect, inject, linkedSignal, signal } from '@angular/core';
import { ChefBadge } from '../../../chefs/components/chef-badge';
import { FollowButton } from '../../../chefs/components/follow-button';
import { AuthService } from '../../../core/auth/auth.service';
import { I18nService } from '../../../core/i18n/i18n.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { ToastService } from '../../../core/toast/toast.service';
import { AppDialog } from '../../../shared/dialog/app-dialog.service';
import { NutritionService } from '../../data/nutrition.service';
import { PairingService } from '../../data/pairing.service';
import { RecipeStore } from '../../data/recipe.store';
import { totalMinutes } from '../../domain/diets';
import { scaleIngredients } from '../../domain/ingredients';
import { recipeImages, safeImageUrl } from '../../domain/recipe-images';
import { youtubeVideoId } from '../../domain/video';
import { VideoPlayer } from '../../components/video-player';
import { DIETS, difficultyIcon } from '../../models/recipe.constants';
import { Recipe } from '../../models/recipe.model';
import { RecipeDialogs } from '../../recipe-dialogs.service';
import { ShoppingListData } from '../../models/shopping-list.model';
import { ShoppingListDialog } from '../shopping-list-dialog';
import { CookModeData } from '../../models/cook-mode.model';
import { CookModeDialog } from '../cook-mode-dialog';
import { AddToCollectionDialog } from '../add-to-collection-dialog';

@Component({
  selector: 'app-recipe-detail-dialog',
  imports: [TranslatePipe, ChefBadge, FollowButton, VideoPlayer],
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
  protected readonly i18n = inject(I18nService);

  /** Read from the store, so favorite/share changes show up immediately. */
  protected readonly recipe = computed(() => this.store.findById(this.recipeId));
  protected readonly isOwner = computed(() => this.recipe()?.userId === this.auth.user()?.uid);
  protected readonly isAdmin = this.auth.isAdmin;
  protected readonly isFavorite = computed(() => {
    const recipe = this.recipe();
    return !!recipe && this.store.isFavorite(recipe);
  });

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

  protected readonly videoId = computed(() => youtubeVideoId(this.recipe()?.videoUrl));
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

  protected openShoppingList(recipe: Recipe): void {
    this.dialog.open<ShoppingListDialog, ShoppingListData>(ShoppingListDialog, {
      width: 'wide',
      data: { recipeName: recipe.name, servings: this.servings(), ingredients: this.ingredients() },
    });
  }

  protected openCookMode(recipe: Recipe): void {
    this.dialog.open<CookModeDialog, CookModeData>(CookModeDialog, {
      width: 'detail',
      data: { recipeName: recipe.name, steps: recipe.steps ?? [], ingredients: this.ingredients() },
    });
  }

  protected changeServings(step: number): void {
    this.servings.update((value) => Math.max(1, value + step));
  }

  protected toggleFavorite(recipe: Recipe): void {
    void this.store.toggleFavorite(recipe);
  }

  protected async toggleShared(recipe: Recipe): Promise<void> {
    // Photos cut out of a magazine or book are not ours to publish: ask before sharing.
    if (!recipe.shared && recipeImages(recipe).some((image) => image.fromPrint)) {
      const t = this.i18n.t;
      const shareAnyway = await this.dialog.confirm({
        icon: '📰',
        title: t('detail.printPhotoTitle'),
        message: t('detail.printPhotoMessage'),
        cancelLabel: t('detail.printPhotoKeep'),
        confirmLabel: t('detail.printPhotoShare'),
      });
      if (!shareAnyway) return;
    }
    await this.store.toggleShared(recipe);
  }

  protected edit(recipe: Recipe): void {
    this.ref.close();
    void this.dialogs.openForm(recipe);
  }

  protected async delete(recipe: Recipe): Promise<void> {
    const t = this.i18n.t;
    const confirmed = await this.dialog.confirm({
      icon: '🗑️',
      title: t('detail.deleteTitle'),
      message: t('detail.deleteMessage'),
      cancelLabel: t('detail.deleteKeep'),
      confirmLabel: t('detail.deleteConfirm'),
    });
    if (confirmed) await this.store.delete(recipe);
  }

  protected report(recipe: Recipe): void {
    void this.dialogs.openReport(recipe);
  }

  protected async hideFromInspired(recipe: Recipe): Promise<void> {
    const t = this.i18n.t;
    const confirmed = await this.dialog.confirm({
      icon: '🛡️',
      title: t('detail.hideTitle'),
      message: t('detail.hideMessage', { name: recipe.name || t('detail.thisRecipe') }),
      confirmLabel: t('detail.hideConfirm'),
    });
    if (!confirmed) return;
    try {
      await this.store.hideFromInspired(recipe.id);
      this.toast.show(t('detail.hidden'));
    } catch (error) {
      this.toast.show(
        t('detail.hideFailed', { error: error instanceof Error ? error.message : String(error) }),
      );
    }
  }

  protected addToCollection(recipe: Recipe): void {
    this.dialog.open(AddToCollectionDialog, { width: 'small', data: recipe.id });
  }
}
