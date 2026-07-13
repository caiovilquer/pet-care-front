import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { HouseholdService } from './household.service';

describe('HouseholdService', () => {
  let service: HouseholdService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(HouseholdService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('sends an owner invitation for shared pet ownership', async () => {
    const pending = firstValueFrom(service.invite('bia@example.com', 'OWNER'));

    const request = http.expectOne(`${environment.apiUrl}/households/current/invitations`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ email: 'bia@example.com', role: 'OWNER' });
    request.flush(null);

    await pending;
  });

  it('previews the invited role without accepting it', async () => {
    const token = 'a'.repeat(43);
    const pending = firstValueFrom(service.invitationPreview(token));

    const request = http.expectOne(`${environment.apiUrl}/households/invitations/preview`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ token });
    request.flush({ householdName: 'Casa da Ana', inviterName: 'Ana', role: 'OWNER', expiresAt: '2026-07-20T12:00:00Z' });

    expect((await pending).role).toBe('OWNER');
  });
});
