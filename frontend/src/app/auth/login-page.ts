import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../core/auth/auth.service';
import { I18nService } from '../core/i18n/i18n.service';
import { TranslatePipe } from '../core/i18n/translate.pipe';
import { Logo } from '../shared/ui/logo';

@Component({
  selector: 'app-login-page',
  imports: [Logo, TranslatePipe],
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss',
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly i18n = inject(I18nService);

  protected readonly signingIn = signal(false);
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
