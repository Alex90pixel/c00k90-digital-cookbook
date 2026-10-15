import { Injectable, inject } from '@angular/core';
import { AppDialog } from '../shared/dialog/app-dialog.service';
import { Recipe } from './models/recipe.model';

/**
 * Opens the recipe dialogs. They are loaded on first use, which keeps the first page load small
 * and avoids import cycles (the dialogs open each other through this service).
 */
@Injectable({ providedIn: 'root' })
export class RecipeDialogs {
  private readonly dialog = inject(AppDialog);

  async openDetail(recipeId: string): Promise<void> {
    const { RecipeDetailDialog } = await import('./dialogs/recipe-detail/recipe-detail-dialog');
    this.dialog.open(RecipeDetailDialog, { data: recipeId, width: 'detail' });
  }

  /** Opens the form for a new recipe, or for editing `recipe`. */
  async openForm(recipe: Recipe | null = null): Promise<void> {
    const { RecipeFormDialog } = await import('./dialogs/recipe-form/recipe-form-dialog');
    // The form asks before discarding changes, so it handles Escape and backdrop clicks itself.
    this.dialog.open(RecipeFormDialog, { data: recipe, width: 'form', disableClose: true });
  }

  async openReport(recipe: Recipe): Promise<void> {
    const { ReportDialog } = await import('./dialogs/report-dialog');
    this.dialog.open(ReportDialog, { data: recipe, width: 'medium' });
  }
}
