import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PasswordResetService } from './password-reset.service';

describe('PasswordResetService', () => {
  let service: PasswordResetService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(PasswordResetService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('preserves an invitation through password recovery', async () => {
    const returnUrl = '/invite?token=household-token';
    const pending = firstValueFrom(service.requestPasswordReset('bia@example.com', returnUrl));

    const request = http.expectOne(`${environment.apiUrl}/auth/password/forgot`);
    expect(request.request.body).toEqual({ email: 'bia@example.com', returnUrl });
    request.flush(null);

    await pending;
  });
});
