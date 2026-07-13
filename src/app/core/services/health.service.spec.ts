import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { HealthRecord, HealthRecordRequest } from '../models/health.model';
import { HealthService } from './health.service';

describe('HealthService', () => {
  let service: HealthService;
  let http: HttpTestingController;
  const record: HealthRecord = {
    id: '7ff82f7f-077c-4bf1-a75a-48740d10dfdc', version: 2, petId: 4,
    type: 'EXAM', occurredAt: '2026-07-12T18:00:00Z', title: 'Hemograma',
    createdByTutorId: 1, attachments: []
  };
  const request: HealthRecordRequest = {
    type: 'EXAM', occurredAt: record.occurredAt, title: record.title, notes: null,
    productName: null, dosage: null, batchNumber: null, professionalName: null,
    clinicName: null, costAmount: null, currency: null
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(HealthService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('lists a filtered clinical timeline with bounded pagination', async () => {
    const pending = firstValueFrom(service.listRecords(4, 1, 12, 'EXAM'));
    const call = http.expectOne(req => req.url === `${environment.apiUrl}/pets/4/health-records`);
    expect(call.request.params.get('page')).toBe('1');
    expect(call.request.params.get('size')).toBe('12');
    expect(call.request.params.get('type')).toBe('EXAM');
    call.flush({ items: [record], total: 13, page: 1, size: 12 });
    expect((await pending).items[0].title).toBe('Hemograma');
  });

  it('always sends the optimistic version when updating and deleting', async () => {
    const update = firstValueFrom(service.updateRecord(record, request));
    const updateCall = http.expectOne(`${environment.apiUrl}/health-records/${record.id}`);
    expect(updateCall.request.body.version).toBe(2);
    updateCall.flush({ ...record, version: 3 });
    expect((await update).version).toBe(3);

    const remove = firstValueFrom(service.deleteRecord(record));
    const deleteCall = http.expectOne(req => req.url === `${environment.apiUrl}/health-records/${record.id}`);
    expect(deleteCall.request.params.get('version')).toBe('2');
    deleteCall.flush(null);
    await remove;
  });

  it('requests the private handoff endpoint instead of navigating to it anonymously', async () => {
    const path = '/api/v1/health-attachments/a1/download-url';
    const pending = firstValueFrom(service.attachmentDownloadUrl(path));
    const call = http.expectOne(`${environment.apiUrl.replace(/\/api\/v1\/?$/, '')}${path}`);
    call.flush({ url: 'https://storage.example/signed' });
    expect((await pending).url).toContain('signed');
  });
});
