import { DOCUMENT } from '@angular/common';
import { DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs';

/** How often an app left open looks for a new version. */
const CHECK_EVERY_MS = 30 * 60_000;

/**
 * Keeps the installed app (and open tabs) on the latest version. The service worker downloads a
 * new version in the background; it is switched on when the cook comes back to the app (or right
 * away if the app isn't on screen), so a page never reloads under someone's fingers.
 */
@Injectable({ providedIn: 'root' })
export class AppUpdateService {
  private readonly updates = inject(SwUpdate);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private versionReady = false;

  /** Called once at startup; does nothing where the service worker is off (dev server, tests). */
  start(): void {
    if (!this.updates.isEnabled) return;

    this.updates.versionUpdates
      .pipe(
        filter((event): event is VersionReadyEvent => event.type === 'VERSION_READY'),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.versionReady = true;
        if (this.document.visibilityState === 'hidden') this.reload();
      });

    // A broken cached version: start fresh.
    this.updates.unrecoverable
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.reload());

    // Coming back to the app: switch to a version that is ready, or look for a new one.
    const onVisible = () => {
      if (this.document.visibilityState !== 'visible') return;
      if (this.versionReady) this.reload();
      else void this.check();
    };
    this.document.addEventListener('visibilitychange', onVisible);
    const timer = setInterval(() => void this.check(), CHECK_EVERY_MS);
    this.destroyRef.onDestroy(() => {
      this.document.removeEventListener('visibilitychange', onVisible);
      clearInterval(timer);
    });
  }

  private async check(): Promise<void> {
    try {
      await this.updates.checkForUpdate();
    } catch {
      // Offline or the server didn't answer: try again later.
    }
  }

  private reload(): void {
    this.document.location.reload();
  }
}
