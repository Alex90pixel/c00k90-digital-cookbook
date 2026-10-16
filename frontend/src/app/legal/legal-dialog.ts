import { DialogRef } from '@angular/cdk/dialog';
import { Component, computed, inject } from '@angular/core';
import { I18nService } from '../core/i18n/i18n.service';
import { TranslatePipe } from '../core/i18n/translate.pipe';
import { LEGAL_CONTENT, LegalPart } from './legal-content';

@Component({
  selector: 'app-legal-dialog',
  imports: [TranslatePipe],
  template: `
    <div class="form-modal" aria-labelledby="legal-title">
      <div class="form-header">
        <h2 class="form-title" id="legal-title">{{ 'legal.title' | t }}</h2>
        <button
          type="button"
          class="detail-close"
          [attr.aria-label]="'common.close' | t"
          (click)="ref.close()"
        >
          ✕
        </button>
      </div>
      <div class="form-body legal">
        @for (section of sections(); track section.title) {
          <h3>{{ section.title }}</h3>
          @if (section.updated) {
            <p class="updated">{{ section.updated }}</p>
          }
          @for (paragraph of section.paragraphs; track $index) {
            <p>
              @if (paragraph.label) {
                <strong>{{ paragraph.label }}</strong>
                {{ ' ' }}
              }
              @for (part of paragraph.parts; track $index) {
                @if (isText(part)) {
                  {{ part }}
                } @else if ('strong' in part) {
                  <strong>{{ part.strong }}</strong>
                } @else {
                  <a [href]="'mailto:' + part.email">{{ part.email }}</a>
                }
              }
            </p>
          }
        }
      </div>
    </div>
  `,
  styles: `
    .legal {
      color: var(--text-mid);
      font-size: 14px;
      line-height: 1.7;
    }
    h3 {
      margin: 24px 0 10px;
      color: var(--magenta-deep);
      font-size: 1.17em;
    }
    h3:first-child {
      margin-top: 0;
    }
    p {
      margin: 0 0 14px;
    }
    .updated {
      font-size: 12px;
      font-style: italic;
    }
    a {
      color: var(--teal-light);
    }
  `,
})
export class LegalDialog {
  private readonly i18n = inject(I18nService);
  protected readonly ref = inject(DialogRef);
  protected readonly sections = computed(() => LEGAL_CONTENT[this.i18n.language()]);

  protected isText(part: LegalPart): part is string {
    return typeof part === 'string';
  }
}
