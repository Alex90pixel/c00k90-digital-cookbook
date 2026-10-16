import { Pipe, PipeTransform, inject } from '@angular/core';
import { I18nService } from './i18n.service';
import { TranslationKey, TranslationParams } from './i18n.types';

/**
 * `{{ 'settings.title' | t }}` or `{{ 'toolbar.count' | t: { count: n } }}`.
 * Not pure, so the text follows language changes; the lookup itself is cheap.
 */
@Pipe({ name: 't', pure: false })
export class TranslatePipe implements PipeTransform {
  private readonly i18n = inject(I18nService);

  transform(key: TranslationKey, params?: TranslationParams): string {
    return this.i18n.t(key, params);
  }
}
