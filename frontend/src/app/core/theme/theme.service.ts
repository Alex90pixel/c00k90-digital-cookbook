import { DOCUMENT, Injectable, computed, effect, inject, signal } from '@angular/core';
import { STORAGE_KEYS, safeLocalStorage } from '../storage/local-storage';

export type ThemeId = 'forest' | 'sea' | 'rose' | 'sunny';
export type ThemePreference = ThemeId | 'auto';

export interface ThemeOption {
  id: ThemePreference;
  label: string;
  /** CSS background of the preview swatch. */
  swatch: string;
  /** Light swatches need a border to stand out from the dialog. */
  swatchBorder?: string;
}

export const THEME_OPTIONS: readonly ThemeOption[] = [
  {
    id: 'auto',
    label: '🌓 Auto (follows your device)',
    swatch: 'linear-gradient(90deg,#081716 50%,#FBF4DC 50%)',
  },
  { id: 'forest', label: '🌿 Forest', swatch: 'linear-gradient(135deg,#081716 40%,#34C79A)' },
  {
    id: 'sea',
    label: '🌊 Deep Sea',
    swatch: 'linear-gradient(135deg,#071A1E 35%,#2BB3A8 70%,#F07B3F)',
  },
  {
    id: 'rose',
    label: '🌸 Dusty Rose',
    swatch: 'linear-gradient(135deg,#F7ECEC 40%,#B5646D 72%,#1F4D4A)',
    swatchBorder: '#E6D3D5',
  },
  {
    id: 'sunny',
    label: '🍌 Sunny',
    swatch: 'linear-gradient(135deg,#FBF4DC 40%,#9C9D57 70%,#E55D7E)',
    swatchBorder: '#E8DDB0',
  },
];

const LIGHT_THEMES: readonly ThemeId[] = ['rose', 'sunny'];
const PREFERENCES = THEME_OPTIONS.map((o) => o.id);

/**
 * The color theme. "auto" follows the device: Sunny in light mode, Forest in dark mode.
 * `index.html` applies the saved theme before Angular starts, so the page never flashes.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  // matchMedia is missing in some environments (tests, very old browsers): then "auto" means Forest.
  private readonly lightQuery = this.document.defaultView?.matchMedia?.(
    '(prefers-color-scheme: light)',
  );
  private readonly deviceIsLight = signal(this.lightQuery?.matches ?? false);

  readonly preference = signal<ThemePreference>(readSavedPreference());
  readonly theme = computed<ThemeId>(() => {
    const preference = this.preference();
    if (preference !== 'auto') return preference;
    return this.deviceIsLight() ? 'sunny' : 'forest';
  });

  constructor() {
    this.lightQuery?.addEventListener('change', (event) => this.deviceIsLight.set(event.matches));
    effect(() => this.apply(this.theme()));
  }

  setPreference(preference: ThemePreference): void {
    this.preference.set(preference);
    safeLocalStorage.set(STORAGE_KEYS.theme, preference);
  }

  private apply(theme: ThemeId): void {
    const root = this.document.documentElement;
    if (theme === 'forest') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', theme);
    this.document
      .querySelector('meta[name="color-scheme"]')
      ?.setAttribute('content', LIGHT_THEMES.includes(theme) ? 'light' : 'dark');
  }
}

function readSavedPreference(): ThemePreference {
  const saved = safeLocalStorage.get(STORAGE_KEYS.theme) as ThemePreference | null;
  return saved && PREFERENCES.includes(saved) ? saved : 'auto';
}
