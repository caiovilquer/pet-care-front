import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { TutorDetailResult, TutorsPageResult } from '../../shared/models/tutor.model';
import { UpdateRequest } from '../../shared/models/auth.model';
import { PageRequest } from '../../shared/models/common.model';
import { environment } from '../../../environments/environment';
import { CacheService } from './cache.service';
import { CacheKeys } from './cache-keys';

const CACHE_TTL_MS = 60_000;

@Injectable({
  providedIn: 'root'
})
export class TutorService {
  private readonly API_URL = `${environment.apiUrl}/tutors`;

  constructor(private http: HttpClient, private cache: CacheService) {}

  getMyProfile(): Observable<TutorDetailResult> {
    return this.http.get<TutorDetailResult>(`${this.API_URL}/me`);
  }

  /** Versão cacheada de getMyProfile — reaproveita a resposta ao trocar de aba/rota em vez de refazer a requisição. */
  getMyProfileCached(): Observable<TutorDetailResult> {
    return this.cache.get(CacheKeys.tutorMe, () => this.getMyProfile(), CACHE_TTL_MS);
  }

  updateProfile(id: number, data: UpdateRequest): Observable<TutorDetailResult> {
    return this.http.put<TutorDetailResult>(`${this.API_URL}/${id}`, data).pipe(
      tap(() => this.cache.invalidate(CacheKeys.tutorMe))
    );
  }

  deleteProfile(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`).pipe(
      tap(() => this.cache.invalidateAll())
    );
  }

  getTutors(pageRequest?: PageRequest): Observable<TutorsPageResult> {
    let params = new HttpParams();
    if (pageRequest?.page !== undefined) {
      params = params.set('page', pageRequest.page.toString());
    }
    if (pageRequest?.size !== undefined) {
      params = params.set('size', pageRequest.size.toString());
    }
    
    return this.http.get<TutorsPageResult>(this.API_URL, { params });
  }
}
