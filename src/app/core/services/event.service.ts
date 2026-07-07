import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import {
  Event,
  EventCreateRequest,
  EventUpdateRequest,
  EventsPage,
  EventSummary
} from '../models/event.model';
import { environment } from '../../../environments/environment';
import { CacheService } from './cache.service';
import { CacheKeys } from './cache-keys';

const CACHE_TTL_MS = 60_000;

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private apiUrl = `${environment.apiUrl}/events`;

  constructor(private http: HttpClient, private cache: CacheService) { }

  getAll(page: number, size: number): Observable<EventsPage> {
    return this.http.get<EventsPage>(`${this.apiUrl}?page=${page}&size=${size}`);
  }

  /** Versão cacheada de getAll — reaproveita a resposta ao trocar de aba/rota em vez de refazer a requisição. */
  getAllCached(page: number, size: number): Observable<EventsPage> {
    return this.cache.get(CacheKeys.eventsAll(page, size), () => this.getAll(page, size), CACHE_TTL_MS);
  }

  getById(id: number): Observable<Event> {
    return this.http.get<Event>(`${this.apiUrl}/${id}`);
  }

  getByIdCached(id: number): Observable<Event> {
    return this.cache.get(CacheKeys.eventById(id), () => this.getById(id), CACHE_TTL_MS);
  }

  create(event: EventCreateRequest): Observable<any> {
    return this.http.post<any>(this.apiUrl, event).pipe(tap(() => this.invalidateCache()));
  }

  update(id: number, event: EventUpdateRequest): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, event).pipe(tap(() => this.invalidateCache()));
  }

  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(tap(() => this.invalidateCache()));
  }

  toggleDone(id: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/toggle`, {}).pipe(tap(() => this.invalidateCache()));
  }

  listByPet(petId: number): Observable<Event[]> {
    return this.http.get<Event[]>(`${this.apiUrl}/pet/${petId}`);
  }

  /** Versão cacheada de listByPet — evita repetir N requisições (uma por pet) a cada troca de aba. */
  listByPetCached(petId: number): Observable<Event[]> {
    return this.cache.get(CacheKeys.eventsByPet(petId), () => this.listByPet(petId), CACHE_TTL_MS);
  }

  getEvents(): Observable<EventSummary[]> {
    // Fetch all events - adjust page size if you have more than 100 events
    return this.http.get<EventsPage>(`${this.apiUrl}?page=0&size=100`).pipe(
      map((page: EventsPage) => page.items)
    );
  }

  getEventsCached(): Observable<EventSummary[]> {
    return this.cache.get(CacheKeys.eventsList, () => this.getEvents(), CACHE_TTL_MS);
  }

  /**
   * Um evento mudou. Como delete/update/toggle recebem só o id (sem petId garantido),
   * limpamos todo o namespace de eventos em vez de tentar acertar a chave exata.
   */
  private invalidateCache(): void {
    this.cache.invalidatePrefix(CacheKeys.eventsPrefix);
  }
}
