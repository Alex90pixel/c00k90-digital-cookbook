import { DialogRef } from '@angular/cdk/dialog';
import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { THEME_OPTIONS, ThemeService } from '../../core/theme/theme.service';
import { ToastService } from '../../core/toast/toast.service';
import { AppDialog } from '../../shared/dialog/app-dialog.service';
import { AccountService } from '../account.service';
import { FeedbackDialog } from '../dialogs/feedback-dialog';
import { LanguageDialog } from '../dialogs/language-dialog';
import { ThemeDialog } from '../dialogs/theme-dialog';

/**
 * App settings and the user's data rights. Theme, language and feedback open on top of this
 * dialog, so closing them comes back here.
 */
@Component({
  selector: 'app-settings-dialog',
  imports: [TranslatePipe],
  templateUrl: './settings-dialog.html',
  styleUrl: './settings-dialog.scss',
})
export class SettingsDialog {
  private readonly theme = inject(ThemeService);
  private readonly account = inject(AccountService);
  private readonly dialog = inject(AppDialog);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  protected readonly i18n = inject(I18nService);
  protected readonly ref = inject(DialogRef);

  protected readonly exporting = signal(false);
  protected readonly deleting = signal(false);
  protected readonly themeKey = computed(
    () => THEME_OPTIONS.find((option) => option.id === this.theme.preference())!.labelKey,
  );

  protected openTheme(): void {
    this.dialog.open(ThemeDialog, { width: 'small' });
  }

  protected openLanguage(): void {
    this.dialog.open(LanguageDialog, { width: 'small' });
  }

  protected openFeedback(): void {
    this.dialog.open(FeedbackDialog, { width: 'medium' });
  }

  protected async exportData(): Promise<void> {
    this.exporting.set(true);
    try {
      await this.account.exportData();
      this.toast.show(this.i18n.t('settings.exported'));
    } catch (error) {
      console.error('Export failed', error);
      this.toast.show(this.i18n.t('settings.exportFailed'));
    } finally {
      this.exporting.set(false);
    }
  }

  protected async deleteAccount(): Promise<void> {
    const t = this.i18n.t;
    const confirmed = await this.dialog.confirm({
      icon: '⚠️',
      title: t('settings.deleteTitle'),
      message: t('settings.deleteMessage'),
      cancelLabel: t('settings.deleteKeep'),
      confirmLabel: t('settings.deleteConfirm'),
    });
    if (!confirmed) return;
    this.deleting.set(true);
    try {
      await this.account.deleteAccount();
      this.dialog.closeAll();
      this.toast.show(t('settings.deleted'));
      await this.router.navigateByUrl('/login');
    } catch (error) {
      const code = (error as { code?: string }).code;
      // Closing the Google popup cancels the deletion; nothing was deleted.
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return;
      console.error('Delete account failed', error);
      this.toast.show(
        code === 'auth/requires-recent-login'
          ? t('settings.recentLoginNeeded')
          : code === 'auth/user-mismatch'
            ? t('settings.wrongAccount')
            : t('settings.deleteFailed', {
                error: error instanceof Error ? error.message : String(error),
              }),
      );
    } finally {
      this.deleting.set(false);
    }
  }
}
