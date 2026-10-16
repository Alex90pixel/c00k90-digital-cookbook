import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormField, form, min, required, validate } from '@angular/forms/signals';
import { filter, merge } from 'rxjs';
import { I18nService } from '../../../core/i18n/i18n.service';
import { TranslationKey, TranslationParams } from '../../../core/i18n/i18n.types';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { ToastService } from '../../../core/toast/toast.service';
import { AppDialog } from '../../../shared/dialog/app-dialog.service';
import { PhotoConsent } from '../../../shared/dialog/photo-consent.service';
import { NutritionService } from '../../data/nutrition.service';
import {
  RecipeImportService,
  VideoPlatform,
  isLink,
  videoPlatform,
} from '../../data/recipe-import.service';
import { RecipePhotoService } from '../../data/recipe-photo.service';
import { RecipeStore } from '../../data/recipe.store';
import { parseIngredientLines, parseStepLines } from '../../domain/ingredients';
import { emptyRecipeForm, recipeToForm } from '../../domain/recipe-form';
import { recipeImages, safeImageUrl } from '../../domain/recipe-images';
import { TimeEstimate, estimateTimeAndServings } from '../../domain/time-estimate';
import { youtubeVideoId } from '../../domain/video';
import { FormPhoto, RecipeFormValue } from '../../models/recipe-form.model';
import {
  CATEGORIES,
  DIFFICULTIES,
  MAX_PHOTOS_PER_RECIPE,
  MANUAL_DIET_IDS,
} from '../../models/recipe.constants';
import { Difficulty, Recipe } from '../../models/recipe.model';

interface ImportStatus {
  key: TranslationKey;
  params?: TranslationParams;
}

@Component({
  selector: 'app-recipe-form-dialog',
  imports: [FormField, TranslatePipe],
  templateUrl: './recipe-form-dialog.html',
  styleUrl: './recipe-form-dialog.scss',
})
export class RecipeFormDialog {
  private readonly existing = inject<Recipe | null>(DIALOG_DATA);
  private readonly ref = inject(DialogRef);
  private readonly store = inject(RecipeStore);
  private readonly photoService = inject(RecipePhotoService);
  private readonly importService = inject(RecipeImportService);
  private readonly nutrition = inject(NutritionService);
  private readonly dialog = inject(AppDialog);
  private readonly photoConsent = inject(PhotoConsent);
  private readonly toast = inject(ToastService);
  protected readonly i18n = inject(I18nService);

  protected readonly categories = CATEGORIES;
  protected readonly difficulties = DIFFICULTIES;
  protected readonly manualDietIds = MANUAL_DIET_IDS;
  protected readonly maxPhotos = MAX_PHOTOS_PER_RECIPE;
  protected readonly isEditing = !!this.existing;

  protected readonly model = signal<RecipeFormValue>(
    this.existing ? recipeToForm(this.existing) : emptyRecipeForm(),
  );
  protected readonly recipeForm = form(this.model, (recipe) => {
    required(recipe.name, { message: this.i18n.t('form.nameRequired') });
    required(recipe.category, { message: this.i18n.t('form.categoryRequired') });
    min(recipe.prepTime, 0);
    min(recipe.cookTime, 0);
    min(recipe.servings, 1);
    validate(recipe.videoUrl, ({ value }) =>
      value().trim() && !youtubeVideoId(value())
        ? { kind: 'youtube', message: this.i18n.t('form.videoInvalid') }
        : null,
    );
  });

  // Paste boxes: they fill the lists below them (also on save, if "Add pasted…" wasn't pressed).
  protected readonly ingredientsPaste = signal('');
  protected readonly stepsPaste = signal('');
  protected readonly estimate = signal<TimeEstimate | null>(null);

  // Photos: the existing ones stay until removed; new ones are uploaded on save.
  protected readonly photos = signal<FormPhoto[]>(
    this.existing
      ? recipeImages(this.existing)
          .filter((image) => safeImageUrl(image.url))
          .map((image) => ({ image, previewUrl: image.url }))
      : [],
  );
  private readonly photosChanged = signal(false);

  // Import from a video link.
  protected readonly canImport = computed(() => isLink(this.model().source));
  protected readonly importing = signal(false);
  protected readonly importStatus = signal<ImportStatus | null>(null);
  protected readonly importedFrom = signal<VideoPlatform | null>(null);

  protected readonly saving = signal(false);

  constructor() {
    // The form asks before throwing away changes, so Escape and backdrop clicks come here.
    merge(this.ref.backdropClick, this.ref.keydownEvents.pipe(filter((e) => e.key === 'Escape')))
      .pipe(takeUntilDestroyed())
      .subscribe(() => void this.cancel());
    inject(DestroyRef).onDestroy(() => this.revokePreviews(this.photos()));
  }

  // ----- Lists -----

  protected addPastedIngredients(): void {
    const ingredients = parseIngredientLines(this.ingredientsPaste());
    if (!ingredients.length) return;
    this.model.update((v) => ({ ...v, ingredients: [...v.ingredients, ...ingredients] }));
    this.recipeForm().markAsDirty();
    this.ingredientsPaste.set('');
    this.fillEstimates();
  }

  protected removeIngredient(index: number): void {
    this.model.update((v) => ({ ...v, ingredients: v.ingredients.filter((_, i) => i !== index) }));
    this.recipeForm().markAsDirty();
  }

  protected addPastedSteps(): void {
    const steps = parseStepLines(this.stepsPaste());
    if (!steps.length) return;
    this.model.update((v) => ({ ...v, steps: [...v.steps, ...steps] }));
    this.recipeForm().markAsDirty();
    this.stepsPaste.set('');
    this.fillEstimates();
  }

  protected removeStep(index: number): void {
    this.model.update((v) => ({ ...v, steps: v.steps.filter((_, i) => i !== index) }));
    this.recipeForm().markAsDirty();
  }

  protected setDifficulty(difficulty: Difficulty): void {
    this.recipeForm.difficulty().value.set(difficulty);
    this.recipeForm.difficulty().markAsDirty();
  }

  /** Fills empty time and servings fields with a rough estimate once there are steps and ingredients. */
  private fillEstimates(): void {
    const value = this.model();
    const estimate = estimateTimeAndServings(
      value.steps.length,
      value.ingredients,
      value.category,
      this.nutrition.estimate(value.ingredients, 1),
    );
    if (!estimate) return;
    this.model.update((v) => ({
      ...v,
      prepTime: v.prepTime ?? estimate.prepTime,
      cookTime: v.cookTime ?? estimate.cookTime,
      servings: v.servings ?? estimate.servings,
    }));
    this.estimate.set(estimate);
  }

  // ----- Photos -----

  protected async pickPhotos(input: HTMLInputElement): Promise<void> {
    if (await this.photoConsent.ask()) input.click();
  }

  protected async addPhotos(input: HTMLInputElement): Promise<void> {
    const files = Array.from(input.files ?? []).filter((file) => file.type.startsWith('image/'));
    input.value = '';
    for (const file of files) {
      if (this.photos().length >= MAX_PHOTOS_PER_RECIPE) {
        this.toast.show(this.i18n.t('form.maxPhotos', { max: MAX_PHOTOS_PER_RECIPE }));
        break;
      }
      try {
        const prepared = await this.photoService.prepare(file);
        this.photos.update((list) => [
          ...list,
          { file: prepared, previewUrl: URL.createObjectURL(prepared) },
        ]);
        this.photosChanged.set(true);
      } catch {
        this.toast.show(this.i18n.t('form.badImage'));
      }
    }
  }

  protected removePhoto(index: number): void {
    this.revokePreviews(this.photos().slice(index, index + 1));
    this.photos.update((list) => list.filter((_, i) => i !== index));
    this.photosChanged.set(true);
  }

  private revokePreviews(photos: readonly FormPhoto[]): void {
    photos.filter((p) => p.file).forEach((p) => URL.revokeObjectURL(p.previewUrl));
  }

  // ----- Source -----

  protected async importFromLink(): Promise<void> {
    const url = this.model().source.trim();
    if (!url) {
      this.importStatus.set({ key: 'form.importEmpty' });
      return;
    }
    this.importing.set(true);
    this.importStatus.set({ key: 'form.importing' });
    try {
      const info = await this.importService.fetchInfo(url);
      if (info.title) {
        this.recipeForm.name().value.set(info.title);
        this.recipeForm.name().markAsDirty();
      }
      this.importedFrom.set(videoPlatform(url));
      // A YouTube source is most likely the recipe's video too.
      if (youtubeVideoId(url) && !this.model().videoUrl.trim()) {
        this.recipeForm.videoUrl().value.set(url);
      }
      this.importStatus.set(
        info.author
          ? { key: 'form.importedFrom', params: { author: info.author } }
          : { key: 'form.imported' },
      );
    } catch {
      this.importStatus.set({ key: 'form.importFailed' });
    } finally {
      this.importing.set(false);
    }
  }

  protected markAsOwnRecipe(): void {
    this.recipeForm.source().value.set(this.i18n.t('form.ownRecipeSource'));
    this.recipeForm.source().markAsDirty();
    this.importStatus.set(null);
  }

  // ----- Save / cancel -----

  protected async save(): Promise<void> {
    if (this.saving()) return;
    // Text still in the paste boxes belongs to the recipe too; it was easy to lose before.
    this.addPastedIngredients();
    this.addPastedSteps();
    if (this.recipeForm().invalid()) {
      this.recipeForm().markAsTouched();
      const firstError = this.recipeForm().errorSummary()[0];
      this.toast.show(firstError?.message ?? this.i18n.t('form.checkForm'));
      firstError?.fieldTree().focusBoundControl();
      return;
    }
    this.saving.set(true);
    const saved = await this.store.save(this.model(), this.photos(), this.existing);
    this.saving.set(false);
    if (saved) this.ref.close();
  }

  protected async cancel(): Promise<void> {
    const changed =
      this.recipeForm().dirty() ||
      this.photosChanged() ||
      !!this.ingredientsPaste().trim() ||
      !!this.stepsPaste().trim();
    if (changed) {
      const t = this.i18n.t;
      const discard = await this.dialog.confirm({
        icon: '✍️',
        title: t('form.discardTitle'),
        message: t('form.discardMessage'),
        cancelLabel: t('form.discardKeep'),
        confirmLabel: t('form.discardConfirm'),
      });
      if (!discard) return;
    }
    this.ref.close();
  }
}
