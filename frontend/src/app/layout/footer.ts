import { Component, inject } from '@angular/core';
import { ConsentService } from '../core/consent/consent.service';
import { TranslatePipe } from '../core/i18n/translate.pipe';
import { LegalDialog } from '../legal/legal-dialog';
import { AppDialog } from '../shared/dialog/app-dialog.service';

/** Decorative ingredients that bob gently above the footer text. */
const INGREDIENTS = ['🥕', '🍅', '🧄', '🍋', '🌿', '🧀'];

@Component({
  selector: 'app-footer',
  imports: [TranslatePipe],
  template: `
    <footer class="footer">
      <svg class="wave" viewBox="0 0 1440 48" preserveAspectRatio="none" aria-hidden="true">
        <path
          d="M0 24c120 16 240 24 360 16S600 8 720 8s240 24 360 24 240-16 360-24v40H0z"
          class="wave-fill"
        />
      </svg>

      <div class="footer-inner">
        <div class="ingredients" aria-hidden="true">
          @for (ingredient of ingredients; track ingredient; let i = $index) {
            <span class="ingredient" [style.animation-delay.s]="i * 0.35">{{ ingredient }}</span>
          }
        </div>

        <p class="tagline">{{ 'footer.tagline' | t }}</p>

        <nav class="footer-links" [attr.aria-label]="'footer.label' | t">
          <button type="button" class="footer-link" (click)="openLegal()">
            <span aria-hidden="true">🔒</span> {{ 'footer.legal' | t }}
          </button>
          <span class="dot" aria-hidden="true">·</span>
          <button type="button" class="footer-link" (click)="consent.openBanner()">
            <span aria-hidden="true">🍪</span> {{ 'footer.cookies' | t }}
          </button>
        </nav>

        <p class="copyright">{{ 'footer.copyright' | t: { year: year } }}</p>
      </div>
    </footer>
  `,
  styles: `
    .footer {
      position: relative;
      margin-top: 56px;
      color: var(--text-light);
      text-align: center;
    }

    // The wavy top edge, drawn in the footer's own color so it blends in.
    .wave {
      display: block;
      width: 100%;
      height: 40px;
      margin-bottom: -1px;
    }
    .wave-fill {
      fill: var(--card);
    }

    .footer-inner {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 8px 24px 28px;
      border-bottom: 3px solid transparent;
      border-image: linear-gradient(90deg, var(--magenta), var(--teal)) 1;
      background: var(--card);
    }

    .ingredients {
      display: flex;
      gap: 14px;
      font-size: 22px;
    }
    .ingredient {
      display: inline-block;
      animation: bob 3s ease-in-out infinite;
    }

    .tagline {
      margin: 0;
      color: var(--magenta-deep);
      font-family: 'Playfair Display', serif;
      font-size: 17px;
      font-style: italic;
    }

    .footer-links {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .footer-link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 7px 16px;
      border: 1.5px solid var(--border);
      border-radius: 50px;
      background: var(--card-soft);
      color: var(--text-mid);
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;

      &:hover,
      &:focus-visible {
        outline: none;
        border-color: var(--teal-light);
        background: var(--teal-pale);
        color: var(--teal-deep);
        transform: translateY(-1px);
      }
    }
    .dot {
      color: var(--border-mag);
      font-size: 18px;
    }

    .copyright {
      margin: 0;
      font-size: 11px;
      letter-spacing: 0.5px;
    }

    @keyframes bob {
      0%,
      100% {
        transform: translateY(0) rotate(0deg);
      }
      50% {
        transform: translateY(-5px) rotate(-6deg);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .ingredient {
        animation: none;
      }
    }

    // On phones, leave room for the round "+" button so it never covers the links.
    @media (max-width: 768px) {
      .footer-inner {
        padding-bottom: 96px;
      }
      .dot {
        display: none;
      }
    }
  `,
})
export class Footer {
  protected readonly consent = inject(ConsentService);
  private readonly dialog = inject(AppDialog);
  protected readonly ingredients = INGREDIENTS;
  protected readonly year = new Date().getFullYear();

  protected openLegal(): void {
    this.dialog.open(LegalDialog, { width: 'legal' });
  }
}
