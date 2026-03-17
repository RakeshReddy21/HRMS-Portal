import { ApplicationConfig, provideBrowserGlobalErrorListeners, ErrorHandler, Injectable } from '@angular/core';
import { provideRouter, withRouterConfig, withViewTransitions } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';

@Injectable()
class GlobalErrorHandler implements ErrorHandler {
    handleError(error: any): void {
        console.error('[App Error]', error);
    }
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withRouterConfig({ onSameUrlNavigation: 'reload' }),
      withViewTransitions({ skipInitialTransition: true })
    ),
    provideHttpClient(withInterceptors([authInterceptor])),
    { provide: ErrorHandler, useClass: GlobalErrorHandler }
  ]
};
