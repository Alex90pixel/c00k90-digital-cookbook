import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormField, form, min, required } from '@angular/forms/signals';
import { filter, merge } from 'rxjs';
import { STORAGE_KEYS, safeLocalStorage } from '../../../core/storage/local-storage';
import { ToastService } from '../../../core/toast/toast.service';
import { AppDialog } from '../../../shared/dialog/app-dialog.service';
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
import { estimateTimeAndServings } from '../../domain/time-estimate';
import { FormPhoto, RecipeFormValue } from '../../models/recipe-form.model';
import {
  CATEGORIES,
  DIETS,
  DIFFICULTIES,
  MAX_PHOTOS_PER_RECIPE,
  MANUAL_DIET_IDS,
} from '../../models/recipe.constants';
import { Difficulty, Recipe } from '../../models/recipe.model';

const OWN_RECIPE_SOURCE = 'My own recipe';

@Component({
  selector: 'app-recipe-form-dialog',
  imports: [FormField],
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
  private readonly toast = inject(ToastService);

  protected readonly categories = CATEGORIES;
  protected readonly difficulties = DIFFICULTIES;
  protected readonly manualDiets = DIETS.filter((d) =>
    (MANUAL_DIET_IDS as readonly string[]).includes(d.id),
  ) as {
    id: (typeof MANUAL_DIET_IDS)[number];
    label: string;
  }[];
  protected readonly maxPhotos = MAX_PHOTOS_PER_RECIPE;
  protected readonly isEditing = !!this.existing;

  protected readonly model = signal<RecipeFormValue>(
    this.existing ? recipeToForm(this.existing) : emptyRecipeForm(),
  );
  protected readonly recipeForm = form(this.model, (recipe) => {
    required(recipe.name, { message: '⚠️ Please enter a recipe name!' });
    required(recipe.category, { message: '⚠️ Please select a category!' });
    min(recipe.prepTime, 0);
    min(recipe.cookTime, 0);
    min(recipe.servings, 1);
  });

  // Paste boxes: not saved, they only fill the lists below them.
  protected readonly ingredientsPaste = signal('');
  protected readonly stepsPaste = signal('');
  protected readonly estimateHint = signal('');

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
  protected readonly importStatus = signal('');
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
    this.estimateHint.set(estimate.hint);
  }

  // ----- Photos -----

  protected async pickPhotos(input: HTMLInputElement): Promise<void> {
    if (safeLocalStorage.get(STORAGE_KEYS.photoConsent) !== '1') {
      const ok = await this.dialog.confirm({
        icon: '📷',
        title: 'Add photos',
        message: 'C00K90 will upload only the photos you select. Continue?',
        confirmLabel: 'OK',
        tone: 'primary',
      });
      if (!ok) return;
      safeLocalStorage.set(STORAGE_KEYS.photoConsent, '1');
    }
    input.click();
  }

  protected async addPhotos(input: HTMLInputElement): Promise<void> {
    const files = Array.from(input.files ?? []).filter((file) => file.type.startsWith('image/'));
    input.value = '';
    for (const file of files) {
      if (this.photos().length >= MAX_PHOTOS_PER_RECIPE) {
        this.toast.show(`⚠️ Max ${MAX_PHOTOS_PER_RECIPE} photos per recipe`);
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
        this.toast.show('⚠️ Could not read an image');
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
      this.importStatus.set('Paste a link in the field above first.');
      return;
    }
    this.importing.set(true);
    this.importStatus.set('Fetching the details…');
    try {
      const info = await this.importService.fetchInfo(url);
      if (info.title) {
        this.recipeForm.name().value.set(info.title);
        this.recipeForm.name().markAsDirty();
      }
      this.importedFrom.set(videoPlatform(url));
      this.importStatus.set(
        info.author ? `Imported from: ${info.author}` : 'Imported successfully.',
      );
    } catch {
      this.importStatus.set(
        "Couldn't get the details from this link. You can fill them in yourself.",
      );
    } finally {
      this.importing.set(false);
    }
  }

  protected markAsOwnRecipe(): void {
    this.recipeForm.source().value.set(OWN_RECIPE_SOURCE);
    this.recipeForm.source().markAsDirty();
    this.importStatus.set('');
  }

  // ----- Save / cancel -----

  protected async save(): Promise<void> {
    if (this.saving()) return;
    if (this.recipeForm().invalid()) {
      this.recipeForm().markAsTouched();
      const firstError = this.recipeForm().errorSummary()[0];
      this.toast.show(firstError?.message ?? '⚠️ Please check the form');
      firstError?.fieldTree().focusBoundControl();
      return;
    }
    this.saving.set(true);
    const saved = await this.store.save(this.model(), this.photos(), this.existing);
    this.saving.set(false);
    if (saved) this.ref.close();
  }

  protected async cancel(): Promise<void> {
    const changed = this.recipeForm().dirty() || this.photosChanged();
    if (changed) {
      const discard = await this.dialog.confirm({
        icon: '✍️',
        title: 'Discard your changes?',
        message: "Your changes to this recipe haven't been saved.",
        cancelLabel: 'Keep editing',
        confirmLabel: 'Discard',
      });
      if (!discard) return;
    }
    this.ref.close();
  }
}
