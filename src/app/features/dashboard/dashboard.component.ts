import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { forkJoin, Subscription } from 'rxjs';
import { TutorService } from '../../core/services/tutor.service';
import { EventService } from '../../core/services/event.service';
import { EventStateService } from '../../core/services/event-state.service';
import { DateTimeService } from '../../core/services/datetime.service';
import { PetService } from '../../core/services/pet.service';
import { Tutor } from '../../core/models/tutor.model';
import { EventSummary, EventType, isEventDone } from '../../core/models/event.model';
import { PetSummary } from '../../core/models/pet.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatGridListModule,
    MatListModule,
    MatChipsModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  currentUser: Tutor | null = null;
  totalPets = 0;
  totalEvents = 0;
  upcomingEvents = 0;
  recentPets: PetSummary[] = [];
  recentEvents: EventSummary[] = [];
  private eventUpdateSubscription?: Subscription;

  constructor(
    private tutorService: TutorService,
    private eventService: EventService,
    private eventStateService: EventStateService,
    private dateTimeService: DateTimeService,
    private petService: PetService
  ) { }

  ngOnInit(): void {
    this.loadDashboardData();
    // Se inscrever para atualizações de eventos
    this.eventUpdateSubscription = this.eventStateService.eventUpdated$.subscribe(() => {
      this.refreshEventData();
    });
  }

  ngOnDestroy(): void {
    if (this.eventUpdateSubscription) {
      this.eventUpdateSubscription.unsubscribe();
    }
  }

  private refreshEventData(): void {
    if (this.currentUser && this.currentUser.pets.length > 0) {
      this.loadEventsForAllPets(this.currentUser.pets);
    }
  }

  loadDashboardData(): void {
    this.tutorService.getMyProfile().subscribe((user: Tutor) => {
      this.currentUser = user;
      this.totalPets = user.pets.length;
      this.recentPets = user.pets.slice(0, 5);
      
      
      // Carregar eventos de todos os pets
      if (user.pets.length > 0) {
        this.loadEventsForAllPets(user.pets);
      } else {
        this.totalEvents = 0;
        this.upcomingEvents = 0;
        this.recentEvents = [];
      }
    });
  }

  private loadEventsForAllPets(pets: any[]): void {
    const petEventRequests = pets.map(pet => {
      return this.eventService.listByPet(pet.id);
    });

    forkJoin(petEventRequests).subscribe({
      next: (petEventsArrays) => {
        // Combinar todos os eventos de todos os pets
        const allEvents: EventSummary[] = [];
        petEventsArrays.forEach((petEvents, index) => {
          const pet = pets[index];
          if (Array.isArray(petEvents)) {
            petEvents.forEach((event: any) => {
              allEvents.push({
                id: event.id,
                type: event.type,
                description: event.description || this.getEventTypeName(event.type),
                dateStart: event.dateStart,
                petId: pet.id,
                status: event.status
              });
            });
          }
        });
        this.totalEvents = allEvents.length;
        const upcomingEvents = this.getUpcomingEvents(allEvents);
        this.upcomingEvents = upcomingEvents.length;
        this.recentEvents = upcomingEvents.slice(0, 5);
      },
      error: (error) => {
        this.totalEvents = 0;
        this.upcomingEvents = 0;
        this.recentEvents = [];
      }
    });
  }

  private getUpcomingEvents(events: EventSummary[]): EventSummary[] {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const filtered = events.filter((event) => {
      const eventDate = new Date(event.dateStart);
      const isNotDone = !isEventDone(event.status);
      const isInFuture = eventDate >= now;
      const isWithinWeek = eventDate <= nextWeek;
      return isNotDone && isInFuture && isWithinWeek;
    });
    return filtered;
  }

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
}
