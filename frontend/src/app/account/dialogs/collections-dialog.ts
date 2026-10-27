import { DialogRef } from '@angular/cdk/dialog';
import { Component, inject, signal } from '@angular/core';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { ToastService } from '../../core/toast/toast.service';
import { CollectionsService } from '../../recipes/data/collections.service';
import { MAX_COLLECTION_NAME, nameTaken } from '../../recipes/domain/collections';
import { RecipeCollection } from '../../recipes/models/collection.model';
import { AppDialog } from '../../shared/dialog/app-dialog.service';

/** Settings → My collections: create, rename and delete the user's recipe collections. */
@Component({
  selector: 'app-collections-dialog',
  imports: [TranslatePipe],
  template: `
    <div class="confirm-dialog text-left" role="dialog" aria-labelledby="collections-title">
      <h2 id="collections-title">{{ 'collections.title' | t }}</h2>
      <p>{{ 'collections.hint' | t }}</p>

      <form class="row" (submit)="$event.preventDefault(); create(newName)">
        <input
          #newName
          class="field"
          type="text"
          [maxLength]="maxName"
          [attr.aria-label]="'collections.newPlaceholder' | t"
          [placeholder]="'collections.newPlaceholder' | t"
        />
        <button type="submit" class="btn-save" [disabled]="busy()">
          {{ 'collections.create' | t }}
        </button>
      </form>

      <ul class="lists">
        @for (list of collections.lists(); track list.id) {
          <li>
            @if (editing() === list.id) {
              <form class="row" (submit)="$event.preventDefault(); rename(list, renameInput)">
                <input
                  #renameInput
                  class="field"
                  type="text"
                  [maxLength]="maxName"
                  [value]="list.name"
                  [attr.aria-label]="'collections.rename' | t"
                />
                <button type="submit" class="btn-save" [disabled]="busy()">
                  {{ 'collections.save' | t }}
                </button>
              </form>
            } @else {
              <span class="name">📁 {{ list.name }}</span>
              <span class="count">{{
                'collections.count' | t: { count: list.recipeIds.length }
              }}</span>
              <button
                type="button"
                class="icon"
                [attr.aria-label]="'collections.rename' | t"
                [title]="'collections.rename' | t"
                (click)="editing.set(list.id)"
              >
                ✏️
              </button>
              <button
                type="button"
                class="icon"
                [attr.aria-label]="'collections.delete' | t"
                [title]="'collections.delete' | t"
                (click)="remove(list)"
              >
                🗑️
              </button>
            }
          </li>
        } @empty {
          <li class="empty">{{ 'collections.none' | t }}</li>
        }
      </ul>

      <div class="confirm-btns">
        <button type="button" class="btn-confirm-cancel" (click)="ref.close()">
          {{ 'common.close' | t }}
        </button>
      </div>
    </div>
  `,
  styles: `
    .row {
      display: flex;
      flex: 1;
      gap: 8px;
    }
    .row .field {
      flex: 1;
      min-width: 0;
    }
    form.row {
      margin-bottom: 14px;
    }
    .lists form.row {
      margin: 0;
    }
    .lists {
      max-height: 45vh;
      margin: 0 0 18px;
      padding: 0;
      overflow-y: auto;
      list-style: none;
    }
    .lists li {
      display: flex;
      gap: 8px;
      align-items: center;
      min-height: 48px;
      padding: 4px 2px;
      border-bottom: 1px solid var(--border);
    }
    .name {
      flex: 1;
      color: var(--text-dark);
      font-size: 15px;
      font-weight: 600;
      overflow-wrap: anywhere;
    }
    .count {
      color: var(--text-light);
      font-size: 12px;
      white-space: nowrap;
    }
    .icon {
      padding: 6px;
      border: 0;
      border-radius: 8px;
      background: none;
      font-size: 15px;
      cursor: pointer;
    }
    .icon:hover {
      background: var(--teal-pale);
    }
    .empty {
      color: var(--text-mid);
      font-size: 14px;
    }
  `,
})
export class CollectionsDialog {
  protected readonly ref = inject(DialogRef);
  protected readonly collections = inject(CollectionsService);
  private readonly dialog = inject(AppDialog);
  private readonly i18n = inject(I18nService);
  private readonly toast = inject(ToastService);

  protected readonly maxName = MAX_COLLECTION_NAME;
  protected readonly editing = signal<string | null>(null);
  protected readonly busy = signal(false);

  protected async create(input: HTMLInputElement): Promise<void> {
    if (!input.value.trim()) return;
    if (nameTaken(this.collections.lists(), input.value)) {
      this.toast.show(this.i18n.t('collections.nameTaken'));
      return;
    }
    if (await this.run(() => this.collections.create(input.value))) input.value = '';
  }

  protected async rename(list: RecipeCollection, input: HTMLInputElement): Promise<void> {
    if (!input.value.trim() || input.value.trim() === list.name) {
      this.editing.set(null);
      return;
    }
    if (nameTaken(this.collections.lists(), input.value, list.id)) {
      this.toast.show(this.i18n.t('collections.nameTaken'));
      return;
    }
    if (await this.run(() => this.collections.rename(list.id, input.value))) this.editing.set(null);
  }

  protected async remove(list: RecipeCollection): Promise<void> {
    const t = this.i18n.t;
    const confirmed = await this.dialog.confirm({
      icon: '🗑️',
      title: t('collections.deleteTitle', { name: list.name }),
      message: t('collections.deleteMessage'),
      cancelLabel: t('common.cancel'),
      confirmLabel: t('collections.delete'),
    });
    if (confirmed) await this.run(() => this.collections.remove(list.id));
  }

  private async run(action: () => Promise<unknown>): Promise<boolean> {
    this.busy.set(true);
    try {
      await action();
      return true;
    } catch (error) {
      console.error('Collections update failed', error);
      this.toast.show(this.i18n.t('collections.failed'));
      return false;
    } finally {
      this.busy.set(false);
    }
  }
}
