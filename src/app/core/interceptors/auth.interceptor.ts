import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { HOUSEHOLD_STORAGE_KEY } from '../models/household.model';

const isAuthFreeUrl = (url: string): boolean =>
  url.includes('/public/') ||
  url.includes('/auth/login') ||
  url.includes('/auth/refresh') ||
  url.includes('/auth/password/');

export const isApiUrl = (url: string): boolean => {
  const origin = globalThis.location?.origin ?? 'http://localhost';
  const requestUrl = new URL(url, origin);
  const apiUrl = new URL(environment.apiUrl, origin);
  const apiPath = apiUrl.pathname.replace(/\/$/, '');
  return requestUrl.origin === apiUrl.origin &&
    (requestUrl.pathname === apiPath || requestUrl.pathname.startsWith(`${apiPath}/`));
};

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();

  // Tokens e cookies só podem seguir para a API. URLs pré-assinadas apontam para outro domínio.
  const targetsApi = isApiUrl(req.url);
  let authReq = targetsApi ? req.clone({ withCredentials: true }) : req;

  if (targetsApi && token && !isAuthFreeUrl(req.url)) {
    let householdId: string | null = null;
    try { householdId = localStorage.getItem(HOUSEHOLD_STORAGE_KEY); } catch { /* armazenamento indisponível */ }
    authReq = authReq.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
        ...(householdId ? { 'X-Household-Id': householdId } : {})
      }
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (!targetsApi || error.status !== 401 || isAuthFreeUrl(req.url)) {
        return throwError(() => error);
      }

      // Sessão de refresh única: chamadas concorrentes reaproveitam a mesma promise/observable.
      return authService.refreshToken().pipe(
        switchMap(() => {
          const refreshedToken = authService.getToken();
          if (!refreshedToken) return throwError(() => error);
          const retriedReq = authReq.clone({
            setHeaders: {
              Authorization: `Bearer ${refreshedToken}`
            }
          });
          return next(retriedReq);
        }),
        catchError(() => {
          authService.clearSession();
          void router.navigate(['/auth/login'], { queryParams: { returnUrl: router.url } });
          return throwError(() => error);
        })
      );
    })
  );
};
