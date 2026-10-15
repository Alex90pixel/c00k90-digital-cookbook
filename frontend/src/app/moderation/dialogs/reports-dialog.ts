import { DialogRef } from '@angular/cdk/dialog';
import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ToastService } from '../../core/toast/toast.service';
import { RecipeStore } from '../../recipes/data/recipe.store';
import { AppDialog } from '../../shared/dialog/app-dialog.service';
import { RecipeReport, reportReasonLabel } from '../moderation.model';
import { ModerationService } from '../moderation.service';

/** Moderator inbox: reported recipes can be hidden from "Get Inspired" or dismissed. */
@Component({
  selector: 'app-reports-dialog',
  imports: [DatePipe],
  template: `
    <div class="confirm-dialog" aria-labelledby="reports-title">
      <h2 id="reports-title">🚩 Reports</h2>
      <div class="inbox-list">
        @for (report of moderation.reports(); track report.id) {
          <article class="inbox-item">
            <strong>{{ report.recipeName || '(untitled recipe)' }}</strong>
            <div>{{ reasonLabel(report.reason) }}</div>
            @if (report.text) {
              <div class="quote">"{{ report.text }}"</div>
            }
            <small>{{ report.createdAt | date: 'medium' }}</small>
            <div class="inbox-actions">
              <button type="button" class="btn-action danger" (click)="hideRecipe(report)">
                🛡️ Hide recipe
              </button>
              <button type="button" class="btn-action" (click)="dismiss(report)">✓ Dismiss</button>
            </div>
          </article>
        } @empty {
          <p>No reports. All clear! 🌿</p>
        }
      </div>
      <div class="confirm-btns">
        <button type="button" class="btn-confirm-cancel" (click)="ref.close()">Close</button>
      </div>
    </div>
  `,
})
export class ReportsDialog {
  protected readonly moderation = inject(ModerationService);
  private readonly store = inject(RecipeStore);
  private readonly dialog = inject(AppDialog);
  private readonly toast = inject(ToastService);
  protected readonly ref = inject(DialogRef);
  protected readonly reasonLabel = reportReasonLabel;

  constructor() {
    void this.moderation.refresh();
  }

  protected async dismiss(report: RecipeReport): Promise<void> {
    try {
      await this.moderation.dismissReport(report.id);
      this.toast.show('✓ Report dismissed');
    } catch (error) {
      this.toast.show(`⚠️ Could not dismiss: ${error instanceof Error ? error.message : error}`);
    }
  }

  protected async hideRecipe(report: RecipeReport): Promise<void> {
    const confirmed = await this.dialog.confirm({
      icon: '🛡️',
      title: 'Hide from Get Inspired?',
      message: `Hide "${report.recipeName || 'this recipe'}" from Get Inspired? The author keeps it privately.`,
      confirmLabel: 'Hide',
    });
    if (!confirmed) return;
    try {
      await this.store.hideFromInspired(report.recipeId);
      await this.moderation.dismissReport(report.id);
      this.toast.show('🛡️ Recipe hidden, report closed');
    } catch {
      this.toast.show('⚠️ Could not hide (maybe already deleted). You can Dismiss the report.');
    }
  }
}
