import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, catchError, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { HOUSEHOLD_STORAGE_KEY, HouseholdOverview, HouseholdRole, HouseholdSummary } from '../models/household.model';
import { CacheService } from './cache.service';

@Injectable({ providedIn: 'root' })
export class HouseholdService {
  private readonly url = `${environment.apiUrl}/households`;
  private readonly householdsSubject = new BehaviorSubject<HouseholdSummary[]>([]);
  private readonly currentSubject = new BehaviorSubject<HouseholdSummary | null>(null);
  readonly households$ = this.householdsSubject.asObservable();
  readonly current$ = this.currentSubject.asObservable();

  constructor(private http: HttpClient, private cache: CacheService) {}

  load(): Observable<HouseholdSummary[]> {
    return this.http.get<HouseholdSummary[]>(this.url).pipe(tap(items => {
      this.householdsSubject.next(items);
      const stored = this.selectedId();
      const selected = items.find(item => item.id === stored) || items.find(item => item.isDefault) || items[0] || null;
      this.currentSubject.next(selected);
      if (selected) localStorage.setItem(HOUSEHOLD_STORAGE_KEY, selected.id);
    }));
  }

  overview(): Observable<HouseholdOverview> {
    return this.http.get<HouseholdOverview>(`${this.url}/current`).pipe(tap(value => this.currentSubject.next(value.household)));
  }
  select(item: HouseholdSummary): Observable<void> {
    const previousId = this.selectedId();
    const previous = this.currentSubject.value;
    localStorage.setItem(HOUSEHOLD_STORAGE_KEY, item.id);
    this.currentSubject.next(item);
    this.cache.invalidateAll();
    return this.http.put<void>(`${this.url}/${encodeURIComponent(item.id)}/default`, {}).pipe(tap(() => {
      this.householdsSubject.next(this.householdsSubject.value.map(value => ({ ...value, isDefault: value.id === item.id })));
    }), catchError(error => {
      if (previousId) localStorage.setItem(HOUSEHOLD_STORAGE_KEY, previousId);
      else localStorage.removeItem(HOUSEHOLD_STORAGE_KEY);
      this.currentSubject.next(previous);
      this.cache.invalidateAll();
      return throwError(() => error);
    }));
  }
  invite(email: string, role: HouseholdRole): Observable<void> {
    return this.http.post<void>(`${this.url}/current/invitations`, { email, role });
  }
  accept(token: string): Observable<{ householdId: string }> {
    return this.http.post<{ householdId: string }>(`${this.url}/invitations/accept`, { token }).pipe(tap(value => {
      localStorage.setItem(HOUSEHOLD_STORAGE_KEY, value.householdId); this.cache.invalidateAll();
    }));
  }
  changeRole(memberId: string, expectedVersion: number, role: HouseholdRole): Observable<void> {
    return this.http.patch<void>(`${this.url}/current/members/${encodeURIComponent(memberId)}`, { expectedVersion, role });
  }
  removeMember(memberId: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/current/members/${encodeURIComponent(memberId)}`);
  }
  revokeInvitation(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/current/invitations/${encodeURIComponent(id)}`);
  }
  handoff(note: string, toTutorId?: number | null): Observable<void> {
    return this.http.post<void>(`${this.url}/current/handoffs`, { note, toTutorId: toTutorId || null });
  }
  rename(household: HouseholdSummary, name: string): Observable<HouseholdSummary> {
    return this.http.patch<HouseholdSummary>(`${this.url}/${encodeURIComponent(household.id)}`, { expectedVersion: household.version, name });
  }
  selectedId(): string | null { try { return localStorage.getItem(HOUSEHOLD_STORAGE_KEY); } catch { return null; } }
}
