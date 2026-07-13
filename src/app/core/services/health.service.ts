import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  HealthMeasurement,
  HealthMeasurementRequest,
  HealthMeasurementType,
  HealthRecord,
  HealthRecordRequest,
  HealthRecordType,
  HealthRecordsPage
} from '../models/health.model';

@Injectable({ providedIn: 'root' })
export class HealthService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  listRecords(petId: number, page = 0, size = 20, type?: HealthRecordType): Observable<HealthRecordsPage> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (type) params = params.set('type', type);
    return this.http.get<HealthRecordsPage>(`${this.apiUrl}/pets/${petId}/health-records`, { params });
  }

  getRecord(id: string): Observable<HealthRecord> {
    return this.http.get<HealthRecord>(`${this.apiUrl}/health-records/${encodeURIComponent(id)}`);
  }

  createRecord(petId: number, request: HealthRecordRequest): Observable<HealthRecord> {
    return this.http.post<HealthRecord>(`${this.apiUrl}/pets/${petId}/health-records`, request);
  }

  updateRecord(record: HealthRecord, request: HealthRecordRequest): Observable<HealthRecord> {
    return this.http.put<HealthRecord>(`${this.apiUrl}/health-records/${encodeURIComponent(record.id)}`, {
      ...request,
      version: record.version
    });
  }

  deleteRecord(record: HealthRecord): Observable<void> {
    const params = new HttpParams().set('version', record.version);
    return this.http.delete<void>(`${this.apiUrl}/health-records/${encodeURIComponent(record.id)}`, { params });
  }

  listMeasurements(petId: number, type?: HealthMeasurementType): Observable<HealthMeasurement[]> {
    let params = new HttpParams();
    if (type) params = params.set('type', type);
    return this.http.get<HealthMeasurement[]>(`${this.apiUrl}/pets/${petId}/health-measurements`, { params });
  }

  createMeasurement(petId: number, request: HealthMeasurementRequest): Observable<HealthMeasurement> {
    return this.http.post<HealthMeasurement>(`${this.apiUrl}/pets/${petId}/health-measurements`, request);
  }

  updateMeasurement(measurement: HealthMeasurement, request: Omit<HealthMeasurementRequest, 'type'>): Observable<HealthMeasurement> {
    return this.http.put<HealthMeasurement>(
      `${this.apiUrl}/health-measurements/${encodeURIComponent(measurement.id)}`,
      { ...request, version: measurement.version }
    );
  }

  deleteMeasurement(measurement: HealthMeasurement): Observable<void> {
    const params = new HttpParams().set('version', measurement.version);
    return this.http.delete<void>(`${this.apiUrl}/health-measurements/${encodeURIComponent(measurement.id)}`, { params });
  }

  attachmentDownloadUrl(contentUrl: string): Observable<{ url: string }> {
    const absolute = contentUrl.startsWith('http') ? contentUrl : `${this.apiUrl.replace(/\/api\/v1\/?$/, '')}${contentUrl}`;
    return this.http.get<{ url: string }>(absolute);
  }
}
