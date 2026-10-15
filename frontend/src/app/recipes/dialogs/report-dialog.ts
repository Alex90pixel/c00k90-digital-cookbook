import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, inject, signal } from '@angular/core';
import { FormField, form, maxLength } from '@angular/forms/signals';
import { ToastService } from '../../core/toast/toast.service';
import { REPORT_REASONS, ReportReason } from '../../moderation/moderation.model';
import { ModerationService } from '../../moderation/moderation.service';
import { Recipe } from '../models/recipe.model';

/** Lets any cook report a shared recipe to the moderator. */
@Component({
  selector: 'app-report-dialog',
  imports: [FormField],
  template: `
    <div class="confirm-dialog text-left" aria-labelledby="report-title">
      <h2 id="report-title" class="centered">🚩 Report this recipe</h2>
      <p class="centered">Thanks for helping keep C00K90 a friendly place.</p>
      <select class="field" aria-label="Reason" [formField]="reportForm.reason">
        @for (reason of reasons; track reason.id) {
          <option [value]="reason.id">{{ reason.label }}</option>
        }
      </select>
      <textarea
        class="field"
        rows="3"
        placeholder="Anything we should know? (optional)"
        aria-label="Details"
        [formField]="reportForm.text"
      ></textarea>
      <div class="confirm-btns">
        <button type="button" class="btn-confirm-cancel" (click)="ref.close()">Cancel</button>
        <button type="button" class="btn-confirm-delete" [disabled]="sending()" (click)="send()">
          Report
        </button>
      </div>
    </div>
  `,
})
export class ReportDialog {
  private readonly recipe = inject<Recipe>(DIALOG_DATA);
  private readonly moderation = inject(ModerationService);
  private readonly toast = inject(ToastService);
  protected readonly ref = inject(DialogRef);

  protected readonly reasons = REPORT_REASONS;
  protected readonly reportForm = form(
    signal({ reason: 'inappropriate-photo' as ReportReason, text: '' }),
    (report) => {
      maxLength(report.text, 500);
    },
  );
  protected readonly sending = signal(false);

  protected async send(): Promise<void> {
    this.sending.set(true);
    try {
      const { reason, text } = this.reportForm().value();
      await this.moderation.sendReport(this.recipe, reason, text);
      this.ref.close();
      this.toast.show('🚩 Thank you, we will take a look.');
    } catch {
      this.toast.show('⚠️ Could not send report');
    } finally {
      this.sending.set(false);
    }
  }
}
