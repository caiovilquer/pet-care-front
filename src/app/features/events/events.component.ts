import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { map } from 'rxjs/operators';
import { EventService } from '../../core/services/event.service';
import { EventStateService } from '../../core/services/event-state.service';
import { Event, EventSummary, EventsPage, EventType, isEventDone } from '../../core/models/event.model';
import { EventFormComponent } from './event-form.component';

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatDialogModule,
    MatChipsModule,
    MatTooltipModule
  ],
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.css']
})
export class EventsComponent implements OnInit {
  events: EventSummary[] = [];
  totalItems = 0;
  currentPage = 0;
  pageSize = 10;
  displayedColumns: string[] = ['type', 'description', 'dateStart', 'status', 'actions'];
  petId: number | null = null;

  constructor(
    private eventService: EventService,
    private eventStateService: EventStateService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('petId');
      if (id) {
        this.petId = +id;
        this.loadEventsByPet();
      } else {
        this.loadAllEvents();
      }
    });
  }

  loadAllEvents(): void {
    console.log('Carregando todos os eventos');
    
    this.eventService.getAll(this.currentPage, this.pageSize).subscribe({
      next: (page: EventsPage) => {
        console.log('Página de eventos recebida:', page);
        console.log('Eventos da página:', page.items);
        
        // Verificar se cada evento tem o campo status
        page.items.forEach(event => {
          console.log(`Evento ${event.id}: status = ${event.status}`);
        });
        
        this.events = page.items;
        this.totalItems = page.total;
      },
      error: (err) => {
        console.error('Erro ao carregar eventos:', err);
        this.snackBar.open('Erro ao carregar eventos.', 'Fechar', { duration: 3000 });
      }
    });
  }

  loadEventsByPet(): void {
    if (this.petId) {
      console.log(`Carregando eventos para pet ${this.petId}`);
      
      this.eventService.listByPet(this.petId).pipe(
        map((events: Event[]): EventSummary[] => {
          console.log('Eventos recebidos da API:', events);
          
          return events.map(event => {
            const eventWithPetId = {
              ...event,
              petId: this.petId as number,
              status: (event as any).status || 'PENDING'
            };
            
            console.log(`Evento mapeado:`, {
              id: eventWithPetId.id,
              description: eventWithPetId.description,
              status: eventWithPetId.status,
              originalStatus: (event as any).status
            });
            
            return eventWithPetId;
          });
        })
      ).subscribe({
        next: (summaries: EventSummary[]) => {
          console.log('Eventos finais carregados:', summaries);
          this.events = summaries;
          this.totalItems = summaries.length;
        },
        error: (err) => {
          console.error('Erro ao carregar eventos do pet:', err);
          this.snackBar.open(`Erro ao carregar eventos do pet.`, 'Fechar', { duration: 3000 });
        }
      });
    }
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    if (this.petId) {
      // Pagination for listByPet is not implemented on the backend for this example
      // For a real app, you'd need backend support for paginating this endpoint
      this.loadEventsByPet();
    } else {
      this.loadAllEvents();
    }
  }

  openEventForm(): void {
    const dialogRef = this.dialog.open(EventFormComponent, {
      width: '500px',
      data: { petId: this.petId }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.petId ? this.loadEventsByPet() : this.loadAllEvents();
      }
    });
  }

  editEvent(event: EventSummary): void {
    console.log('=== EDITANDO EVENTO ===');
    console.log('Dados do evento:', event);
    console.log('PetId do evento:', event.petId);
    
    const dialogRef = this.dialog.open(EventFormComponent, {
      width: '500px',
      data: { 
        ...event, 
        eventId: event.id,
        petId: event.petId // Garantir que o petId está sendo passado
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.petId ? this.loadEventsByPet() : this.loadAllEvents();
      }
    });
  }

  deleteEvent(event: EventSummary): void {
    if (confirm(`Tem certeza que deseja excluir este evento?`)) {
      this.eventService.delete(event.id).subscribe({
        next: () => {
          this.snackBar.open('Evento excluído com sucesso!', 'Fechar', { duration: 3000 });
          this.petId ? this.loadEventsByPet() : this.loadAllEvents();
        },
        error: (err) => {
          this.snackBar.open('Erro ao excluir evento.', 'Fechar', { duration: 3000 });
        }
      });
    }
  }

  toggleEventStatus(event: EventSummary): void {
    console.log('=== TOGGLE EVENT STATUS ===');
    console.log('Evento antes do toggle:', event);
    console.log('Estado atual (status):', event.status);
    
    // Fazer update otimista temporário para feedback imediato
    const originalState = event.status;
    event.status = event.status === 'DONE' ? 'PENDING' : 'DONE';
    
    this.eventService.toggleDone(event.id).subscribe({
      next: (response) => {
        console.log('Resposta da API do toggle:', response);
        this.snackBar.open(
          `Evento ${event.status === 'DONE' ? 'concluído' : 'reativado'} com sucesso!`, 
          'Fechar', 
          { duration: 3000 }
        );
        
        // Recarregar os dados para garantir sincronização
        setTimeout(() => {
          if (this.petId) {
            this.loadEventsByPet();
          } else {
            this.loadAllEvents();
          }
        }, 500);
        
        // Notificar outros componentes sobre a atualização
        this.eventStateService.notifyEventUpdated();
        
        console.log('Dados recarregados após toggle');
      },
      error: (err) => {
        console.error('Erro ao fazer toggle do evento:', err);
        
        // Reverter o estado em caso de erro
        event.status = originalState;
        
        this.snackBar.open('Erro ao atualizar status do evento.', 'Fechar', { duration: 3000 });
      }
    });
  }

  // UI Helper methods
  getEventTypeName(type: EventType): string {
    const names = {
      VACCINE: 'Vacina',
      MEDICINE: 'Remédio',
      DIARY: 'Diário',
      BREED: 'Cio',
      SERVICE: 'Serviço'
    };
    return names[type] || 'Evento';
  }

  getEventIcon(type: EventType): string {
    const icons = {
      VACCINE: 'vaccines',
      MEDICINE: 'medication',
      DIARY: 'book',
      BREED: 'favorite',
      SERVICE: 'content_cut'
    };
    return icons[type] || 'event';
  }

  getEventChipClass(type: EventType): string {
    return `event-chip-${type.toLowerCase()}`;
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getEventStatus(dateStart: string, status: string): string {
    if (status === 'DONE') {
      return 'Concluído';
    }
    const now = new Date();
    const eventDate = new Date(dateStart);
    if (eventDate < now) {
      return 'Atrasado';
    }
    return 'Pendente';
  }

  getStatusChipClass(dateStart: string, status: string): string {
    if (status === 'DONE') {
      return 'status-chip-done';
    }
    const now = new Date();
    const eventDate = new Date(dateStart);
    if (eventDate < now) {
      return 'status-chip-overdue';
    }
    return 'status-chip-pending';
  }

  getToggleTooltip(status: string): string {
    return status === 'DONE' ? 'Marcar como pendente' : 'Marcar como concluído';
  }
}
