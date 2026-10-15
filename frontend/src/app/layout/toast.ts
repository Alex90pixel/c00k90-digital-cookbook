import { Component, inject } from '@angular/core';
import { ToastService } from '../core/toast/toast.service';

@Component({
  selector: 'app-toast',
  template: `
    <div class="toast-region" role="status" aria-live="polite">
      @if (toast.message(); as message) {
        <div class="toast">{{ message }}</div>
      }
    </div>
  `,
  styles: `
    .toast {
      position: fixed;
      bottom: 30px;
      right: 30px;
      z-index: 1100;
      max-width: 300px;
      padding: 14px 22px;
      border-radius: 14px;
      background: linear-gradient(135deg, var(--magenta-deep), var(--teal-deep));
      color: #fff;
      font-size: 14px;
      font-weight: 600;
      box-shadow: var(--toast-shadow);
      animation: fade-in-up 0.3s ease;
    }
    @media (max-width: 768px) {
      .toast {
        left: 16px;
        right: 16px;
        bottom: 94px;
        max-width: none;
      }
    }
  `,
})
export class Toast {
  protected readonly toast = inject(ToastService);
}
