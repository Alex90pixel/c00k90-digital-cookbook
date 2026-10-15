import { Injectable, signal } from '@angular/core';
import { STORAGE_KEYS, safeLocalStorage } from '../storage/local-storage';

const CONSENT_VERSION = 1;
const CONSENT_MAX_AGE_DAYS = 180;
const DAY_MS = 86_400_000;

export interface ConsentChoice {
  analytics: boolean;
  ads: boolean;
}

interface SavedConsent extends ConsentChoice {
  version: number;
  /** ISO date of the choice; the banner asks again after 180 days. */
  date: string;
}

/**
 * Cookie / storage consent. Nothing optional runs yet; the choice is stored so optional
 * analytics or ads can respect it if they are ever added.
 */
@Injectable({ providedIn: 'root' })
export class ConsentService {
  private readonly saved = signal<SavedConsent | null>(readSavedConsent());

  readonly choice = this.saved.asReadonly();
  /** The banner shows on the first visit, when the choice expired, or when reopened from the footer. */
  readonly bannerOpen = signal(this.saved() === null);

  has(type: keyof ConsentChoice): boolean {
    return !!this.saved()?.[type];
  }

  save(choice: ConsentChoice): void {
    const consent: SavedConsent = {
      ...choice,
      version: CONSENT_VERSION,
      date: new Date().toISOString(),
    };
    safeLocalStorage.set(STORAGE_KEYS.consent, JSON.stringify(consent));
    this.saved.set(consent);
    this.bannerOpen.set(false);
  }

  openBanner(): void {
    this.bannerOpen.set(true);
  }
}

function readSavedConsent(): SavedConsent | null {
  try {
    const consent = JSON.parse(
      safeLocalStorage.get(STORAGE_KEYS.consent) ?? 'null',
    ) as SavedConsent | null;
    if (!consent || consent.version !== CONSENT_VERSION) return null;
    const ageDays = (Date.now() - new Date(consent.date).getTime()) / DAY_MS;
    return ageDays > CONSENT_MAX_AGE_DAYS ? null : consent;
  } catch {
    return null;
  }
}
