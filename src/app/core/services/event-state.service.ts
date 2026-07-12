import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EventStateService {
  private eventUpdatedSource = new Subject<void>();
  
  // Observable stream para outros componentes se inscreverem
  eventUpdated$ = this.eventUpdatedSource.asObservable();

  notifyEventUpdated(): void {
    this.eventUpdatedSource.next();
  }
}
