import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, inject, signal } from '@angular/core';
import { FormField, form, maxLength } from '@angular/forms/signals';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { ToastService } from '../../core/toast/toast.service';
import { REPORT_REASONS, ReportReason } from '../../moderation/moderation.model';
import { ModerationService } from '../../moderation/moderation.service';
import { Recipe } from '../models/recipe.model';

/** Lets any cook report a shared recipe to the moderator. */
@Component({
  selector: 'app-report-dialog',
  imports: [FormField, TranslatePipe],
  template: `
    <div class="confirm-dialog text-left" aria-labelledby="report-title">
      <h2 id="report-title" class="centered">{{ 'report.title' | t }}</h2>
      <p class="centered">{{ 'report.intro' | t }}</p>
      <select class="field" [attr.aria-label]="'report.reason' | t" [formField]="reportForm.reason">
        @for (reason of reasons; track reason.id) {
          <option [value]="reason.id">{{ reason.labelKey | t }}</option>
        }
      </select>
      <textarea
        class="field"
        rows="3"
        [placeholder]="'report.placeholder' | t"
        [attr.aria-label]="'report.details' | t"
        [formField]="reportForm.text"
      ></textarea>
      <div class="confirm-btns">
        <button type="button" class="btn-confirm-cancel" (click)="ref.close()">
          {{ 'common.cancel' | t }}
        </button>
        <button type="button" class="btn-confirm-delete" [disabled]="sending()" (click)="send()">
          {{ 'report.send' | t }}
        </button>
      </div>
    </div>
  `,
})
export class ReportDialog {
  private readonly recipe = inject<Recipe>(DIALOG_DATA);
  private readonly moderation = inject(ModerationService);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(I18nService);
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
      this.toast.show(this.i18n.t('report.sent'));
    } catch {
      this.toast.show(this.i18n.t('report.failed'));
    } finally {
      this.sending.set(false);
    }
  }
}
