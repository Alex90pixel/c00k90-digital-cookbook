import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, inject } from '@angular/core';
import { TranslatePipe } from '../../core/i18n/translate.pipe';

export interface ConfirmDialogData {
  icon?: string;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  /** "danger" shows a red confirm button (delete, hide...). */
  tone?: 'danger' | 'primary';
}

@Component({
  selector: 'app-confirm-dialog',
  imports: [TranslatePipe],
  template: `
    <div
      class="confirm-dialog"
      role="alertdialog"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-message"
    >
      @if (data.icon) {
        <div class="confirm-icon" aria-hidden="true">{{ data.icon }}</div>
      }
      <h2 id="confirm-title">{{ data.title }}</h2>
      <p id="confirm-message">{{ data.message }}</p>
      <div class="confirm-btns">
        <button type="button" class="btn-confirm-cancel" (click)="ref.close(false)">
          {{ data.cancelLabel ?? ('common.cancel' | t) }}
        </button>
        <button
          type="button"
          [class]="data.tone === 'primary' ? 'btn-save' : 'btn-confirm-delete'"
          (click)="ref.close(true)"
        >
          {{ data.confirmLabel }}
        </button>
      </div>
    </div>
  `,
})
export class ConfirmDialog {
  protected readonly data = inject<ConfirmDialogData>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);
}
