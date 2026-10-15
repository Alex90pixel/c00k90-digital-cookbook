import { CdkMenu, CdkMenuItem, CdkMenuTrigger } from '@angular/cdk/menu';
import { ConnectedPosition } from '@angular/cdk/overlay';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../core/auth/auth.service';
import { ToastService } from '../core/toast/toast.service';
import { FeedbackInboxDialog } from '../moderation/dialogs/feedback-inbox-dialog';
import { ReportsDialog } from '../moderation/dialogs/reports-dialog';
import { ModerationService } from '../moderation/moderation.service';
import { AppDialog } from '../shared/dialog/app-dialog.service';
import { AccountService } from './account.service';
import { FeedbackDialog } from './dialogs/feedback-dialog';
import { ThemeDialog } from './dialogs/theme-dialog';

/** Avatar button with the account menu (and, for the moderator, the inboxes). */
@Component({
  selector: 'app-account-menu',
  imports: [CdkMenuTrigger, CdkMenu, CdkMenuItem],
  template: `
    @if (auth.avatarUrl(); as avatar) {
      <button
        type="button"
        class="avatar-btn"
        aria-label="Account menu"
        [cdkMenuTriggerFor]="menu"
        [cdkMenuPosition]="menuPosition"
      >
        <img class="user-avatar" [src]="avatar" alt="" referrerpolicy="no-referrer" />
        @if (auth.isAdmin() && moderation.openItems()) {
          <span class="report-badge" [attr.aria-label]="moderation.openItems() + ' open items'">{{
            moderation.openItems()
          }}</span>
        }
      </button>
    }

    <ng-template #menu>
      <div class="account-dropdown" cdkMenu>
        @if (auth.isAdmin()) {
          <button
            type="button"
            cdkMenuItem
            class="menu-item"
            (cdkMenuItemTriggered)="open('reports')"
          >
            🚩 Reports{{
              moderation.reports().length ? ' (' + moderation.reports().length + ')' : ''
            }}
          </button>
          <button
            type="button"
            cdkMenuItem
            class="menu-item"
            (cdkMenuItemTriggered)="open('feedbackInbox')"
          >
            💬 Feedback inbox{{
              moderation.feedback().length ? ' (' + moderation.feedback().length + ')' : ''
            }}
          </button>
        }
        <button type="button" cdkMenuItem class="menu-item" (cdkMenuItemTriggered)="open('theme')">
          🎨 Theme
        </button>
        <button
          type="button"
          cdkMenuItem
          class="menu-item"
          (cdkMenuItemTriggered)="open('feedback')"
        >
          💬 Send feedback
        </button>
        <button type="button" cdkMenuItem class="menu-item" (cdkMenuItemTriggered)="exportData()">
          📦 Export my data
        </button>
        <button type="button" cdkMenuItem class="menu-item" (cdkMenuItemTriggered)="signOut()">
          🚪 Sign out
        </button>
        <hr class="dropdown-divider" />
        <button
          type="button"
          cdkMenuItem
          class="menu-item danger"
          (cdkMenuItemTriggered)="deleteAccount()"
        >
          🗑️ Delete account
        </button>
      </div>
    </ng-template>
  `,
  styleUrl: './account-menu.scss',
})
export class AccountMenu {
  protected readonly auth = inject(AuthService);
  protected readonly moderation = inject(ModerationService);
  private readonly account = inject(AccountService);
  private readonly dialog = inject(AppDialog);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  /** Opens below the avatar, aligned to its right edge. */
  protected readonly menuPosition: ConnectedPosition[] = [
    { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 8 },
  ];

  protected open(dialog: 'reports' | 'feedbackInbox' | 'theme' | 'feedback'): void {
    switch (dialog) {
      case 'reports':
        this.dialog.open(ReportsDialog, { width: 'wide' });
        break;
      case 'feedbackInbox':
        this.dialog.open(FeedbackInboxDialog, { width: 'wide' });
        break;
      case 'theme':
        this.dialog.open(ThemeDialog, { width: 'small' });
        break;
      case 'feedback':
        this.dialog.open(FeedbackDialog, { width: 'medium' });
        break;
    }
  }

  protected async exportData(): Promise<void> {
    try {
      await this.account.exportData();
      this.toast.show('📦 Data exported successfully!');
    } catch (error) {
      console.error('Export failed', error);
      this.toast.show('⚠️ Error exporting data');
    }
  }

  protected async signOut(): Promise<void> {
    await this.auth.signOut();
    await this.router.navigateByUrl('/login');
  }

  protected async deleteAccount(): Promise<void> {
    const confirmed = await this.dialog.confirm({
      icon: '⚠️',
      title: 'Delete your account?',
      message:
        'This will permanently delete your account and all your recipes. This cannot be undone.',
      cancelLabel: 'Keep my account',
      confirmLabel: 'Delete everything',
    });
    if (!confirmed) return;
    try {
      await this.account.deleteAccount();
      this.toast.show('Account deleted');
      await this.router.navigateByUrl('/login');
    } catch (error) {
      console.error('Delete account failed', error);
      const code = (error as { code?: string }).code;
      this.toast.show(
        code === 'auth/requires-recent-login'
          ? '⚠️ Please sign out and sign in again, then retry deleting your account'
          : `⚠️ Error deleting account: ${error instanceof Error ? error.message : error}`,
      );
    }
  }
}
