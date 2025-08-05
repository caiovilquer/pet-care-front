import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserStateService {
  private userUpdatedSource = new Subject<void>();
  
  // Observable stream para outros componentes se inscreverem
  userUpdated$ = this.userUpdatedSource.asObservable();

  constructor() { }

  // Método para notificar que o perfil do usuário foi atualizado
  notifyUserUpdated(): void {
    console.log('UserStateService: Notificando atualização de perfil');
    this.userUpdatedSource.next();
  }
}
