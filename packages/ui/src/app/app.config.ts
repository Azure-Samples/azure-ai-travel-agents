import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withFetch } from '@angular/common/http';
import DOMPurify from 'dompurify';

// sanitize function using an external library
function sanitizeHtml(html: string): string {
  DOMPurify.setConfig();
  return DOMPurify.sanitize(html);
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    // provideClientHydration(withEventReplay()), // seems to cause issues with hydration in some cases on initial app load
    provideHttpClient(withFetch())
  ]
};
