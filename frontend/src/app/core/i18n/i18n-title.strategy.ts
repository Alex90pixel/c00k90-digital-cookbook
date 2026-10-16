import { Injectable, effect, inject, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { I18nService } from './i18n.service';
import { TranslationKey } from './i18n.types';

/** Route titles are translation keys; the browser tab title follows the language. */
@Injectable({ providedIn: 'root' })
export class I18nTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly i18n = inject(I18nService);
  private readonly key = signal<TranslationKey>('titles.home');

  constructor() {
    super();
    effect(() => this.title.setTitle(this.i18n.t(this.key())));
  }

  override updateTitle(snapshot: RouterStateSnapshot): void {
    this.key.set((this.buildTitle(snapshot) as TranslationKey | undefined) ?? 'titles.home');
  }
}
