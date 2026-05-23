import {
    HttpErrorResponse,
    HttpEvent,
    HttpHandlerFn,
    HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'app/core/auth/services/auth.service';
import { AuthUtils } from 'app/core/auth/auth.utils';
import { Observable, catchError, throwError } from 'rxjs';

let handlingUnauthorized = false;

/**
 * Intercept
 *
 * @param req
 * @param next
 */
export const authInterceptor = (
    req: HttpRequest<unknown>,
    next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // Clone the request object
    let newReq = req.clone();

    // Request
    //
    // If the access token didn't expire, add the Authorization header.
    // We won't add the Authorization header if the access token expired.
    // This will force the server to return a "401 Unauthorized" response
    // for the protected API routes which our response interceptor will
    // catch and delete the access token from the local storage while logging
    // the user out from the app.
    if (
        authService.accessToken &&
        !AuthUtils.isTokenExpired(authService.accessToken)
    ) {
        const skipAuthEndpoints = ['/auth/login', '/auth/register', '/auth/google'];
        const shouldSkipAuth = skipAuthEndpoints.some((endpoint) => req.url.includes(endpoint));

        if (!shouldSkipAuth) {
            newReq = req.clone({
                headers: req.headers.set(
                    'Authorization',
                    'Bearer ' + authService.accessToken
                ),
            });
        }
    }

    // Response
    return next(newReq).pipe(
        catchError((error) => {
            // Catch "401 Unauthorized" responses
            if (error instanceof HttpErrorResponse && error.status === 401) {
                const skip401Handling = [
                    '/auth/login',
                    '/auth/register',
                    '/auth/google',
                    '/auth/logout',
                    '/auth/refresh',
                ];
                const isAuthEndpoint = skip401Handling.some((endpoint) =>
                    req.url.includes(endpoint)
                );

                if (!isAuthEndpoint && !handlingUnauthorized) {
                    handlingUnauthorized = true;
                    authService.clearSession();
                    void router.navigate(['/auth/sign-in']);
                    setTimeout(() => {
                        handlingUnauthorized = false;
                    }, 500);
                }
            }

            return throwError(() => error);
        })
    );
};
