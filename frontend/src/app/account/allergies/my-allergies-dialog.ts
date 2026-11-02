import { DialogRef } from '@angular/cdk/dialog';
import { Component, inject, signal } from '@angular/core';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { ToastService } from '../../core/toast/toast.service';
import { ALLERGEN_IDS } from '../../recipes/models/recipe.constants';
import { AllergenId } from '../../recipes/models/recipe.model';
import { MyAllergiesService } from './my-allergies.service';

/** Settings → My allergies: pick the allergens to be warned about. */
@Component({
  selector: 'app-my-allergies-dialog',
  imports: [TranslatePipe],
  template: `
    <div class="confirm-dialog text-left" aria-labelledby="my-allergies-title">
      <h2 id="my-allergies-title">{{ 'myAllergies.title' | t }}</h2>
      <p>{{ 'myAllergies.intro' | t }}</p>
      <div class="chips">
        @for (id of allergenIds; track id) {
          <button
            type="button"
            class="chip"
            [class.on]="picked().includes(id)"
            [attr.aria-pressed]="picked().includes(id)"
            (click)="toggle(id)"
          >
            {{ i18n.label('allergens', id) }}
          </button>
        }
      </div>
      <p class="note">{{ 'myAllergies.note' | t }}</p>
      <div class="confirm-btns">
        <button type="button" class="btn-confirm-cancel" (click)="ref.close()">
          {{ 'common.cancel' | t }}
        </button>
        <button type="button" class="btn-save" [disabled]="saving()" (click)="save()">
          {{ 'myAllergies.save' | t }}
        </button>
      </div>
    </div>
  `,
  styles: `
    .chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin: 14px 0;
    }
    .chip {
      padding: 6px 12px;
      border: 1.5px solid var(--border);
      border-radius: 50px;
      background: transparent;
      color: var(--text-mid);
      font-size: 13px;
      cursor: pointer;

      &.on {
        border-color: var(--magenta-deep);
        background: var(--magenta-pale);
        color: var(--magenta-deep);
        font-weight: 600;
      }
    }
    .note {
      color: var(--text-light);
      font-size: 12px;
    }
  `,
})
export class MyAllergiesDialog {
  private readonly myAllergies = inject(MyAllergiesService);
  private readonly toast = inject(ToastService);
  protected readonly i18n = inject(I18nService);
  protected readonly ref = inject(DialogRef);
  protected readonly allergenIds = ALLERGEN_IDS;
  protected readonly picked = signal<readonly AllergenId[]>(this.myAllergies.allergies());
  protected readonly saving = signal(false);

  protected toggle(id: AllergenId): void {
    this.picked.update((list) =>
      list.includes(id) ? list.filter((a) => a !== id) : [...list, id],
    );
  }

  protected async save(): Promise<void> {
    this.saving.set(true);
    try {
      await this.myAllergies.save(this.picked());
      this.toast.show(this.i18n.t('myAllergies.saved'));
      this.ref.close();
    } catch (error) {
      console.error('Could not save my allergies', error);
      this.toast.show(this.i18n.t('myAllergies.saveFailed'));
    } finally {
      this.saving.set(false);
    }
  }
}
