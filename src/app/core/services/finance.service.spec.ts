import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Expense } from '../models/finance.model';
import { FinanceService } from './finance.service';

describe('FinanceService', () => {
  let service: FinanceService; let http: HttpTestingController;
  beforeEach(() => { TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] }); service = TestBed.inject(FinanceService); http = TestBed.inject(HttpTestingController); });
  afterEach(() => http.verify());

  it('sends bounded overview filters and optional pet', async () => {
    const pending = firstValueFrom(service.overview('2026-01-01', '2026-07-12', '2026-08-11', 7));
    const call = http.expectOne(req => req.url === `${environment.apiUrl}/finances/overview`);
    expect(call.request.params.get('petId')).toBe('7'); expect(call.request.params.get('forecastTo')).toBe('2026-08-11');
    call.flush({ from: '2026-01-01', to: '2026-07-12', forecastTo: '2026-08-11', realized: [], forecast: [], byCategory: [], monthly: [], upcoming: [], insights: [] });
    expect((await pending).realized).toEqual([]);
  });

  it('includes optimistic version when updating and deleting', async () => {
    const expense = { id: 'e1', version: 3, petId: 7, category: 'FOOD', description: 'Ração', amount: 90, currency: 'BRL', occurredAt: '2026-07-01T12:00:00Z', createdByTutorId: 1 } as Expense;
    const body = { petId: 7, category: 'FOOD' as const, description: 'Ração', amount: 90, currency: 'BRL', occurredAt: expense.occurredAt, notes: null };
    const update = firstValueFrom(service.update(expense, body)); const put = http.expectOne(`${environment.apiUrl}/expenses/e1`); expect(put.request.body.version).toBe(3); put.flush(expense); await update;
    const remove = firstValueFrom(service.delete(expense)); const del = http.expectOne(req => req.url === `${environment.apiUrl}/expenses/e1`); expect(del.request.params.get('version')).toBe('3'); del.flush(null); await remove;
  });
});
