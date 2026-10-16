import { DialogRef } from '@angular/cdk/dialog';
import { Component, inject } from '@angular/core';
import { I18nService, LANGUAGES } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';

/** Language picker; the whole app switches as soon as an option is clicked. */
@Component({
  selector: 'app-language-dialog',
  imports: [TranslatePipe],
  template: `
    <div class="confirm-dialog" aria-labelledby="language-title">
      <h2 id="language-title">{{ 'language.title' | t }}</h2>
      <p>{{ 'language.intro' | t }}</p>
      <div class="language-options" role="radiogroup" aria-labelledby="language-title">
        @for (option of languages; track option.id) {
          <button
            type="button"
            role="radio"
            class="language-opt"
            [class.active]="i18n.language() === option.id"
            [attr.aria-checked]="i18n.language() === option.id"
            [attr.lang]="option.id"
            (click)="i18n.setLanguage(option.id)"
          >
            <span class="code" aria-hidden="true">{{ option.code }}</span>
            {{ option.label }}
          </button>
        }
      </div>
      <div class="confirm-btns">
        <button type="button" class="btn-save" (click)="ref.close()">
          {{ 'common.done' | t }}
        </button>
      </div>
    </div>
  `,
  styles: `
    .language-options {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 18px;
    }
    .language-opt {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      padding: 14px 12px;
      border: 2px solid var(--border);
      border-radius: 14px;
      background: transparent;
      color: var(--text-dark);
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;

      &.active {
        border-color: var(--teal);
        background: var(--teal-pale);
      }
    }
    .code {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 32px;
      border-radius: 8px;
      background: linear-gradient(135deg, var(--magenta), var(--teal));
      color: #fff;
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 1px;
    }
  `,
})
export class LanguageDialog {
  protected readonly i18n = inject(I18nService);
  protected readonly ref = inject(DialogRef);
  protected readonly languages = LANGUAGES;
}
