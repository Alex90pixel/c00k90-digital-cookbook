import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, computed, inject, signal } from '@angular/core';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { ToastService } from '../../core/toast/toast.service';
import { CollectionsService } from '../data/collections.service';
import { MAX_COLLECTION_NAME, nameTaken } from '../domain/collections';

/** "Add to collection": tick the collections this recipe belongs to, or start a new one. */
@Component({
  selector: 'app-add-to-collection-dialog',
  imports: [TranslatePipe],
  template: `
    <div class="confirm-dialog text-left" role="dialog" aria-labelledby="add-collection-title">
      <h2 id="add-collection-title">{{ 'collections.addTitle' | t }}</h2>

      @if (lists().length) {
        <ul class="choices">
          @for (list of lists(); track list.id) {
            <li>
              <label>
                <input
                  type="checkbox"
                  [checked]="selected().has(list.id)"
                  [disabled]="busy()"
                  (change)="toggle(list.id)"
                />
                <span>📁 {{ list.name }}</span>
              </label>
            </li>
          }
        </ul>
      } @else {
        <p>{{ 'collections.none' | t }}</p>
      }

      <form class="new-row" (submit)="$event.preventDefault(); createAndAdd(newName)">
        <input
          #newName
          class="field"
          type="text"
          [maxLength]="maxName"
          [attr.aria-label]="'collections.newPlaceholder' | t"
          [placeholder]="'collections.newPlaceholder' | t"
        />
        <button type="submit" class="btn-confirm-cancel" [disabled]="busy()">
          {{ 'collections.create' | t }}
        </button>
      </form>

      <div class="confirm-btns">
        <button type="button" class="btn-save" (click)="ref.close()">
          {{ 'common.done' | t }}
        </button>
      </div>
    </div>
  `,
  styles: `
    .choices {
      max-height: 40vh;
      margin: 0 0 14px;
      padding: 0;
      overflow-y: auto;
      list-style: none;
    }
    .choices label {
      display: flex;
      gap: 10px;
      align-items: center;
      padding: 9px 2px;
      border-bottom: 1px solid var(--border);
      color: var(--text-dark);
      font-size: 15px;
      cursor: pointer;
    }
    .choices input {
      width: 18px;
      height: 18px;
      accent-color: var(--teal);
    }
    .new-row {
      display: flex;
      gap: 8px;
      margin-bottom: 18px;
    }
    .new-row .field {
      flex: 1;
      min-width: 0;
    }
  `,
})
export class AddToCollectionDialog {
  private readonly recipeId = inject<string>(DIALOG_DATA);
  protected readonly ref = inject(DialogRef);
  private readonly collections = inject(CollectionsService);
  private readonly i18n = inject(I18nService);
  private readonly toast = inject(ToastService);

  protected readonly maxName = MAX_COLLECTION_NAME;
  protected readonly lists = this.collections.lists;
  protected readonly selected = computed(() => {
    this.lists();
    return this.collections.collectionsOf(this.recipeId);
  });
  protected readonly busy = signal(false);

  protected async toggle(id: string): Promise<void> {
    await this.run(() => this.collections.toggle(id, this.recipeId));
  }

  protected async createAndAdd(input: HTMLInputElement): Promise<void> {
    if (!input.value.trim()) return;
    if (nameTaken(this.lists(), input.value)) {
      this.toast.show(this.i18n.t('collections.nameTaken'));
      return;
    }
    await this.run(async () => {
      const list = await this.collections.create(input.value);
      if (list) await this.collections.toggle(list.id, this.recipeId);
      input.value = '';
    });
  }

  private async run(action: () => Promise<void>): Promise<void> {
    this.busy.set(true);
    try {
      await action();
    } catch (error) {
      console.error('Collections update failed', error);
      this.toast.show(this.i18n.t('collections.failed'));
    } finally {
      this.busy.set(false);
    }
  }
}
