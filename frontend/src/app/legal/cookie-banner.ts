import { Component, inject, linkedSignal, signal } from '@angular/core';
import { ConsentService } from '../core/consent/consent.service';

@Component({
  selector: 'app-cookie-banner',
  template: `
    @if (consent.bannerOpen()) {
      <section class="cookie-banner" aria-labelledby="cookie-title">
        <div class="cookie-text">
          <strong id="cookie-title">🍪 Cookies &amp; storage</strong>
          <p>
            We use only the storage needed to keep you signed in. Optional analytics and ads stay
            off unless you allow them (we don't use any yet).
          </p>
          @if (customizing()) {
            <div class="cookie-options">
              <label><input type="checkbox" checked disabled /> Necessary (always on)</label>
              <label>
                <input
                  type="checkbox"
                  [checked]="analytics()"
                  (change)="analytics.set(!analytics())"
                />
                Analytics
              </label>
              <label
                ><input type="checkbox" [checked]="ads()" (change)="ads.set(!ads())" /> Ads</label
              >
            </div>
          }
        </div>
        <div class="cookie-btns">
          <button
            type="button"
            class="btn-save"
            (click)="consent.save({ analytics: false, ads: false })"
          >
            Reject all
          </button>
          @if (customizing()) {
            <button type="button" class="btn-cancel" (click)="saveChoices()">Save choices</button>
          } @else {
            <button type="button" class="btn-cancel" (click)="customizing.set(true)">
              Customize
            </button>
          }
          <button
            type="button"
            class="btn-save"
            (click)="consent.save({ analytics: true, ads: true })"
          >
            Accept all
          </button>
        </div>
      </section>
    }
  `,
  styles: `
    .cookie-banner {
      position: fixed;
      left: 16px;
      right: 16px;
      bottom: 16px;
      z-index: 1000;
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      gap: 16px;
      max-width: 720px;
      margin: 0 auto;
      padding: 18px 20px;
      border: 1px solid var(--border);
      border-radius: 18px;
      background: var(--card);
      box-shadow: var(--banner-shadow);
    }
    .cookie-text {
      flex: 1;
      min-width: 240px;
      color: var(--text-mid);
      font-size: 13px;
      line-height: 1.5;

      strong {
        display: block;
        margin-bottom: 4px;
        color: var(--text-dark);
        font-size: 14px;
      }
      p {
        margin: 0;
      }
    }
    .cookie-options {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-top: 10px;

      label {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
      }
    }
    .cookie-btns {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;

      button {
        padding: 9px 16px;
        font-size: 13px;
      }
    }
  `,
})
export class CookieBanner {
  protected readonly consent = inject(ConsentService);
  protected readonly customizing = signal(false);
  // Start from the saved choice each time the banner opens.
  protected readonly analytics = linkedSignal(() => this.consent.choice()?.analytics ?? false);
  protected readonly ads = linkedSignal(() => this.consent.choice()?.ads ?? false);

  protected saveChoices(): void {
    this.consent.save({ analytics: this.analytics(), ads: this.ads() });
    this.customizing.set(false);
  }
}
