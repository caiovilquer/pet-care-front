import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Pet, PetCreateRequest, PetUpdateRequest, PetsPage, PetSummary } from '../models/pet.model';
import { environment } from '../../../environments/environment';
import { CacheService } from './cache.service';
import { CacheKeys } from './cache-keys';
import { MediaService } from './media.service';

const CACHE_TTL_MS = 60_000;

@Injectable({
  providedIn: 'root'
})
export class PetService {
  private apiUrl = `${environment.apiUrl}/pets`;

  constructor(private http: HttpClient, private cache: CacheService, private media: MediaService) { }

  getAll(page: number, size: number): Observable<PetsPage> {
    return this.http.get<PetsPage>(`${this.apiUrl}?page=${page}&size=${size}`).pipe(
      map(result => ({ ...result, items: result.items.map(pet => this.withPhoto(pet)) }))
    );
  }

  /** Versão cacheada de getAll — reaproveita a resposta ao trocar de aba/rota em vez de refazer a requisição. */
  getAllCached(page: number, size: number): Observable<PetsPage> {
    return this.cache.get(CacheKeys.petsAll(page, size), () => this.getAll(page, size), CACHE_TTL_MS);
  }

  getById(id: number): Observable<Pet> {
    return this.http.get<Pet>(`${this.apiUrl}/${id}`).pipe(map(pet => this.withPhoto(pet)));
  }

  getByIdCached(id: number): Observable<Pet> {
    return this.cache.get(CacheKeys.petById(id), () => this.getById(id), CACHE_TTL_MS);
  }

  create(pet: PetCreateRequest): Observable<{ petId: number }> {
    return this.http.post<{ petId: number }>(this.apiUrl, pet).pipe(tap(() => this.invalidateCache()));
  }

  update(id: number, pet: PetUpdateRequest): Observable<Pet> {
    return this.http.put<Pet>(`${this.apiUrl}/${id}`, pet).pipe(tap(() => this.invalidateCache()));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(tap(() => this.invalidateCache()));
  }

  getPets(): Observable<PetSummary[]> {
    // Fetch all pets - adjust page size if you have more than 100 pets
    return this.http.get<PetsPage>(`${this.apiUrl}?page=0&size=100`).pipe(
      map(page => page.items)
    );
  }

  getPetsCached(): Observable<PetSummary[]> {
    return this.cache.get(CacheKeys.petsList, () => this.getPets(), CACHE_TTL_MS);
  }

  /** Pets mudaram: limpa o cache de pets e o perfil do tutor, que embute a lista de pets. */
  private invalidateCache(): void {
    this.cache.invalidatePrefix(CacheKeys.petsPrefix);
    this.cache.invalidate(CacheKeys.tutorMe);
    this.cache.invalidate(CacheKeys.dashboard);
  }

  private withPhoto<T extends { photoUrl?: string; photoAssetId?: string }>(pet: T): T {
    const normalized = { ...pet };
    const photoUrl = this.media.contentUrl(pet.photoAssetId, pet.photoUrl);
    if (photoUrl) normalized.photoUrl = photoUrl;
    else delete normalized.photoUrl;
    return normalized;
  }
}
