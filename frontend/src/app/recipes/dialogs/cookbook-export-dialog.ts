import { DialogRef } from '@angular/cdk/dialog';
import { Component, computed, inject, signal } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslationKey } from '../../core/i18n/i18n.types';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { ToastService } from '../../core/toast/toast.service';
import { RecipeStore } from '../data/recipe.store';
import { buildCookbookHtml } from '../domain/cookbook-html';
import { CookbookLabels, CookbookStyle } from '../models/cookbook-export.model';

interface StyleOption {
  id: CookbookStyle;
  emoji: string;
  label: TranslationKey;
}

const STYLES: readonly StyleOption[] = [
  { id: 'classic', label: 'cookbook.styles.classic', emoji: '🌿' },
  { id: 'notebook', label: 'cookbook.styles.notebook', emoji: '📒' },
  { id: 'minimal', label: 'cookbook.styles.minimal', emoji: '🖤' },
];

/**
 * "Download my cookbook": pick a style, a title and the recipes, then the browser's print
 * window opens with the finished book, where "Save as PDF" downloads it. Nothing is uploaded.
 */
@Component({
  selector: 'app-cookbook-export-dialog',
  imports: [TranslatePipe],
  template: `
    <div class="confirm-dialog text-left" role="dialog" aria-labelledby="cookbook-title">
      <h2 id="cookbook-title">📖 {{ 'cookbook.title' | t }}</h2>
      <p>{{ 'cookbook.hint' | t }}</p>

      <fieldset class="styles">
        <legend>{{ 'cookbook.style' | t }}</legend>
        @for (option of styles; track option.id) {
          <label class="style" [class.on]="style() === option.id">
            <input
              type="radio"
              name="cookbook-style"
              [value]="option.id"
              [checked]="style() === option.id"
              (change)="style.set(option.id)"
            />
            <span class="emoji" aria-hidden="true">{{ option.emoji }}</span>
            <span>{{ option.label | t }}</span>
          </label>
        }
      </fieldset>

      <label class="field-label" for="cookbook-name">{{ 'cookbook.bookTitle' | t }}</label>
      <input
        id="cookbook-name"
        class="field"
        type="text"
        maxlength="60"
        [value]="title()"
        (input)="title.set($any($event.target).value)"
      />

      <div class="recipes-head">
        <span>{{ 'cookbook.recipes' | t: { count: selected().size } }}</span>
        <button type="button" class="link" (click)="toggleAll()">
          {{ (allSelected() ? 'cookbook.selectNone' : 'cookbook.selectAll') | t }}
        </button>
      </div>
      <ul class="recipe-list">
        @for (recipe of recipes(); track recipe.id) {
          <li>
            <label>
              <input
                name="recipes"
                type="checkbox"
                [checked]="selected().has(recipe.id)"
                (change)="toggle(recipe.id)"
              />
              <span>{{ recipe.name }}</span>
            </label>
          </li>
        } @empty {
          <li class="empty">{{ 'cookbook.noRecipes' | t }}</li>
        }
      </ul>

      <div class="confirm-btns">
        <button type="button" class="btn-confirm-cancel" (click)="ref.close()">
          {{ 'common.cancel' | t }}
        </button>
        <button
          type="button"
          class="btn-save"
          [disabled]="!selected().size || preparing()"
          (click)="create()"
        >
          {{ (preparing() ? 'cookbook.preparing' : 'cookbook.create') | t }}
        </button>
      </div>
    </div>
  `,
  styles: `
    .styles {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 8px;
      margin: 0 0 14px;
      padding: 0;
      border: 0;
    }
    legend,
    .field-label {
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
    .field-label {
      display: block;
    }
    .field {
      width: 100%;
      margin-bottom: 14px;
    }
    .recipes-head {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      color: var(--text-mid);
      font-size: 13px;
    }
    .link {
      border: 0;
      background: none;
      color: var(--teal);
      font-weight: 700;
      cursor: pointer;
    }
    .recipe-list {
      max-height: 30vh;
      margin: 6px 0 18px;
      padding: 0;
      overflow-y: auto;
      list-style: none;
    }
    .recipe-list label {
      display: flex;
      gap: 10px;
      align-items: center;
      padding: 6px 2px;
      border-bottom: 1px solid var(--border);
      color: var(--text-dark);
      font-size: 14px;
      cursor: pointer;
    }
    .recipe-list input {
      width: 17px;
      height: 17px;
      accent-color: var(--teal);
    }
    .empty {
      color: var(--text-mid);
      font-size: 14px;
    }
    @media (max-width: 420px) {
      .styles {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class CookbookExportDialog {
  protected readonly ref = inject(DialogRef);
  private readonly store = inject(RecipeStore);
  private readonly auth = inject(AuthService);
  private readonly i18n = inject(I18nService);
  private readonly toast = inject(ToastService);

  protected readonly styles = STYLES;
  protected readonly style = signal<CookbookStyle>('classic');
  protected readonly title = signal(this.i18n.t('cookbook.defaultTitle'));
  protected readonly recipes = computed(() =>
    [...this.store.myRecipes()].sort((a, b) => a.name.localeCompare(b.name)),
  );
  protected readonly selected = signal(new Set(this.store.myRecipes().map((r) => r.id)));
  protected readonly allSelected = computed(
    () => this.recipes().length > 0 && this.selected().size === this.recipes().length,
  );
  protected readonly preparing = signal(false);

  protected toggle(id: string): void {
    this.selected.update((set) => {
      const next = new Set(set);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }

  protected toggleAll(): void {
    this.selected.set(
      this.allSelected() ? new Set() : new Set(this.recipes().map((recipe) => recipe.id)),
    );
  }

  protected async create(): Promise<void> {
    this.preparing.set(true);
    try {
      const html = buildCookbookHtml({
        style: this.style(),
        lang: this.i18n.language(),
        title: this.title().trim() || this.i18n.t('cookbook.defaultTitle'),
        author: this.auth.displayName() ?? '',
        recipes: this.recipes().filter((recipe) => this.selected().has(recipe.id)),
        labels: this.labels(),
      });
      await printHtml(html);
    } catch (error) {
      console.error('Cookbook export failed', error);
      this.toast.show(this.i18n.t('cookbook.failed'));
    } finally {
      this.preparing.set(false);
    }
  }

  private labels(): CookbookLabels {
    const t = this.i18n.t;
    return {
      by: t('cookbook.by'),
      contents: t('cookbook.contents'),
      ingredients: t('detail.ingredients'),
      steps: t('detail.steps'),
      notes: t('cookbook.notes'),
      source: t('cookbook.source'),
      serves: (count) => t('cookbook.serves', { count }),
      minutes: (count) => t('cookbook.minutes', { count }),
      recipeCount: (count) => t('cookbook.recipeCount', { count }),
      category: (id) => this.i18n.label('categories', id),
    };
  }
}

/**
 * Opens the print window for a whole HTML document, from a hidden frame, once its fonts and
 * photos have loaded. The frame is removed afterwards.
 */
function printHtml(html: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const frame = document.createElement('iframe');
    frame.setAttribute('aria-hidden', 'true');
    frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
    frame.onload = async () => {
      try {
        const doc = frame.contentDocument!;
        await doc.fonts?.ready;
        await Promise.all(
          [...doc.images].map((img) =>
            img.complete ? null : new Promise((done) => (img.onload = img.onerror = done)),
          ),
        );
        frame.contentWindow!.focus();
        frame.contentWindow!.print();
        resolve();
      } catch (error) {
        reject(error);
      } finally {
        setTimeout(() => frame.remove(), 60_000);
      }
    };
    frame.srcdoc = html;
    document.body.appendChild(frame);
  });
}
