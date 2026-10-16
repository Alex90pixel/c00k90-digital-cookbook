import { DialogRef } from '@angular/cdk/dialog';
import { Component, inject } from '@angular/core';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { ToastService } from '../../core/toast/toast.service';
import { RecipeStore } from '../../recipes/data/recipe.store';
import { AppDialog } from '../../shared/dialog/app-dialog.service';
import { RecipeReport, reportReasonKey } from '../moderation.model';
import { ModerationService } from '../moderation.service';

/** Moderator inbox: reported recipes can be hidden from "Get Inspired" or dismissed. */
@Component({
  selector: 'app-reports-dialog',
  imports: [TranslatePipe],
  template: `
    <div class="confirm-dialog" aria-labelledby="reports-title">
      <h2 id="reports-title">{{ 'moderation.reportsTitle' | t }}</h2>
      <div class="inbox-list">
        @for (report of moderation.reports(); track report.id) {
          <article class="inbox-item">
            <strong>{{ report.recipeName || ('moderation.untitled' | t) }}</strong>
            <div>{{ reasonLabel(report.reason) }}</div>
            @if (report.text) {
              <div class="quote">"{{ report.text }}"</div>
            }
            <small>{{ i18n.dateTime(report.createdAt) }}</small>
            <div class="inbox-actions">
              <button type="button" class="btn-action danger" (click)="hideRecipe(report)">
                {{ 'moderation.hideRecipe' | t }}
              </button>
              <button type="button" class="btn-action" (click)="dismiss(report)">
                {{ 'moderation.dismiss' | t }}
              </button>
            </div>
          </article>
        } @empty {
          <p>{{ 'moderation.noReports' | t }}</p>
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
export class ReportsDialog {
  protected readonly moderation = inject(ModerationService);
  protected readonly i18n = inject(I18nService);
  private readonly store = inject(RecipeStore);
  private readonly dialog = inject(AppDialog);
  private readonly toast = inject(ToastService);
  protected readonly ref = inject(DialogRef);

  constructor() {
    void this.moderation.refresh();
  }

  protected reasonLabel(reason: string): string {
    const key = reportReasonKey(reason);
    return key ? this.i18n.t(key) : reason;
  }

  protected async dismiss(report: RecipeReport): Promise<void> {
    try {
      await this.moderation.dismissReport(report.id);
      this.toast.show(this.i18n.t('moderation.dismissed'));
    } catch (error) {
      this.toast.show(this.i18n.t('moderation.dismissFailed', { error: errorText(error) }));
    }
  }

  protected async hideRecipe(report: RecipeReport): Promise<void> {
    const t = this.i18n.t;
    const confirmed = await this.dialog.confirm({
      icon: '🛡️',
      title: t('detail.hideTitle'),
      message: t('detail.hideMessage', { name: report.recipeName || t('detail.thisRecipe') }),
      confirmLabel: t('detail.hideConfirm'),
    });
    if (!confirmed) return;
    try {
      await this.store.hideFromInspired(report.recipeId);
      await this.moderation.dismissReport(report.id);
      this.toast.show(t('moderation.hiddenAndClosed'));
    } catch {
      this.toast.show(t('moderation.hideFailed'));
    }
  }
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
