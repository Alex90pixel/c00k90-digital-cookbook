import { Injectable, inject } from '@angular/core';
import { I18nService } from '../../core/i18n/i18n.service';
import { STORAGE_KEYS, safeLocalStorage } from '../../core/storage/local-storage';
import { AppDialog } from './app-dialog.service';

/**
 * Before the first photo pick, explains that only the chosen photos are uploaded. The answer is
 * remembered (same key as the old app), so the question is asked once per device.
 */
@Injectable({ providedIn: 'root' })
export class PhotoConsent {
  private readonly dialog = inject(AppDialog);
  private readonly i18n = inject(I18nService);

  async ask(): Promise<boolean> {
    if (safeLocalStorage.get(STORAGE_KEYS.photoConsent) === '1') return true;
    const ok = await this.dialog.confirm({
      icon: '📷',
      title: this.i18n.t('photoConsent.title'),
      message: this.i18n.t('photoConsent.message'),
      confirmLabel: this.i18n.t('common.ok'),
      tone: 'primary',
    });
    if (ok) safeLocalStorage.set(STORAGE_KEYS.photoConsent, '1');
    return ok;
  }
}
