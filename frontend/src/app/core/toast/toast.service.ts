import { Injectable, signal } from '@angular/core';

const TOAST_DURATION_MS = 2800;

/** Short messages shown at the bottom of the screen ("🎉 Recipe saved!"). */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly current = signal<string | null>(null);
  private timer: ReturnType<typeof setTimeout> | undefined;

  readonly message = this.current.asReadonly();

  show(message: string): void {
    clearTimeout(this.timer);
    this.current.set(message);
    this.timer = setTimeout(() => this.current.set(null), TOAST_DURATION_MS);
  }
}
