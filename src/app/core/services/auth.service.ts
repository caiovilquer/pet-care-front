import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { LoginDto, TokenDto, CreateRequest } from '../../shared/models/auth.model';
import { TutorCreatedResult } from '../../shared/models/tutor.model';
import { environment } from '../../../environments/environment';

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
  private readonly TOKEN_KEY = 'pet_care_token';
  
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadCurrentUser();
  }

  login(credentials: LoginDto): Observable<TokenDto> {
    return this.http.post<TokenDto>(`${this.API_URL}/auth/login`, credentials)
      .pipe(
        tap(response => {
          this.setToken(response.token);
          this.loadCurrentUser();
        })
      );
  }

  signup(userData: CreateRequest): Observable<TutorCreatedResult> {
    return this.http.post<TutorCreatedResult>(`${this.API_URL}/public/signup`, userData);
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
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
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  private loadCurrentUser(): void {
    const token = this.getToken();
    if (token && this.isAuthenticated()) {
      try {
        const decoded = jwtDecode<JwtPayload>(token);
        this.currentUserSubject.next({
          id: decoded.sub,
          token: token
        });
      } catch {
        this.logout();
      }
    }
  }
}
