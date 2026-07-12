import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CareOccurrence,
  CareOccurrencesPage,
  CarePlan,
  CarePlanRequest,
  CarePlansPage,
  CareSearch,
  TodayCare
} from '../models/care.model';
import { CacheKeys } from './cache-keys';
import { CacheService } from './cache.service';

@Injectable({ providedIn: 'root' })
export class CareService {
  private readonly plansUrl = `${environment.apiUrl}/care-plans`;
  private readonly occurrencesUrl = `${environment.apiUrl}/care-occurrences`;
  private readonly pendingCompletionKeys = new Map<string, string>();
  private readonly pendingUndoKeys = new Map<string, string>();

  constructor(private http: HttpClient, private cache: CacheService) {}

  today(forceRefresh = false): Observable<TodayCare> {
    if (forceRefresh) this.cache.invalidate(CacheKeys.careToday);
    return this.cache.get(CacheKeys.careToday, () => this.http.get<TodayCare>(`${this.occurrencesUrl}/today`), 30_000);
  }

  search(query: CareSearch): Observable<CareOccurrencesPage> {
    let params = new HttpParams()
      .set('from', query.from)
      .set('to', query.to)
      .set('page', query.page)
      .set('size', query.size);
    if (query.petId) params = params.set('petId', query.petId);
    if (query.type) params = params.set('type', query.type);
    if (query.status) params = params.set('status', query.status);
    return this.http.get<CareOccurrencesPage>(this.occurrencesUrl, { params });
  }

  getPlan(id: string): Observable<CarePlan> {
    return this.http.get<CarePlan>(`${this.plansUrl}/${encodeURIComponent(id)}`);
  }

  listPlans(petId?: number, active = true): Observable<CarePlansPage> {
    let params = new HttpParams().set('page', 0).set('size', 100).set('active', active);
    if (petId) params = params.set('petId', petId);
    return this.http.get<CarePlansPage>(this.plansUrl, { params });
  }

  createPlan(request: CarePlanRequest): Observable<CarePlan> {
    return this.http.post<CarePlan>(this.plansUrl, request).pipe(tap(() => this.invalidate()));
  }

  updatePlan(id: string, request: CarePlanRequest): Observable<CarePlan> {
    return this.http.put<CarePlan>(`${this.plansUrl}/${encodeURIComponent(id)}`, request)
      .pipe(tap(() => this.invalidate()));
  }

  deactivatePlan(id: string): Observable<void> {
    return this.http.delete<void>(`${this.plansUrl}/${encodeURIComponent(id)}`)
      .pipe(tap(() => this.invalidate()));
  }

  complete(id: string, note?: string): Observable<CareOccurrence> {
    const requestId = this.pendingCompletionKeys.get(id) || crypto.randomUUID();
    this.pendingCompletionKeys.set(id, requestId);
    return this.http.post<CareOccurrence>(`${this.occurrencesUrl}/${encodeURIComponent(id)}/complete`, {
      requestId,
      note: note || null
    }).pipe(tap(() => {
      this.pendingCompletionKeys.delete(id);
      this.invalidate();
    }));
  }

  undo(id: string): Observable<CareOccurrence> {
    const requestId = this.pendingUndoKeys.get(id) || crypto.randomUUID();
    this.pendingUndoKeys.set(id, requestId);
    return this.http.post<CareOccurrence>(`${this.occurrencesUrl}/${encodeURIComponent(id)}/undo`, {
      requestId
    }).pipe(tap(() => {
      this.pendingUndoKeys.delete(id);
      this.invalidate();
    }));
  }

  private invalidate(): void {
    this.cache.invalidate(CacheKeys.careToday);
    this.cache.invalidate(CacheKeys.dashboard);
    this.cache.invalidatePrefix(CacheKeys.eventsPrefix);
  }
}
