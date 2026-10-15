import { Component, effect, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth/auth.service';
import { ThemeService } from './core/theme/theme.service';
import { CookieBanner } from './legal/cookie-banner';
import { Footer } from './layout/footer';
import { Toast } from './layout/toast';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Footer, Toast, CookieBanner],
  template: `
    <router-outlet />
    <app-footer />
    <app-toast />
    <app-cookie-banner />
  `,
})
export class App {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  constructor() {
    // Starts the theme (it follows the device in "auto" mode).
    inject(ThemeService);

    // Signed out elsewhere (another tab, expired session): back to the login page.
    let wasSignedIn = false;
    effect(() => {
      const signedIn = this.auth.isSignedIn();
      if (wasSignedIn && !signedIn) void this.router.navigateByUrl('/login');
      wasSignedIn = signedIn;
    });
  }
}
