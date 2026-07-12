import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Tutor, TutorsPage, TutorUpdateRequest } from '../models/tutor.model';
import { PageRequest } from '../models/common.model';
import { environment } from '../../../environments/environment';
import { CacheService } from './cache.service';
import { CacheKeys } from './cache-keys';
import { MediaService } from './media.service';

const CACHE_TTL_MS = 60_000;

@Injectable({
  providedIn: 'root'
})
export class TutorService {
  private readonly API_URL = `${environment.apiUrl}/tutors`;

  constructor(private http: HttpClient, private cache: CacheService, private media: MediaService) {}

  getMyProfile(): Observable<Tutor> {
    return this.http.get<Tutor>(`${this.API_URL}/me`).pipe(map(tutor => this.withMedia(tutor)));
  }

  /** Versão cacheada de getMyProfile — reaproveita a resposta ao trocar de aba/rota em vez de refazer a requisição. */
  getMyProfileCached(): Observable<Tutor> {
    return this.cache.get(CacheKeys.tutorMe, () => this.getMyProfile(), CACHE_TTL_MS);
  }

  updateProfile(id: number, data: TutorUpdateRequest): Observable<Tutor> {
    return this.http.put<Tutor>(`${this.API_URL}/${id}`, data).pipe(
      map(tutor => this.withMedia(tutor)),
      tap(() => {
        this.cache.invalidate(CacheKeys.tutorMe);
        this.cache.invalidate(CacheKeys.dashboard);
      })
    );
  }

  deleteProfile(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`).pipe(
      tap(() => this.cache.invalidateAll())
    );
  }

  getTutors(pageRequest?: PageRequest): Observable<TutorsPage> {
    let params = new HttpParams();
    if (pageRequest?.page !== undefined) {
      params = params.set('page', pageRequest.page.toString());
    }
    if (pageRequest?.size !== undefined) {
      params = params.set('size', pageRequest.size.toString());
    }
    
    return this.http.get<TutorsPage>(this.API_URL, { params });
  }

  private withMedia(tutor: Tutor): Tutor {
    const normalized: Tutor = {
      ...tutor,
      pets: tutor.pets?.map(pet => ({
        ...pet,
        ...(this.media.contentUrl(pet.photoAssetId, pet.photoUrl)
          ? { photoUrl: this.media.contentUrl(pet.photoAssetId, pet.photoUrl)! }
          : {})
      })) || []
    };
    const avatar = this.media.contentUrl(tutor.avatarAssetId, tutor.avatar);
    if (avatar) normalized.avatar = avatar;
    return normalized;
  }
}
