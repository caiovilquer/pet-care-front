import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { VeterinaryReportService } from './veterinary-report.service';

describe('VeterinaryReportService', () => {
  let service: VeterinaryReportService; let http: HttpTestingController;
  beforeEach(() => { TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] }); service = TestBed.inject(VeterinaryReportService); http = TestBed.inject(HttpTestingController); });
  afterEach(() => http.verify());

  it('resolves a public share by POST body so token is never placed in URL', async () => {
    const token = 'a'.repeat(43); const pending = firstValueFrom(service.publicSummary(token));
    const call = http.expectOne(`${environment.apiUrl}/public/veterinary-summary`);
    expect(call.request.method).toBe('POST'); expect(call.request.url.includes(token)).toBeFalse(); expect(call.request.body.token).toBe(token);
    call.flush({ shareId: 's1', label: 'Consulta', expiresAt: '2026-07-13T00:00:00Z', summary: {} });
    expect((await pending).label).toBe('Consulta');
  });

  it('creates minimized shares unless sensitive scopes are explicitly enabled', async () => {
    const request = { petId: 1, label: 'Consulta', from: '2026-01-01', to: '2026-07-12', expiresInHours: 24, includeNotes: false, includeCosts: false, includeDocuments: false };
    const pending = firstValueFrom(service.createShare(request)); const call = http.expectOne(`${environment.apiUrl}/veterinary-shares`);
    expect(call.request.body.includeNotes).toBeFalse(); expect(call.request.body.includeCosts).toBeFalse(); expect(call.request.body.includeDocuments).toBeFalse();
    call.flush({ id: 's1', token: 'secret', expiresAt: '2026-07-13T00:00:00Z' }); expect((await pending).token).toBe('secret');
  });
});
