import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, inject, signal } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { ToastService } from '../../core/toast/toast.service';
import { buildCookbookHtml } from '../domain/cookbook-html';
import { CookbookStyle } from '../models/cookbook-export.model';
import { Recipe } from '../models/recipe.model';
import { STYLES, cookbookLabels, printHtml } from './cookbook-export-dialog';

/** Prints (or saves as PDF) one recipe, in one of the cookbook styles. */
@Component({
  selector: 'app-print-recipe-dialog',
  imports: [TranslatePipe],
  template: `
    <div class="confirm-dialog text-left" role="dialog" aria-labelledby="print-title">
      <h2 id="print-title">🖨️ {{ 'print.title' | t }}</h2>
      <p>{{ 'print.hint' | t }}</p>

      <fieldset class="styles">
        <legend>{{ 'cookbook.style' | t }}</legend>
        @for (option of styles; track option.id) {
          <label class="style" [class.on]="style() === option.id">
            <input
              type="radio"
              name="print-style"
              [value]="option.id"
              [checked]="style() === option.id"
              (change)="style.set(option.id)"
            />
            <span class="emoji" aria-hidden="true">{{ option.emoji }}</span>
            <span>{{ option.label | t }}</span>
          </label>
        }
      </fieldset>

      <div class="confirm-btns">
        <button type="button" class="btn-confirm-cancel" (click)="ref.close()">
          {{ 'common.cancel' | t }}
        </button>
        <button type="button" class="btn-save" [disabled]="preparing()" (click)="print()">
          {{ (preparing() ? 'cookbook.preparing' : 'print.print') | t }}
        </button>
      </div>
    </div>
  `,
  styles: `
    .styles {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 8px;
      margin: 0 0 18px;
      padding: 0;
      border: 0;
    }
    legend {
      margin-bottom: 6px;
      color: var(--text-mid);
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    .style {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: 10px 6px;
      border: 1.5px solid var(--border);
      border-radius: 14px;
      color: var(--text-dark);
      font-size: 13px;
      text-align: center;
      cursor: pointer;
    }
    .style.on {
      border-color: var(--teal);
      background: var(--teal-pale);
    }
    .style input {
      position: absolute;
      opacity: 0;
      pointer-events: none;
    }
    .style:focus-within {
      outline: 2px solid var(--teal);
      outline-offset: 2px;
    }
    .emoji {
      font-size: 22px;
    }
    @media (max-width: 420px) {
      .styles {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
  `,
})
export class PrintRecipeDialog {
  private readonly recipe = inject<Recipe>(DIALOG_DATA);
  private readonly auth = inject(AuthService);
  private readonly i18n = inject(I18nService);
  private readonly toast = inject(ToastService);
  protected readonly ref = inject(DialogRef);

  protected readonly styles = STYLES;
  protected readonly style = signal<CookbookStyle>('classic');
  protected readonly preparing = signal(false);

  protected async print(): Promise<void> {
    this.preparing.set(true);
    try {
      const html = buildCookbookHtml({
        style: this.style(),
        lang: this.i18n.language(),
        title: this.recipe.name,
        author: this.auth.displayName() ?? '',
        recipes: [this.recipe],
        labels: cookbookLabels(this.i18n),
        recipesOnly: true,
      });
      await printHtml(html);
      this.ref.close();
    } catch (error) {
      console.error('Printing the recipe failed', error);
      this.toast.show(this.i18n.t('print.failed'));
    } finally {
      this.preparing.set(false);
    }
  }
}
