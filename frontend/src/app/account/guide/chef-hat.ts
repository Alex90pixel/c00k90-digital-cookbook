import { Component } from '@angular/core';

/** A small drawn chef's hat (there is no chef's hat emoji). */
@Component({
  selector: 'app-chef-hat',
  template: `
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path
        d="M9 19c-3.5 0-6-2.6-6-5.8 0-3.1 2.4-5.6 5.5-5.7C9.6 4.9 12.5 3 16 3s6.4 1.9 7.5 4.5c3.1.1 5.5 2.6 5.5 5.7 0 3.2-2.5 5.8-6 5.8"
        class="puff"
      />
      <path d="M9 17.5h14v7.5a2 2 0 0 1-2 2H11a2 2 0 0 1-2-2v-7.5z" class="band" />
      <path d="M13 20.5v4M16 20.5v4M19 20.5v4" class="pleats" />
    </svg>
  `,
  styles: `
    :host {
      display: inline-block;
      line-height: 0;
    }
    svg {
      width: 100%;
      height: 100%;
    }
    .puff,
    .band {
      fill: #fff;
      stroke: var(--teal-deep);
      stroke-width: 1.8;
      stroke-linejoin: round;
    }
    .pleats {
      stroke: var(--teal-light);
      stroke-width: 1.4;
      stroke-linecap: round;
    }
  `,
})
export class ChefHat {}
