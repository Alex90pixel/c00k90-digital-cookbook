import { Component, effect, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth/auth.service';
import { I18nService } from './core/i18n/i18n.service';
import { ThemeService } from './core/theme/theme.service';
import { CookieBanner } from './legal/cookie-banner';
import { Footer } from './layout/footer';
import { Toast } from './layout/toast';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Footer, Toast, CookieBanner],
  template: `
    <div class="app-main">
      <router-outlet />
    </div>
    <app-footer />
    <app-toast />
    <app-cookie-banner />
  `,
  // Sticky footer: the page fills at least the whole window, and the content area grows, so the
  // footer sits at the bottom on short pages and simply follows the content on long ones.
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      min-height: 100dvh;
    }
    .app-main {
      display: flex;
      flex: 1;
      flex-direction: column;
    }
  `,
})
export class App {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  constructor() {
    // Starts the theme (it follows the device in "auto" mode) and sets <html lang>.
    inject(ThemeService);
    inject(I18nService);

    // Signed out elsewhere (another tab, expired session): back to the login page.
    let wasSignedIn = false;
    effect(() => {
      const signedIn = this.auth.isSignedIn();
      if (wasSignedIn && !signedIn) void this.router.navigateByUrl('/login');
      wasSignedIn = signedIn;
    });
  }
}
