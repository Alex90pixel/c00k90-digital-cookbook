import { OVERLAY_DEFAULT_CONFIG } from '@angular/cdk/overlay';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { TitleStrategy, provideRouter, withComponentInputBinding } from '@angular/router';
import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { provideFirebase } from './core/firebase/firebase.providers';
import { I18nTitleStrategy } from './core/i18n/i18n-title.strategy';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withFetch()),
    provideFirebase(environment.firebase),
    { provide: TitleStrategy, useExisting: I18nTitleStrategy },
    // Dialogs and menus go in the CDK overlay container (z-index 1000) instead of the browser's
    // top layer, which would cover everything else, including the toast messages (z-index 1100).
    { provide: OVERLAY_DEFAULT_CONFIG, useValue: { usePopover: false } },
  ],
};
