import { OVERLAY_DEFAULT_CONFIG } from '@angular/cdk/overlay';
import { provideHttpClient, withFetch } from '@angular/common/http';
import {
  ApplicationConfig,
  ErrorHandler,
  inject,
  isDevMode,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideServiceWorker } from '@angular/service-worker';
import { AppUpdateService } from './core/app-update/app-update.service';
import { StaleChunkErrorHandler } from './core/app-update/stale-chunk';
import { TitleStrategy, provideRouter, withComponentInputBinding } from '@angular/router';
import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { provideFirebase } from './core/firebase/firebase.providers';
import { I18nTitleStrategy } from './core/i18n/i18n-title.strategy';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // After a deploy, an open tab reloads once instead of failing to open a page or dialog.
    { provide: ErrorHandler, useClass: StaleChunkErrorHandler },
    // Installable app (PWA): the service worker keeps the app on the phone and works offline for
    // the parts already loaded. Off on the dev server, so changes always show at once there.
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
    provideAppInitializer(() => inject(AppUpdateService).start()),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withFetch()),
    provideFirebase(environment.firebase),
    { provide: TitleStrategy, useExisting: I18nTitleStrategy },
    // Dialogs and menus go in the CDK overlay container (z-index 1000) instead of the browser's
    // top layer, which would cover everything else, including the toast messages (z-index 1100).
    { provide: OVERLAY_DEFAULT_CONFIG, useValue: { usePopover: false } },
  ],
};
