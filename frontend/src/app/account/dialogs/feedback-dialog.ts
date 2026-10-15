import { DialogRef } from '@angular/cdk/dialog';
import { Component, inject, signal } from '@angular/core';
import { FormField, form, maxLength } from '@angular/forms/signals';
import { ToastService } from '../../core/toast/toast.service';
import { FEEDBACK_TYPES, FeedbackType } from '../../moderation/moderation.model';
import { ModerationService } from '../../moderation/moderation.service';

@Component({
  selector: 'app-feedback-dialog',
  imports: [FormField],
  template: `
    <div class="confirm-dialog text-left" aria-labelledby="feedback-title">
      <h2 id="feedback-title" class="centered">💬 Send feedback</h2>
      <p class="centered">Thank you for helping make C00K90 better!</p>
      <select class="field" aria-label="Type of feedback" [formField]="feedbackForm.type">
        @for (type of types; track type.id) {
          <option [value]="type.id">{{ type.label }}</option>
        }
      </select>
      <textarea
        class="field"
        rows="5"
        placeholder="What's on your mind?"
        aria-label="Your feedback"
        [formField]="feedbackForm.text"
      ></textarea>
      <div class="confirm-btns">
        <button type="button" class="btn-confirm-cancel" (click)="ref.close()">Cancel</button>
        <button type="button" class="btn-save" [disabled]="sending()" (click)="send()">Send</button>
      </div>
    </div>
  `,
})
export class FeedbackDialog {
  private readonly moderation = inject(ModerationService);
  private readonly toast = inject(ToastService);
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
      this.toast.show('✍️ Please write a few words first');
      return;
    }
    this.sending.set(true);
    try {
      await this.moderation.sendFeedback(type, text);
      this.ref.close();
      this.toast.show('💚 Thank you for your feedback!');
    } catch {
      this.toast.show('⚠️ Could not send feedback');
    } finally {
      this.sending.set(false);
    }
  }
}
