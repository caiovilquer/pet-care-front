import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Pet, PetCreateRequest, PetUpdateRequest, PetsPage, PetSummary } from '../models/pet.model';
import { environment } from '../../../environments/environment';
import { CacheService } from './cache.service';
import { CacheKeys } from './cache-keys';

const CACHE_TTL_MS = 60_000;

@Injectable({
  providedIn: 'root'
})
export class PetService {
  private apiUrl = `${environment.apiUrl}/pets`;

  constructor(private http: HttpClient, private cache: CacheService) { }

  getAll(page: number, size: number): Observable<PetsPage> {
    return this.http.get<PetsPage>(`${this.apiUrl}?page=${page}&size=${size}`);
  }

  /** Versão cacheada de getAll — reaproveita a resposta ao trocar de aba/rota em vez de refazer a requisição. */
  getAllCached(page: number, size: number): Observable<PetsPage> {
    return this.cache.get(CacheKeys.petsAll(page, size), () => this.getAll(page, size), CACHE_TTL_MS);
  }

  getById(id: number): Observable<Pet> {
    return this.http.get<Pet>(`${this.apiUrl}/${id}`);
  }

  getByIdCached(id: number): Observable<Pet> {
    return this.cache.get(CacheKeys.petById(id), () => this.getById(id), CACHE_TTL_MS);
  }

  create(pet: PetCreateRequest): Observable<any> {
    return this.http.post<any>(this.apiUrl, pet).pipe(tap(() => this.invalidateCache()));
  }

  update(id: number, pet: PetUpdateRequest): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, pet).pipe(tap(() => this.invalidateCache()));
  }

  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(tap(() => this.invalidateCache()));
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
  }
}
