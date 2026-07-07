import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

const isAuthFreeUrl = (url: string): boolean =>
  url.includes('/public/') || url.includes('/auth/login') || url.includes('/auth/refresh');

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  // O refresh token viaja em cookie HttpOnly, então toda chamada precisa enviar credenciais.
  let authReq = req.clone({ withCredentials: true });

  if (token && !isAuthFreeUrl(req.url)) {
    authReq = authReq.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401 || isAuthFreeUrl(req.url)) {
        return throwError(() => error);
      }

      // Sessão de refresh única: chamadas concorrentes reaproveitam a mesma promise/observable.
      return authService.refreshToken().pipe(
        switchMap(() => {
          const retriedReq = authReq.clone({
            setHeaders: {
              Authorization: `Bearer ${authService.getToken()}`
            }
          });
          return next(retriedReq);
        }),
        catchError(() => {
          authService.clearSession();
          return throwError(() => error);
        })
      );
    })
  );
};
