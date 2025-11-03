import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { map } from 'rxjs/operators';
import { EventService } from '../../core/services/event.service';
import { EventStateService } from '../../core/services/event-state.service';
import { DateTimeService } from '../../core/services/datetime.service';
import { PetService } from '../../core/services/pet.service';
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
    MatTooltipModule,
    MatProgressSpinnerModule
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
  petName: string = '';
  petNamesMap: { [key: number]: string } = {};
  isLoading = true;

  constructor(
    private eventService: EventService,
    private eventStateService: EventStateService,
    private dateTimeService: DateTimeService,
    private petService: PetService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('petId');
      if (id) {
        this.petId = +id;
        this.displayedColumns = ['type', 'description', 'dateStart', 'status', 'actions'];
        this.loadPetName();
        this.loadEventsByPet();
      } else {
        this.petName = '';
        this.displayedColumns = ['type', 'pet', 'description', 'dateStart', 'status', 'actions'];
        this.loadPetsMap();
        this.loadAllEvents();
      }
    });
  }

  private loadPetName(): void {
    if (this.petId) {
      this.petService.getById(this.petId).subscribe({
        next: (pet) => {
          this.petName = pet.name;
        },
        error: (err) => {
          this.petName = `Pet #${this.petId}`;
        }
      });
    }
  }

  private loadPetsMap(): void {
    this.petService.getPets().subscribe({
      next: (pets) => {
        this.petNamesMap = {};
        pets.forEach(pet => {
          this.petNamesMap[pet.id] = pet.name;
        });
      },
      error: (err) => {
        // Em caso de erro, o mapa ficará vazio e mostrará o ID
      }
    });
  }

  loadAllEvents(): void {
    this.isLoading = true;
    this.eventService.getAll(this.currentPage, this.pageSize).subscribe({
      next: (page: EventsPage) => {
        this.events = this.sortEventsByDate(page.items);
        this.totalItems = page.total;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar eventos:', err);
        // Definir dados padrão em caso de erro
        this.events = [];
        this.totalItems = 0;
        this.snackBar.open('Erro ao carregar eventos. Tente novamente mais tarde.', 'Fechar', { 
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        this.isLoading = false;
      }
    });
  }

  loadEventsByPet(): void {
    if (this.petId) {
      this.isLoading = true;
      this.eventService.listByPet(this.petId).pipe(
        map((events: Event[]): EventSummary[] => {
          return events.map(event => {
            const eventWithPetId: EventSummary = {
              ...event,
              petId: this.petId as number
            };
            return eventWithPetId;
          });
        })
      ).subscribe({
        next: (summaries: EventSummary[]) => {
          this.events = this.sortEventsByDate(summaries);
          this.totalItems = summaries.length;
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Erro ao carregar eventos do pet:', err);
          // Definir dados padrão em caso de erro
          this.events = [];
          this.totalItems = 0;
          this.snackBar.open(`Erro ao carregar eventos do pet. Tente novamente mais tarde.`, 'Fechar', { 
            duration: 3000,
            panelClass: ['error-snackbar']
          });
          this.isLoading = false;
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
    const dialogRef = this.dialog.open(EventFormComponent, {
      width: '500px',
      data: { 
        ...event, 
        eventId: event.id,
        petId: event.petId
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
          this.eventStateService.notifyEventUpdated();
          this.snackBar.open('Evento excluído com sucesso!', 'Fechar', { 
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.petId ? this.loadEventsByPet() : this.loadAllEvents();
        },
        error: (err) => {
          this.snackBar.open('Erro ao excluir evento.', 'Fechar', { 
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      });
    }
  }

  toggleEventStatus(event: EventSummary): void {
    // Fazer update otimista temporário para feedback imediato
    const originalState = event.status;
    event.status = event.status === 'DONE' ? 'PENDING' : 'DONE';
    
    this.eventService.toggleDone(event.id).subscribe({
      next: (response) => {
        this.snackBar.open(
          `Evento ${event.status === 'DONE' ? 'concluído' : 'reativado'} com sucesso!`, 
          'Fechar', 
          { 
            duration: 3000,
            panelClass: ['success-snackbar']
          }
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
      },
      error: (err) => {
        // Reverter o estado em caso de erro
        event.status = originalState;
        
        this.snackBar.open('Erro ao atualizar status do evento.', 'Fechar', { 
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  goBackToAllEvents(): void {
    this.router.navigate(['/events']);
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
    return this.dateTimeService.formatDateTimeForDisplay(dateString); // FIX: usar serviço centralizado
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

  getPetName(petId: number): string {
    return this.petNamesMap[petId] || `Pet #${petId}`;
  }

  // Ordenar eventos por data (mais próximos primeiro)
  private sortEventsByDate(events: EventSummary[]): EventSummary[] {
    return events.sort((a, b) => {
      const dateA = new Date(a.dateStart).getTime();
      const dateB = new Date(b.dateStart).getTime();
      return dateA - dateB; // Ordem crescente (mais próximos primeiro)
    });
  }

  // Verificar se evento está próximo (7 dias)
  isUpcomingEvent(dateStart: string, status: string): boolean {
    if (status === 'DONE') return false;
    
    const now = new Date();
    const eventDate = new Date(dateStart);
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return eventDate >= now && eventDate <= nextWeek;
  }
}
