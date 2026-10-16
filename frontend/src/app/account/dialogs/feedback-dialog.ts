import { DialogRef } from '@angular/cdk/dialog';
import { Component, inject, signal } from '@angular/core';
import { FormField, form, maxLength } from '@angular/forms/signals';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { ToastService } from '../../core/toast/toast.service';
import { FEEDBACK_TYPES, FeedbackType } from '../../moderation/moderation.model';
import { ModerationService } from '../../moderation/moderation.service';

@Component({
  selector: 'app-feedback-dialog',
  imports: [FormField, TranslatePipe],
  template: `
    <div class="confirm-dialog text-left" aria-labelledby="feedback-title">
      <h2 id="feedback-title" class="centered">{{ 'feedback.title' | t }}</h2>
      <p class="centered">{{ 'feedback.intro' | t }}</p>
      <select class="field" [attr.aria-label]="'feedback.type' | t" [formField]="feedbackForm.type">
        @for (type of types; track type.id) {
          <option [value]="type.id">{{ type.labelKey | t }}</option>
        }
      </select>
      <textarea
        class="field"
        rows="5"
        [placeholder]="'feedback.placeholder' | t"
        [attr.aria-label]="'feedback.label' | t"
        [formField]="feedbackForm.text"
      ></textarea>
      <div class="confirm-btns">
        <button type="button" class="btn-confirm-cancel" (click)="ref.close()">
          {{ 'common.cancel' | t }}
        </button>
        <button type="button" class="btn-save" [disabled]="sending()" (click)="send()">
          {{ 'common.send' | t }}
        </button>
      </div>
    </div>
  `,
})
export class FeedbackDialog {
  private readonly moderation = inject(ModerationService);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(I18nService);
  protected readonly ref = inject(DialogRef);

  protected readonly types = FEEDBACK_TYPES;
  protected readonly feedbackForm = form(
    signal({ type: 'bug' as FeedbackType, text: '' }),
    (feedback) => {
      maxLength(feedback.text, 2000);
    },
  );
  protected readonly sending = signal(false);

  protected async send(): Promise<void> {
    const { type, text } = this.feedbackForm().value();
    if (!text.trim()) {
      this.toast.show(this.i18n.t('feedback.empty'));
      return;
    }
    this.sending.set(true);
    try {
      await this.moderation.sendFeedback(type, text);
      this.ref.close();
      this.toast.show(this.i18n.t('feedback.sent'));
    } catch {
      this.toast.show(this.i18n.t('feedback.failed'));
    } finally {
      this.sending.set(false);
    }
  }
}
