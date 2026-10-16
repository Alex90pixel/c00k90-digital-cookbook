import { DialogRef } from '@angular/cdk/dialog';
import { Component, inject } from '@angular/core';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { THEME_OPTIONS, ThemeService } from '../../core/theme/theme.service';

/** Theme picker; the theme changes as soon as an option is clicked. */
@Component({
  selector: 'app-theme-dialog',
  imports: [TranslatePipe],
  template: `
    <div class="confirm-dialog" aria-labelledby="theme-title">
      <h2 id="theme-title">{{ 'theme.title' | t }}</h2>
      <p>{{ 'theme.intro' | t }}</p>
      <div class="theme-options" role="radiogroup" aria-labelledby="theme-title">
        @for (option of options; track option.id) {
          <button
            type="button"
            role="radio"
            class="theme-opt"
            [class.wide]="option.id === 'auto'"
            [class.active]="theme.preference() === option.id"
            [attr.aria-checked]="theme.preference() === option.id"
            (click)="theme.setPreference(option.id)"
          >
            <span
              class="swatch"
              [style.background]="option.swatch"
              [style.border]="option.swatchBorder ? '1px solid ' + option.swatchBorder : null"
            ></span>
            {{ option.labelKey | t }}
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
    .theme-options {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 18px;
    }
    .theme-opt {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 12px;
      border: 2px solid var(--border);
      border-radius: 14px;
      background: transparent;
      color: var(--text-dark);
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;

      &.wide {
        grid-column: 1 / -1;
      }
      &.active {
        border-color: var(--teal);
      }
    }
    .swatch {
      width: 100%;
      height: 36px;
      border-radius: 8px;
    }
  `,
})
export class ThemeDialog {
  protected readonly theme = inject(ThemeService);
  protected readonly ref = inject(DialogRef);
  protected readonly options = THEME_OPTIONS;
}
