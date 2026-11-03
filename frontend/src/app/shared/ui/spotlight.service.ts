import { DOCUMENT, Injectable, inject } from '@angular/core';

const WAIT_MS = 4000;
const SHOW_MS = 4500;
/** Long enough to read a short tip. */
const SHOW_WITH_TIP_MS = 7000;

/**
 * Points at a place on the screen: scrolls it into view and gives it a soft pulsing ring for a
 * few seconds. Used by the "How to use" guide.
 */
@Injectable({ providedIn: 'root' })
export class Spotlight {
  private readonly document = inject(DOCUMENT);
  private cleanup?: () => void;

  /**
   * Waits for the element (dialogs open lazily), then highlights it, with an optional short tip
   * shown just below it.
   */
  async show(selector: string, tip?: string): Promise<void> {
    this.cleanup?.();
    const element = await this.waitFor(selector);
    if (!element) return;
    // Let a dialog finish opening first, or the scroll is lost.
    await new Promise((resolve) => setTimeout(resolve, 350));
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    element.classList.add('guide-spotlight');

    const bubble = tip ? this.document.createElement('div') : null;
    const place = () => {
      if (!element.isConnected) return this.cleanup?.();
      if (!bubble) return;
      const box = element.getBoundingClientRect();
      const width = Math.min(280, this.document.documentElement.clientWidth - 24);
      const left = Math.min(
        Math.max(12, box.left + box.width / 2 - width / 2),
        this.document.documentElement.clientWidth - width - 12,
      );
      bubble.style.width = `${width}px`;
      bubble.style.left = `${left}px`;
      bubble.style.top = `${box.bottom + 12}px`;
    };
    if (bubble) {
      bubble.className = 'guide-tip';
      bubble.setAttribute('role', 'status');
      bubble.textContent = tip!;
      this.document.body.appendChild(bubble);
    }
    place();
    const watch = setInterval(place, 100);

    const view = this.document.defaultView!;
    // Any key (e.g. Escape), tap or click means the person has moved on.
    const stop = () => this.cleanup?.();
    const timer = setTimeout(stop, tip ? SHOW_WITH_TIP_MS : SHOW_MS);
    view.addEventListener('keydown', stop, true);
    view.addEventListener('pointerdown', stop, true);
    this.cleanup = () => {
      clearTimeout(timer);
      clearInterval(watch);
      bubble?.remove();
      view.removeEventListener('keydown', stop, true);
      view.removeEventListener('pointerdown', stop, true);
      element.classList.remove('guide-spotlight');
      this.cleanup = undefined;
    };
  }

  private waitFor(selector: string): Promise<HTMLElement | null> {
    return new Promise((resolve) => {
      const start = Date.now();
      const look = () => {
        const element = this.document.querySelector<HTMLElement>(selector);
        if (element) resolve(element);
        else if (Date.now() - start > WAIT_MS) resolve(null);
        else setTimeout(look, 100);
      };
      look();
    });
  }
}
