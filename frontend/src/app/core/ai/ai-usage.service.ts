import { Injectable, Injector, inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { I18nService } from '../i18n/i18n.service';
import { safeLocalStorage } from '../storage/local-storage';
import { ToastService } from '../toast/toast.service';

/** How much AI one cook can use: plenty for cooking, too little to drain the shared free quota. */
export const AI_LIMITS = { perMinute: 15, perDay: 150 } as const;

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

/** Thrown when a cook has used the AI too much; the cook has already been told, kindly. */
export class AiLimitError extends Error {
  readonly code = 'ai/limit';
  constructor(readonly period: 'minute' | 'day') {
    super(`AI limit reached (${period})`);
  }
}

/** Which limit the next request would break, or null when it may go. */
export function aiLimitHit(times: readonly number[], now: number): 'minute' | 'day' | null {
  if (times.filter((t) => now - t < DAY).length >= AI_LIMITS.perDay) return 'day';
  if (times.filter((t) => now - t < MINUTE).length >= AI_LIMITS.perMinute) return 'minute';
  return null;
}

/**
 * Counts each cook's AI requests on this device and stops them past the limits, with a friendly
 * message. (Google also limits requests per user on its side; this one explains it nicely.)
 */
@Injectable({ providedIn: 'root' })
export class AiUsageService {
  // Looked up only when needed, so services that use the AI don't pull in sign-in on creation.
  private readonly injector = inject(Injector);
  private readonly i18n = inject(I18nService);
  private readonly toast = inject(ToastService);

  /** Call right before each AI request. Throws `AiLimitError` when the cook is over the limit. */
  take(): void {
    const key = `c00k90.aiUsage.${this.injector.get(AuthService).user()?.uid ?? 'guest'}`;
    const now = Date.now();
    let times: number[] = [];
    try {
      const saved: unknown = JSON.parse(safeLocalStorage.get(key) ?? '[]');
      if (Array.isArray(saved)) times = saved.filter((t): t is number => typeof t === 'number');
    } catch {
      // Unreadable: start counting again.
    }
    times = times.filter((t) => now - t < DAY);
    const hit = aiLimitHit(times, now);
    if (hit) {
      this.toast.show(this.i18n.t(hit === 'day' ? 'common.aiLimitDay' : 'common.aiLimitMinute'));
      throw new AiLimitError(hit);
    }
    times.push(now);
    safeLocalStorage.set(key, JSON.stringify(times));
  }
}
