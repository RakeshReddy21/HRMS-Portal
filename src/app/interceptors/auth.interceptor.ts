import { HttpErrorResponse, HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { AuthService } from "../services/auth.service";
import { catchError, switchMap, throwError } from "rxjs";

let isRefreshing = false;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const token = authService.getAccessToken();

    const isAuthEndpoint = req.url.includes('/auth/login') || req.url.includes('/auth/refresh');

    let modifiedReq = req;
    if (!isAuthEndpoint && token) {
        modifiedReq = req.clone({
            setHeaders: { Authorization: `Bearer ${token}` }
        });
    }

    return next(modifiedReq).pipe(
        catchError((error: HttpErrorResponse) => {
            if (error.status === 401 && !isRefreshing && !isAuthEndpoint && authService.getRefreshToken()) {
                isRefreshing = true;
                return authService.refreshToken().pipe(
                    switchMap(() => {
                        isRefreshing = false;
                        const newToken = authService.getAccessToken();
                        const retryReq = req.clone({
                            setHeaders: { Authorization: `Bearer ${newToken}` }
                        });
                        return next(retryReq);
                    }),
                    catchError((refreshError) => {
                        isRefreshing = false;
                        authService.logout();
                        return throwError(() => refreshError);
                    })
                );
            }
            return throwError(() => error);
        })
    );
};
