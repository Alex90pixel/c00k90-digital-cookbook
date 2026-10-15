import { Component, inject } from '@angular/core';
import { ConsentService } from '../core/consent/consent.service';
import { LegalDialog } from '../legal/legal-dialog';
import { AppDialog } from '../shared/dialog/app-dialog.service';

@Component({
  selector: 'app-footer',
  template: `
    <footer>
      <button type="button" class="link-btn" (click)="openLegal()">
        Privacy Policy &amp; Terms
      </button>
      <span aria-hidden="true">·</span>
      <button type="button" class="link-btn" (click)="consent.openBanner()">Cookie settings</button>
    </footer>
  `,
  styles: `
    footer {
      max-width: 1200px;
      margin: 40px auto 24px;
      padding: 0 24px;
      color: var(--text-light);
      font-size: 12px;
      text-align: center;
    }
    span {
      margin: 0 6px;
    }
    .link-btn {
      border: none;
      background: none;
      color: inherit;
      font-size: 12px;
      text-decoration: underline;
      cursor: pointer;
    }
  `,
})
export class Footer {
  protected readonly consent = inject(ConsentService);
  private readonly dialog = inject(AppDialog);

  protected openLegal(): void {
    this.dialog.open(LegalDialog, { width: 'legal' });
  }
}
