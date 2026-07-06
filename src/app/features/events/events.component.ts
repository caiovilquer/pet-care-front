import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { ToastService } from '../../core/services/toast.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { map } from 'rxjs/operators';
import { PageHeaderComponent } from '../../shared/components/ui/page-header.component';
import { EmptyStateComponent } from '../../shared/components/ui/empty-state.component';
import { SkeletonComponent } from '../../shared/components/ui/skeleton.component';
import { ConfirmDialogComponent } from '../../shared/components/ui/confirm-dialog.component';
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
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    MatDialogModule,
    MatTooltipModule,
    PageHeaderComponent,
    EmptyStateComponent,
    SkeletonComponent
  ],
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.css']
})
export class EventsComponent implements OnInit {
  events: EventSummary[] = [];
  eventGroups: { label: string; isToday: boolean; events: EventSummary[] }[] = [];
  totalItems = 0;
  currentPage = 0;
  pageSize = 10;
  petId: number | null = null;
  petName: string = '';
  petNamesMap: { [key: number]: string } = {};
  petsMap: { [key: number]: { name: string; species: string; photoUrl?: string } } = {};
  isLoading = true;

  constructor(
    private eventService: EventService,
    private eventStateService: EventStateService,
    private dateTimeService: DateTimeService,
    private petService: PetService,
    private dialog: MatDialog,
    private toast: ToastService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('petId');
      if (id) {
        this.petId = +id;
        this.loadPetName();
        this.loadEventsByPet();
      } else {
        this.petName = '';
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
        this.petsMap = {};
        pets.forEach(pet => {
          this.petNamesMap[pet.id] = pet.name;
          this.petsMap[pet.id] = {
            name: pet.name,
            species: pet.species,
            photoUrl: pet.photoUrl
          };
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
        this.buildGroups();
        this.totalItems = page.total;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar eventos:', err);
        // Definir dados padrão em caso de erro
        this.events = [];
        this.totalItems = 0;
        this.toast.error('Erro ao carregar eventos. Tente novamente mais tarde.');
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
          this.buildGroups();
          this.totalItems = summaries.length;
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Erro ao carregar eventos do pet:', err);
          // Definir dados padrão em caso de erro
          this.events = [];
          this.totalItems = 0;
          this.toast.error('Erro ao carregar eventos do pet. Tente novamente mais tarde.');
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
    const confirmRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Remover este cuidado?',
        message: `"${event.description || this.getEventTypeName(event.type)}" sai da agenda. Essa ação não pode ser desfeita.`,
        confirmLabel: 'Remover',
        danger: true
      }
    });

    confirmRef.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.eventService.delete(event.id).subscribe({
        next: () => {
          this.eventStateService.notifyEventUpdated();
          this.toast.success('Cuidado removido da agenda.');
          this.petId ? this.loadEventsByPet() : this.loadAllEvents();
        },
        error: () => {
          this.toast.error('Erro ao remover o cuidado.');
        }
      });
    });
  }

  toggleEventStatus(event: EventSummary): void {
    // Fazer update otimista temporário para feedback imediato
    const originalState = event.status;
    event.status = event.status === 'DONE' ? 'PENDING' : 'DONE';
    
    this.eventService.toggleDone(event.id).subscribe({
      next: (response) => {
        this.toast.success(
          `Evento ${event.status === 'DONE' ? 'concluído' : 'reativado'} com sucesso!`
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
        
        this.toast.error('Erro ao atualizar status do evento.');
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

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    return this.dateTimeService.formatDateTimeForDisplay(dateString); // FIX: usar serviço centralizado
  }

  formatTime(dateString: string): string {
    const date = this.dateTimeService.parseAPIDate(dateString);
    if (!date) return 'N/A';
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  /** Agrupa os eventos (já ordenados) por dia, com rótulos relativos. */
  private buildGroups(): void {
    const groups: { label: string; isToday: boolean; events: EventSummary[] }[] = [];
    let lastLabel = '';

    for (const event of this.events) {
      const { label, isToday } = this.dayLabel(event.dateStart);
      if (label !== lastLabel) {
        groups.push({ label, isToday, events: [] });
        lastLabel = label;
      }
      groups[groups.length - 1].events.push(event);
    }

    this.eventGroups = groups;
  }

  private dayLabel(dateString: string): { label: string; isToday: boolean } {
    const date = this.dateTimeService.parseAPIDate(dateString) || new Date(dateString);
    const now = new Date();
    const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const diffDays = Math.round(
      (startOfDay(date).getTime() - startOfDay(now).getTime()) / 86400000
    );

    if (diffDays === 0) return { label: 'Hoje', isToday: true };
    if (diffDays === 1) return { label: 'Amanhã', isToday: false };
    if (diffDays === -1) return { label: 'Ontem', isToday: false };

    const label = date.toLocaleDateString('pt-BR', {
      weekday: 'long', day: '2-digit', month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
    return { label: label.charAt(0).toUpperCase() + label.slice(1), isToday: false };
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

  getPetData(petId: number): { name: string; species: string; photoUrl?: string } {
    return this.petsMap[petId] || { name: `Pet #${petId}`, species: 'Desconhecido' };
  }

  getDefaultPetImage(species: string): string {
    const specieIcons: { [key: string]: string } = {
      'Cão': '🐕',
      'Gato': '🐱',
      'Pássaro': '🐦',
      'Peixe': '🐠',
      'Hamster': '🐹',
      'Coelho': '🐰'
    };
    return specieIcons[species] || '🐾';
  }

  onImageError(event: any, species: string): void {
    // Substituir a imagem por um canvas com emoji quando falhar
    const img = event.target;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      canvas.width = 64;
      canvas.height = 64;
      
      // Background gradient
      const gradient = ctx.createLinearGradient(0, 0, 64, 64);
      gradient.addColorStop(0, '#f3f4f6');
      gradient.addColorStop(1, '#e5e7eb');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 64, 64);
      
      // Emoji
      ctx.font = '28px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#374151';
      ctx.fillText(this.getDefaultPetImage(species), 32, 32);
      
      img.src = canvas.toDataURL();
      img.classList.add('fallback-image');
    }
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
