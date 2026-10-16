/**
 * localStorage that never throws: storage can be unavailable (private mode, blocked site data),
 * and the app must keep working without it.
 */
export const safeLocalStorage = {
  get(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Not saved; the app keeps the value in memory for this visit.
    }
  },
};

/** Keys shared with the old app, so preferences carry over between the two. */
export const STORAGE_KEYS = {
  theme: 'c00k90-theme',
  consent: 'c00k90-consent',
  photoConsent: 'c00k90-photo-ok',
  /** New-app only: the old app is English-only. */
  language: 'c00k90-lang',
} as const;
