import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { 
  Event, 
  EventCreateRequest, 
  EventUpdateRequest, 
  EventsPage, 
  EventSummary
} from '../models/event.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private apiUrl = `${environment.apiUrl}/events`;

  constructor(private http: HttpClient) { }

  getAll(page: number, size: number): Observable<EventsPage> {
    return this.http.get<EventsPage>(`${this.apiUrl}?page=${page}&size=${size}`);
  }

  getById(id: number): Observable<Event> {
    return this.http.get<Event>(`${this.apiUrl}/${id}`);
  }

  create(event: EventCreateRequest): Observable<any> {
    console.log('EventService.create - Enviando para API:', event);
    return this.http.post<any>(this.apiUrl, event);
  }

  update(id: number, event: EventUpdateRequest): Observable<any> {
    console.log('EventService.update - Enviando para API:', { id, event });
    return this.http.put<any>(`${this.apiUrl}/${id}`, event);
  }

  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  toggleDone(id: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/toggle`, {});
  }

  listByPet(petId: number): Observable<Event[]> {
    return this.http.get<Event[]>(`${this.apiUrl}/pet/${petId}`);
  }

  getEvents(): Observable<EventSummary[]> {
    // Fetch all events - adjust page size if you have more than 100 events
    return this.http.get<EventsPage>(`${this.apiUrl}?page=0&size=100`).pipe(
      map((page: EventsPage) => page.items)
    );
  }
}
