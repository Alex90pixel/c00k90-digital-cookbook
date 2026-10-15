import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../core/auth/auth.service';
import { Logo } from '../shared/ui/logo';

@Component({
  selector: 'app-login-page',
  imports: [Logo],
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss',
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

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
        this.error.set('⚠️ Sign in failed. Please try again.');
      }
    } finally {
      this.signingIn.set(false);
    }
  }
}
