import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, computed, inject, signal } from '@angular/core';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { ToastService } from '../../core/toast/toast.service';
import { shoppingLine, shoppingListText } from '../domain/shopping-list';
import { ShoppingListData } from '../models/shopping-list.model';

/**
 * The recipe's ingredients as a shopping list: tick what you already have at home, then copy
 * or share (WhatsApp, Notes…) the rest. Nothing is saved.
 */
@Component({
  selector: 'app-shopping-list-dialog',
  imports: [TranslatePipe],
  template: `
    <div class="confirm-dialog text-left" role="dialog" aria-labelledby="shopping-title">
      <h2 id="shopping-title">🛒 {{ 'shopping.title' | t }}</h2>
      <p>{{ 'shopping.hint' | t: { name: data.recipeName, count: data.servings } }}</p>

      <ul class="shopping-list">
        @for (ingredient of data.ingredients; track $index; let i = $index) {
          <li>
            <label [class.have]="have().has(i)">
              <input type="checkbox" [checked]="have().has(i)" (change)="toggle(i)" />
              <span>{{ line(ingredient) }}</span>
            </label>
          </li>
        }
      </ul>

      <div class="confirm-btns">
        <button type="button" class="btn-confirm-cancel" (click)="ref.close()">
          {{ 'common.close' | t }}
        </button>
        <button type="button" class="btn-save" [disabled]="!toBuy().length" (click)="copy()">
          {{ 'shopping.copy' | t }}
        </button>
        @if (canShare) {
          <button type="button" class="btn-save" [disabled]="!toBuy().length" (click)="share()">
            {{ 'shopping.share' | t }}
          </button>
        }
      </div>
    </div>
  `,
  styles: `
    .shopping-list {
      max-height: 50vh;
      margin: 0 0 20px;
      padding: 0;
      overflow-y: auto;
      list-style: none;
    }
    label {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 4px;
      border-bottom: 1px solid var(--border);
      color: var(--text-dark);
      font-size: 14px;
      cursor: pointer;
    }
    label.have span {
      color: var(--text-mid);
      text-decoration: line-through;
    }
    input {
      width: 18px;
      height: 18px;
      accent-color: var(--teal);
    }
  `,
})
export class ShoppingListDialog {
  protected readonly data = inject<ShoppingListData>(DIALOG_DATA);
  protected readonly ref = inject(DialogRef);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(I18nService);

  /** Indexes of the ingredients the user already has at home. */
  protected readonly have = signal(new Set<number>());
  protected readonly toBuy = computed(() =>
    this.data.ingredients.filter((_, i) => !this.have().has(i)),
  );
  /** Phones (and some browsers) can hand the list to another app; elsewhere we copy it. */
  protected readonly canShare = typeof navigator !== 'undefined' && 'share' in navigator;
  protected readonly line = shoppingLine;

  protected toggle(index: number): void {
    this.have.update((set) => {
      const next = new Set(set);
      if (!next.delete(index)) next.add(index);
      return next;
    });
  }

  protected async copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.listText());
      this.toast.show(this.i18n.t('shopping.copied'));
    } catch {
      this.toast.show(this.i18n.t('shopping.failed'));
    }
  }

  protected async share(): Promise<void> {
    try {
      await navigator.share({ title: this.listTitle(), text: this.listText() });
    } catch (error) {
      // Closing the share sheet is not an error worth showing.
      if ((error as Error)?.name !== 'AbortError') this.toast.show(this.i18n.t('shopping.failed'));
    }
  }

  private listTitle(): string {
    return this.i18n.t('shopping.listTitle', {
      name: this.data.recipeName,
      count: this.data.servings,
    });
  }

  private listText(): string {
    return shoppingListText(this.listTitle(), this.toBuy());
  }
}
