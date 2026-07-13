import { HttpRequest, HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { authInterceptor, isApiUrl } from './auth.interceptor';
import { HOUSEHOLD_STORAGE_KEY } from '../models/household.model';

describe('authInterceptor', () => {
  const auth = {
    getToken: () => 'session-secret',
    refreshToken: jasmine.createSpy(),
    clearSession: jasmine.createSpy()
  };

  beforeEach(() => {
    localStorage.removeItem(HOUSEHOLD_STORAGE_KEY);
    TestBed.configureTestingModule({
    providers: [
      { provide: AuthService, useValue: auth },
      { provide: Router, useValue: { url: '/', navigate: jasmine.createSpy() } }
    ]
    });
  });

  it('never sends session credentials to a presigned storage URL', done => {
    const original = new HttpRequest('PUT', 'https://bucket.example/staging/file?X-Amz-Signature=abc', 'image', {
      withCredentials: false
    });

    TestBed.runInInjectionContext(() => authInterceptor(original, request => {
      expect(request.headers.has('Authorization')).toBeFalse();
      expect(request.withCredentials).toBeFalse();
      return of(new HttpResponse({ status: 200 }));
    })).subscribe({ complete: done });
  });

  it('attaches the access token only to this application API', done => {
    localStorage.setItem(HOUSEHOLD_STORAGE_KEY, '00000000-0000-0000-0000-000000000001');
    const original = new HttpRequest('GET', '/api/v1/pets');

    TestBed.runInInjectionContext(() => authInterceptor(original, request => {
      expect(request.headers.get('Authorization')).toBe('Bearer session-secret');
      expect(request.headers.get('X-Household-Id')).toBe('00000000-0000-0000-0000-000000000001');
      expect(request.withCredentials).toBeTrue();
      return of(new HttpResponse({ status: 200 }));
    })).subscribe({ complete: done });
  });

  it('does not mistake a lookalike path for the API', () => {
    expect(isApiUrl('https://evil.example/api/v1/pets')).toBeFalse();
    expect(isApiUrl('/api/v10/pets')).toBeFalse();
  });
});
