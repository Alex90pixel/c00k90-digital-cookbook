import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, inject, signal } from '@angular/core';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { ToastService } from '../../core/toast/toast.service';
import { RecipeStore } from '../data/recipe.store';
import { Recipe } from '../models/recipe.model';

/**
 * After finishing a recipe in Cook mode: "How did it turn out?". The note is added, with the
 * date, at the end of the recipe's notes ("My Notes"), without opening the form.
 */
@Component({
  selector: 'app-cook-note-dialog',
  imports: [TranslatePipe],
  template: `
    <div class="confirm-dialog text-left" role="dialog" aria-labelledby="cook-note-title">
      <h2 id="cook-note-title">📝 {{ 'cookNote.title' | t }}</h2>
      <p>{{ 'cookNote.hint' | t }}</p>
      <textarea
        class="field"
        rows="3"
        maxlength="500"
        name="cook-note"
        [attr.aria-label]="'cookNote.title' | t"
        [placeholder]="'cookNote.placeholder' | t"
        [value]="text()"
        (input)="text.set($any($event.target).value)"
      ></textarea>
      <div class="confirm-btns">
        <button type="button" class="btn-confirm-cancel" (click)="ref.close()">
          {{ 'cookNote.skip' | t }}
        </button>
        <button
          type="button"
          class="btn-save"
          [disabled]="!text().trim() || saving()"
          (click)="save()"
        >
          {{ (saving() ? 'common.saving' : 'cookNote.save') | t }}
        </button>
      </div>
    </div>
  `,
  styles: `
    .field {
      width: 100%;
      margin-bottom: 16px;
      resize: vertical;
    }
  `,
})
export class CookNoteDialog {
  private readonly recipe = inject<Recipe>(DIALOG_DATA);
  private readonly store = inject(RecipeStore);
  private readonly i18n = inject(I18nService);
  private readonly toast = inject(ToastService);
  protected readonly ref = inject(DialogRef);

  protected readonly text = signal('');
  protected readonly saving = signal(false);

  protected async save(): Promise<void> {
    const note = this.text().trim();
    if (!note) return;
    this.saving.set(true);
    try {
      const date = new Intl.DateTimeFormat(this.i18n.option().locale, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(new Date());
      await this.store.addNote(this.recipe, `📅 ${date}: ${note}`);
      this.toast.show(this.i18n.t('cookNote.saved'));
      this.ref.close();
    } catch (error) {
      console.error('Could not save the note', error);
      this.toast.show(this.i18n.t('cookNote.failed'));
    } finally {
      this.saving.set(false);
    }
  }
}
