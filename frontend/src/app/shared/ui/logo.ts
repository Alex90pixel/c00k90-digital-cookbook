import { Component, input } from '@angular/core';

let nextGradientId = 0;

/** The C00K90 logo: a steaming pot plus the name, in the colors of the current theme. */
@Component({
  selector: 'app-logo',
  host: { '[class]': '"logo logo-" + size()' },
  template: `
    <svg class="logo-icon" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <defs>
        <linearGradient [attr.id]="gradientId" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style="stop-color: var(--logo-a)" />
          <stop offset="1" style="stop-color: var(--logo-b)" />
        </linearGradient>
      </defs>
      <path
        d="M8 21h24v5a8 8 0 0 1-8 8h-8a8 8 0 0 1-8-8v-5z"
        [attr.fill]="'url(#' + gradientId + ')'"
      />
      <rect x="6" y="18.5" width="28" height="3" rx="1.5" style="fill: var(--logo-rim)" />
      <path
        d="M5 23.5H3M35 23.5h2"
        style="stroke: var(--logo-rim)"
        stroke-width="2.2"
        stroke-linecap="round"
      />
      <path
        d="M13.5 15.5c-1.8-2 1.8-3.8 0-6.5"
        style="stroke: var(--logo-steam)"
        stroke-width="2"
        stroke-linecap="round"
      />
      <path
        d="M20 15.5c-1.8-2.5 1.8-4.5 0-9"
        style="stroke: var(--logo-rim)"
        stroke-width="2"
        stroke-linecap="round"
      />
      <path
        d="M26.5 15.5c-1.8-2 1.8-3.8 0-6.5"
        style="stroke: var(--logo-steam)"
        stroke-width="2"
        stroke-linecap="round"
      />
    </svg>
    <span class="logo-title">
      C<span class="zero">0</span><span class="zero">0</span>K9<span class="zero">0</span>
    </span>
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      gap: 10px;
    }
    :host(.logo-large) {
      flex-direction: column;
      gap: 10px;
    }
    .logo-icon {
      width: 38px;
      height: 38px;
      flex-shrink: 0;
    }
    :host(.logo-large) .logo-icon {
      width: 64px;
      height: 64px;
    }
    .logo-title {
      font-family: 'Playfair Display', serif;
      font-size: 28px;
      font-weight: 700;
      line-height: 1;
      color: var(--magenta-deep);
      font-variant-numeric: lining-nums;
      font-feature-settings: 'lnum' 1;
    }
    :host(.logo-large) .logo-title {
      font-size: 34px;
    }
    /* The zeros get a small dot in the middle, like a plate seen from above. */
    .zero {
      position: relative;
    }
    .zero::after {
      content: '';
      position: absolute;
      left: 50%;
      top: 55%;
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: var(--teal-light);
      transform: translate(-50%, -50%);
    }
  `,
})
export class Logo {
  readonly size = input<'small' | 'large'>('small');
  /** Each logo needs its own gradient id; two SVGs with the same id would share one gradient. */
  protected readonly gradientId = `logo-gradient-${nextGradientId++}`;
}
