<<<<<<< HEAD
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
=======
import { ApplicationConfig, provideBrowserGlobalErrorListeners, ErrorHandler, Injectable } from '@angular/core';
import { provideRouter, withRouterConfig } from '@angular/router';
>>>>>>> master
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';

<<<<<<< HEAD
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor]))
=======
@Injectable()
class GlobalErrorHandler implements ErrorHandler {
    handleError(error: any): void {
        console.error('[App Error]', error);
    }
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withRouterConfig({ onSameUrlNavigation: 'reload' })),
    provideHttpClient(withInterceptors([authInterceptor])),
    { provide: ErrorHandler, useClass: GlobalErrorHandler }
>>>>>>> master
  ]
};