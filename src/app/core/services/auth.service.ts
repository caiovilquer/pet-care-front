import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, finalize, map, of, shareReplay, tap } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { LoginRequest, SignupRequest, TokenResponse, TutorCreatedResult } from '../models/auth.model';
import { environment } from '../../../environments/environment';
import { HOUSEHOLD_STORAGE_KEY } from '../models/household.model';

interface JwtPayload {
  sub: string;
  exp: number;
  iat: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = environment.apiUrl;
  private accessToken: string | null = null;
  private readonly currentUserSubject = new BehaviorSubject<{ id: string } | null>(null);
  readonly currentUser$ = this.currentUserSubject.asObservable();

  private refreshInFlight$: Observable<TokenResponse> | null = null;

  constructor(private http: HttpClient) {
    // Remove tokens persistidos por versões antigas. O refresh token continua
    // exclusivamente no cookie HttpOnly e o access token vive só em memória.
    localStorage.removeItem('pet_care_token');
  }

  login(credentials: LoginRequest): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(`${this.API_URL}/auth/login`, credentials)
      .pipe(
        tap(response => this.setToken(this.extractAccessToken(response)))
      );
  }

  signup(userData: SignupRequest): Observable<TutorCreatedResult> {
    return this.http.post<TutorCreatedResult>(`${this.API_URL}/public/signup`, userData);
  }

  /** Renova o access token usando o refresh token (cookie HttpOnly). Único voo em andamento é reaproveitado por chamadas concorrentes. */
  refreshToken(): Observable<TokenResponse> {
    if (!this.refreshInFlight$) {
      this.refreshInFlight$ = this.http.post<TokenResponse>(`${this.API_URL}/auth/refresh`, {}).pipe(
        tap(response => this.setToken(this.extractAccessToken(response))),
        finalize(() => this.refreshInFlight$ = null),
        shareReplay(1)
      );
    }
    return this.refreshInFlight$;
  }

  ensureSession(): Observable<boolean> {
    if (this.isAuthenticated()) return of(true);
    return this.refreshToken().pipe(
      map(() => true),
      catchError(() => {
        this.clearSession();
        return of(false);
      })
    );
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.API_URL}/auth/logout`, {})
      .pipe(finalize(() => this.clearSession()));
  }

  logoutAll(): Observable<void> {
    return this.http.post<void>(`${this.API_URL}/auth/logout-all`, {})
      .pipe(finalize(() => this.clearSession()));
  }

  /** Limpa apenas o estado local (sem chamar o backend) — usado após logout/refresh mal sucedido. */
  clearSession(): void {
    this.accessToken = null;
    this.currentUserSubject.next(null);
    localStorage.removeItem(HOUSEHOLD_STORAGE_KEY);
  }

  getToken(): string | null {
    return this.accessToken;
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      return decoded.exp > Date.now() / 1000;
    } catch {
      return false;
    }
  }

  private setToken(token: string): void {
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      this.accessToken = token;
      this.currentUserSubject.next({ id: decoded.sub });
    } catch {
      this.clearSession();
      throw new Error('Token de acesso inválido');
    }
  }

  private extractAccessToken(response: TokenResponse): string {
    return response.access_token ?? response.token;
  }
}
