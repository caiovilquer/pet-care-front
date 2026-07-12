import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DashboardOverview } from '../models/dashboard.model';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let http: HttpTestingController;

  const overview: DashboardOverview = {
    firstName: 'Ana',
    lastName: 'Silva',
    email: 'ana@example.com',
    totalPets: 1,
    totalEvents: 2,
    avatar: undefined,
    pets: [{ id: 1, name: 'Luna', species: 'cat' }],
    upcomingEvents: []
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(DashboardService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('reuses the aggregate response while the cache is valid', async () => {
    const first = firstValueFrom(service.getOverview());
    http.expectOne(`${environment.apiUrl}/dashboard`).flush(overview);
    expect(await first).toEqual(overview);

    expect(await firstValueFrom(service.getOverview())).toEqual(overview);
    http.expectNone(`${environment.apiUrl}/dashboard`);
  });

  it('forces a fresh aggregate request after mutations', async () => {
    const first = firstValueFrom(service.getOverview());
    http.expectOne(`${environment.apiUrl}/dashboard`).flush(overview);
    await first;

    const refreshed = firstValueFrom(service.getOverview(true));
    http.expectOne(`${environment.apiUrl}/dashboard`).flush({ ...overview, totalEvents: 3 });
    expect((await refreshed).totalEvents).toBe(3);
  });
});
