import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

@Injectable({
  providedIn: 'root'
})
export class PasswordResetService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Solicita reset de senha enviando email para o usuário
   */
  requestPasswordReset(email: string): Observable<void> {
    const request: ForgotPasswordRequest = { email };
    return this.http.post<void>(`${this.API_URL}/auth/password/forgot`, request);
  }

  /**
   * Valida se o token de reset é válido
   */
  validateResetToken(token: string): Observable<void> {
    return this.http.get<void>(`${this.API_URL}/auth/password/reset/validate`, {
      params: { token }
    });
  }

  /**
   * Redefine a senha usando o token válido
   */
  resetPassword(token: string, newPassword: string): Observable<void> {
    const request: ResetPasswordRequest = { token, newPassword };
    return this.http.post<void>(`${this.API_URL}/auth/password/reset`, request);
  }
}
