import { DialogRef } from '@angular/cdk/dialog';
import { Component, inject } from '@angular/core';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { ToastService } from '../../core/toast/toast.service';
import { FeedbackMessage, feedbackTypeKey } from '../moderation.model';
import { ModerationService } from '../moderation.service';

/** Moderator inbox for the messages sent with "Send feedback". */
@Component({
  selector: 'app-feedback-inbox-dialog',
  imports: [TranslatePipe],
  template: `
    <div class="confirm-dialog" aria-labelledby="feedback-inbox-title">
      <h2 id="feedback-inbox-title">{{ 'moderation.inboxTitle' | t }}</h2>
      <div class="inbox-list">
        @for (message of moderation.feedback(); track message.id) {
          <article class="inbox-item">
            <strong>{{ typeLabel(message.type) }}</strong>
            <div class="message">{{ message.text }}</div>
            <small>{{ i18n.dateTime(message.createdAt) }}</small>
            <div class="inbox-actions">
              <button type="button" class="btn-action" (click)="markDone(message)">
                {{ 'moderation.done' | t }}
              </button>
            </div>
          </article>
        } @empty {
          <p>{{ 'moderation.noMessages' | t }}</p>
        }
      </div>
      <div class="confirm-btns">
        <button type="button" class="btn-confirm-cancel" (click)="ref.close()">
          {{ 'common.close' | t }}
        </button>
      </div>
    </div>
  `,
})
export class FeedbackInboxDialog {
  protected readonly moderation = inject(ModerationService);
  protected readonly i18n = inject(I18nService);
  private readonly toast = inject(ToastService);
  protected readonly ref = inject(DialogRef);

  constructor() {
    void this.moderation.refresh();
  }

  protected typeLabel(type: string): string {
    const key = feedbackTypeKey(type);
    return key ? this.i18n.t(key) : type;
  }

  protected async markDone(message: FeedbackMessage): Promise<void> {
    try {
      await this.moderation.markFeedbackDone(message.id);
    } catch (error) {
      const text = error instanceof Error ? error.message : String(error);
      this.toast.show(this.i18n.t('moderation.removeFailed', { error: text }));
    }
  }
}
