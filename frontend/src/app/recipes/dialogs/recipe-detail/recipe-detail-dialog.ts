import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, computed, effect, inject, linkedSignal, signal } from '@angular/core';
import { ChefBadge } from '../../../chefs/components/chef-badge';
import { FollowButton } from '../../../chefs/components/follow-button';
import { AuthService } from '../../../core/auth/auth.service';
import { I18nService } from '../../../core/i18n/i18n.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { ToastService } from '../../../core/toast/toast.service';
import { recipeShareText } from '../../domain/share-text';
import { AppDialog } from '../../../shared/dialog/app-dialog.service';
import { NutritionService } from '../../data/nutrition.service';
import { PairingService } from '../../data/pairing.service';
import { RecipeStore } from '../../data/recipe.store';
import { totalMinutes } from '../../domain/diets';
import { scaleIngredients } from '../../domain/ingredients';
import { stepToMetric, toMetric, usesUsUnits } from '../../domain/metric';
import { recipeImages, safeImageUrl } from '../../domain/recipe-images';
import { youtubeVideoId } from '../../domain/video';
import { VideoPlayer } from '../../components/video-player';
import { ALLERGEN_IDS, DIETS, difficultyIcon } from '../../models/recipe.constants';
import { MyAllergiesService } from '../../../account/allergies/my-allergies.service';
import { CookLogService } from '../../data/cook-log.service';
import { Recipe } from '../../models/recipe.model';
import { RecipeDialogs } from '../../recipe-dialogs.service';
import { ShoppingListData } from '../../models/shopping-list.model';
import { ShoppingListDialog } from '../shopping-list-dialog';
import { CookModeData } from '../../models/cook-mode.model';
import { CookModeDialog } from '../cook-mode-dialog';
import { AddToCollectionDialog } from '../add-to-collection-dialog';
import { AddToPlanDialog } from '../add-to-plan-dialog';

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
  protected readonly allergens = computed(() =>
    ALLERGEN_IDS.filter((id) => this.recipe()?.allergens?.includes(id)),
  );
  protected readonly allergenList = computed(() =>
    this.allergens()
      .map((id) => this.i18n.label('allergens', id))
      .join(' · '),
  );
  private readonly myAllergies = inject(MyAllergiesService);
  private readonly cookLog = inject(CookLogService);
  /** The reader's own allergens that this recipe contains (Settings → My allergies). */
  protected readonly myAllergensHere = computed(() =>
    this.myAllergies
      .foundIn(this.recipe()?.allergens)
      .map((id) => this.i18n.label('allergens', id)),
  );
  protected readonly dietPills = computed(() => {
    const recipe = this.recipe();
    if (!recipe) return [];
    return this.store.dietLabelsOf(recipe).flatMap((id) => DIETS.filter((d) => d.id === id));
  });

  // Servings: the ingredient list scales with the stepper.
  private readonly baseServings = computed(() => Math.trunc(this.recipe()?.servings ?? 0) || 1);
  protected readonly servings = linkedSignal(() => this.baseServings());
  /** "Show in metric": US units in grams / millilitres, oven temperatures in °C. */
  protected readonly metric = signal(false);
  protected readonly hasUsUnits = computed(() =>
    usesUsUnits(this.recipe()?.ingredients ?? [], this.recipe()?.steps ?? []),
  );
  protected readonly steps = computed(() => {
    const steps = this.recipe()?.steps ?? [];
    return this.metric() ? steps.map(stepToMetric) : steps;
  });
  protected readonly ingredients = computed(() =>
    scaleIngredients(this.recipe()?.ingredients ?? [], this.servings() / this.baseServings()).map(
      (ingredient) => (this.metric() ? toMetric(ingredient) : ingredient),
    ),
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

  /** "Send recipe": the share sheet on phones (WhatsApp, Messages, email…), a copy on computers. */
  protected async sendRecipe(recipe: Recipe): Promise<void> {
    const t = this.i18n.t;
    const text = recipeShareText(
      recipe,
      recipe.servings ? t('cookbook.serves', { count: this.servings() }) : '',
      this.ingredients(),
      this.steps(),
      {
        serves: '',
        ingredients: t('detail.ingredients'),
        steps: t('detail.steps'),
        tip: t('form.tip'),
        footer: t('detail.sendFooter'),
      },
    );
    // Phones and tablets get their share sheet (WhatsApp, Messages…); computers just copy it.
    const touchScreen = window.matchMedia?.('(pointer: coarse)').matches;
    if (touchScreen && 'share' in navigator) {
      try {
        await navigator.share({ title: recipe.name, text });
        return;
      } catch (error) {
        // Closing the share sheet is not an error; anything else falls back to copying.
        if ((error as DOMException)?.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      this.toast.show(t('detail.sendCopied'));
    } catch {
      this.toast.show(t('detail.sendFailed'));
    }
  }

  protected async printRecipe(recipe: Recipe): Promise<void> {
    const { PrintRecipeDialog } = await import('../print-recipe-dialog');
    this.dialog.open(PrintRecipeDialog, { data: recipe, width: 'medium' });
  }

  protected openShoppingList(recipe: Recipe): void {
    this.dialog.open<ShoppingListDialog, ShoppingListData>(ShoppingListDialog, {
      width: 'wide',
      data: { recipeName: recipe.name, servings: this.servings(), ingredients: this.ingredients() },
    });
  }

  protected openCookMode(recipe: Recipe): void {
    const ref = this.dialog.open<CookModeDialog, CookModeData, 'cooked'>(CookModeDialog, {
      width: 'detail',
      data: { recipeName: recipe.name, steps: this.steps(), ingredients: this.ingredients() },
    });
    // Finishing the last step counts as having cooked it (for the "cooked" sorts).
    ref.closed.subscribe((result) => {
      if (result === 'cooked') void this.cookLog.record(recipe.id);
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

  protected addToPlan(recipe: Recipe): void {
    this.dialog.open(AddToPlanDialog, { width: 'small', data: recipe.id });
  }
}
