import { NgTemplateOutlet } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../core/auth/auth.service';
import { I18nService } from '../core/i18n/i18n.service';
import { TranslationKey } from '../core/i18n/i18n.types';
import { TranslatePipe } from '../core/i18n/translate.pipe';
import { Logo } from '../shared/ui/logo';

interface Feature {
  id: string;
  emoji: string;
  title: TranslationKey;
  text: TranslationKey;
}

const FEATURES: readonly Feature[] = [
  { id: 'notebook', emoji: '📷', title: 'landing.f1Title', text: 'landing.f1Text' },
  { id: 'cook', emoji: '👩‍🍳', title: 'landing.f2Title', text: 'landing.f2Text' },
  { id: 'ideas', emoji: '✨', title: 'landing.f3Title', text: 'landing.f3Text' },
  { id: 'allergens', emoji: '🌾', title: 'landing.f4Title', text: 'landing.f4Text' },
  { id: 'plan', emoji: '📅', title: 'landing.f5Title', text: 'landing.f5Text' },
  { id: 'book', emoji: '📖', title: 'landing.f6Title', text: 'landing.f6Text' },
];

/**
 * The page people see before signing in: what C00K90 does, a small preview of a recipe and the
 * "Sign in with Google" button, once, at eye level. It fits on one screen on a computer.
 */
@Component({
  selector: 'app-login-page',
  imports: [Logo, TranslatePipe, NgTemplateOutlet],
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss',
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly i18n = inject(I18nService);

  protected readonly features = FEATURES;
  protected readonly signingIn = signal(false);
  /** The preview dish photo (public/landing-dish.jpg); an emoji if it is missing. */
  protected readonly photoOk = signal(true);
  protected readonly error = signal('');

  protected async signInWithGoogle(): Promise<void> {
    this.signingIn.set(true);
    this.error.set('');
    try {
      await this.auth.signInWithGoogle();
      await this.router.navigateByUrl('/');
    } catch (error) {
      const code = (error as { code?: string }).code;
      // Closing the Google window is not an error worth showing.
      if (code !== 'auth/popup-closed-by-user' && code !== 'auth/cancelled-popup-request') {
        this.error.set(this.i18n.t('auth.failed'));
      }
    } finally {
      this.signingIn.set(false);
    }
  }
}
