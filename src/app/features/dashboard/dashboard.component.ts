import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Subscription } from 'rxjs';
import { StatCardComponent } from '../../shared/components/ui/stat-card.component';
import { PetAvatarComponent } from '../../shared/components/ui/pet-avatar.component';
import { EmptyStateComponent } from '../../shared/components/ui/empty-state.component';
import { SkeletonComponent } from '../../shared/components/ui/skeleton.component';
import { DashboardService } from '../../core/services/dashboard.service';
import { EventStateService } from '../../core/services/event-state.service';
import { DateTimeService } from '../../core/services/datetime.service';
import { EventSummary, EventType } from '../../core/models/event.model';
import { PetSummary } from '../../core/models/pet.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    StatCardComponent,
    PetAvatarComponent,
    EmptyStateComponent,
    SkeletonComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  currentUser: { firstName: string } | null = null;
  totalPets = 0;
  totalEvents = 0;
  upcomingEvents = 0;
  recentPets: PetSummary[] = [];
  recentEvents: EventSummary[] = [];
  isLoading = true;
  private eventUpdateSubscription?: Subscription;

  constructor(
    private dashboardService: DashboardService,
    private eventStateService: EventStateService,
    private dateTimeService: DateTimeService
  ) { }

  ngOnInit(): void {
    this.loadDashboardData();
    // Se inscrever para atualizações de eventos
    this.eventUpdateSubscription = this.eventStateService.eventUpdated$.subscribe(() => {
      this.loadDashboardData(true);
    });
  }

  ngOnDestroy(): void {
    if (this.eventUpdateSubscription) {
      this.eventUpdateSubscription.unsubscribe();
    }
  }

  loadDashboardData(forceRefresh = false): void {
    this.isLoading = true;
    this.dashboardService.getOverview(forceRefresh).subscribe({
      next: (overview) => {
        this.currentUser = { firstName: overview.firstName };
        this.totalPets = overview.totalPets;
        this.totalEvents = overview.totalEvents;
        this.recentPets = overview.pets.slice(0, 5);
        this.upcomingEvents = overview.upcomingEvents.length;
        this.recentEvents = overview.upcomingEvents.slice(0, 5);
        this.isLoading = false;
      },
      error: (error) => {
        this.currentUser = null;
        this.totalPets = 0;
        this.totalEvents = 0;
        this.upcomingEvents = 0;
        this.recentPets = [];
        this.recentEvents = [];
        this.isLoading = false;
      }
    });
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

  retryLoadData(): void {
    this.loadDashboardData(true);
  }

  get greeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  }

  get todayLabel(): string {
    const label = new Date().toLocaleDateString('pt-BR', {
      weekday: 'long', day: 'numeric', month: 'long'
    });
    return label.charAt(0).toUpperCase() + label.slice(1);
  }
}
