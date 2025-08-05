import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { 
  Event, 
  EventCreateRequest, 
  EventUpdateRequest, 
  EventsPage, 
  EventSummary,
  EventStatus
} from '../models/event.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private apiUrl = `${environment.apiUrl}/events`;

  constructor(private http: HttpClient) { }

  getAll(page: number, size: number): Observable<EventsPage> {
    console.log(`EventService: Buscando todos os eventos - página ${page}, tamanho ${size}`);
    
    return this.http.get<EventsPage>(`${this.apiUrl}?page=${page}&size=${size}`).pipe(
      tap((response: any) => {
        console.log('EventService: Resposta da API getAll:', response);
        
        // Debug: verificar o status de cada evento
        response.items?.forEach((event: any, index: number) => {
          console.log(`EventService - Evento ${index + 1}:`, {
            id: event.id,
            status: event.status,
            statusType: typeof event.status,
            statusDefined: event.status !== undefined,
            statusNull: event.status === null
          });
        });
      })
    );
  }

  getById(id: number): Observable<Event> {
    return this.http.get<Event>(`${this.apiUrl}/${id}`);
  }

  create(event: EventCreateRequest): Observable<any> {
    return this.http.post<any>(this.apiUrl, event);
  }

  update(id: number, event: EventUpdateRequest): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, event);
  }

  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  toggleDone(id: number): Observable<any> {
    console.log(`EventService: Fazendo toggle para evento ID ${id}`);
    console.log(`EventService: URL da requisição: ${this.apiUrl}/${id}/toggle`);
    
    return this.http.put<any>(`${this.apiUrl}/${id}/toggle`, {}).pipe(
      tap(response => {
        console.log(`EventService: Resposta do toggle para evento ${id}:`, response);
      }),
      catchError((error: any) => {
        console.error(`EventService: Erro no toggle para evento ${id}:`, error);
        return throwError(() => error);
      })
    );
  }

  listByPet(petId: number): Observable<Event[]> {
    console.log(`EventService: Buscando eventos para pet ${petId}`);
    
    return this.http.get<Event[]>(`${this.apiUrl}/pet/${petId}`).pipe(
      tap((events: any[]) => {
        console.log(`EventService: Eventos recebidos para pet ${petId}:`, events);
        
        // Debug: verificar o status de cada evento
        events.forEach((event: any, index: number) => {
          console.log(`EventService - Pet ${petId} - Evento ${index + 1}:`, {
            id: event.id,
            status: event.status,
            statusType: typeof event.status,
            statusDefined: event.status !== undefined,
            statusNull: event.status === null,
            fullEvent: event
          });
        });
      })
    );
  }

  getEvents(): Observable<EventSummary[]> {
    // Fetch all events - adjust page size if you have more than 100 events
    return this.http.get<EventsPage>(`${this.apiUrl}?page=0&size=100`).pipe(
      map((page: EventsPage) => page.items)
    );
  }
}
