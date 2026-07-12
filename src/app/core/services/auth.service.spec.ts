import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.setItem('pet_care_token', 'legacy-token');
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('removes a legacy persisted token and starts anonymous', () => {
    expect(localStorage.getItem('pet_care_token')).toBeNull();
    expect(service.getToken()).toBeNull();
    expect(service.isAuthenticated()).toBeFalse();
  });

  it('keeps a successful access token only in memory', async () => {
    const result = firstValueFrom(service.login({ email: 'ana@example.com', password: 'password123' }));
    const request = http.expectOne(`${environment.apiUrl}/auth/login`);
    expect(request.request.method).toBe('POST');
    request.flush({ token: validToken('42') });
    await result;

    expect(service.isAuthenticated()).toBeTrue();
    expect(service.getToken()).toContain('.');
    expect(localStorage.getItem('pet_care_token')).toBeNull();
  });

  it('restores a session through the HttpOnly refresh cookie flow', async () => {
    const result = firstValueFrom(service.ensureSession());
    const request = http.expectOne(`${environment.apiUrl}/auth/refresh`);
    request.flush({ token: validToken('7') });

    expect(await result).toBeTrue();
    expect(service.isAuthenticated()).toBeTrue();
  });

  it('returns false and clears state when refresh is rejected', async () => {
    const result = firstValueFrom(service.ensureSession());
    http.expectOne(`${environment.apiUrl}/auth/refresh`).flush(
      { message: 'expired' },
      { status: 401, statusText: 'Unauthorized' }
    );

    expect(await result).toBeFalse();
    expect(service.getToken()).toBeNull();
  });

  function validToken(subject: string): string {
    const encode = (value: object) => btoa(JSON.stringify(value))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
    return `${encode({ alg: 'none', typ: 'JWT' })}.${encode({ sub: subject, iat: 1, exp: 4_102_444_800 })}.signature`;
  }
});
