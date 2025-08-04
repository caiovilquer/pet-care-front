import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, Router } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { forkJoin, Subscription } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { TutorService } from '../../core/services/tutor.service';
import { EventService } from '../../core/services/event.service';
import { EventStateService } from '../../core/services/event-state.service';
import { TutorDetailResult } from '../../shared/models/tutor.model';
import { EventSummary, isEventDone } from '../../core/models/event.model';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    MatSidenavModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatMenuModule,
    MatBadgeModule
  ],
  template: `
    <mat-sidenav-container class="sidenav-container">
      <mat-sidenav #drawer class="sidenav" fixedInViewport mode="side" opened>
        <mat-toolbar class="sidenav-header">
          <mat-icon class="logo-icon">pets</mat-icon>
          <span class="logo-text">Pet Care</span>
        </mat-toolbar>
        
        <mat-nav-list>
          <a mat-list-item routerLink="/dashboard" routerLinkActive="active">
            <mat-icon matListItemIcon>dashboard</mat-icon>
            <span matListItemTitle>Dashboard</span>
          </a>
          
          <a mat-list-item routerLink="/pets" routerLinkActive="active">
            <mat-icon matListItemIcon>pets</mat-icon>
            <span matListItemTitle>Meus Pets</span>
          </a>
          
          <a mat-list-item routerLink="/events" routerLinkActive="active">
            <mat-icon matListItemIcon>event</mat-icon>
            <span matListItemTitle>Eventos</span>
          </a>
          
          <a mat-list-item routerLink="/profile" routerLinkActive="active">
            <mat-icon matListItemIcon>person</mat-icon>
            <span matListItemTitle>Perfil</span>
          </a>
        </mat-nav-list>
      </mat-sidenav>

      <mat-sidenav-content>
        <mat-toolbar color="primary" class="main-toolbar">
          <button mat-icon-button (click)="drawer.toggle()">
            <mat-icon>menu</mat-icon>
          </button>
          
          <span class="toolbar-title">Pet Care Scheduler</span>
          
          <span class="spacer"></span>
          
          <button mat-icon-button [matMenuTriggerFor]="notificationMenu">
            <mat-icon [matBadge]="upcomingEventsCount > 0 ? upcomingEventsCount : null" 
                      matBadgeColor="accent" 
                      [class.has-notifications]="upcomingEventsCount > 0">
              notifications
            </mat-icon>
          </button>
          
          <button mat-icon-button [matMenuTriggerFor]="userMenu">
            <mat-icon>account_circle</mat-icon>
          </button>
        </mat-toolbar>

        <main class="main-content">
          <router-outlet></router-outlet>
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>

    <!-- User Menu -->
    <mat-menu #userMenu="matMenu">
      <div class="user-info" *ngIf="currentUser">
        <p class="user-name">{{currentUser.firstName}} {{currentUser.lastName}}</p>
        <p class="user-email">{{currentUser.email}}</p>
      </div>
      <mat-divider></mat-divider>
      <button mat-menu-item routerLink="/profile">
        <mat-icon>person</mat-icon>
        <span>Perfil</span>
      </button>
      <button mat-menu-item (click)="logout()">
        <mat-icon>exit_to_app</mat-icon>
        <span>Sair</span>
      </button>
    </mat-menu>

    <!-- Notification Menu -->
    <mat-menu #notificationMenu="matMenu" class="notification-menu">
      <div class="notification-header">
        <mat-icon>notifications</mat-icon>
        <h3>Eventos próximos</h3>
        <span class="notification-count" *ngIf="upcomingEventsCount > 0">({{upcomingEventsCount}})</span>
      </div>
      <mat-divider></mat-divider>
      
      <!-- Lista de eventos próximos -->
      <div class="notification-content" *ngIf="upcomingEventsCount > 0; else noNotifications">
        <div class="notification-item" *ngFor="let event of upcomingEventsList; let i = index">
          <div class="event-icon">
            <mat-icon [class]="'event-icon-' + event.type.toLowerCase()">{{getEventIcon(event.type)}}</mat-icon>
          </div>
          <div class="event-info">
            <div class="event-description">{{event.description}}</div>
            <div class="event-date">{{formatEventDate(event.dateStart)}}</div>
            <div class="event-pet" *ngIf="event.petName">{{event.petName}}</div>
          </div>
        </div>
        
        <mat-divider></mat-divider>
        <button mat-menu-item routerLink="/events" class="view-all-button">
          <mat-icon>event</mat-icon>
          <span>Ver todos os eventos</span>
        </button>
      </div>
      
      <!-- Estado vazio -->
      <ng-template #noNotifications>
        <div class="no-notifications">
          <mat-icon class="no-notifications-icon">notifications_off</mat-icon>
          <p>Nenhum evento próximo</p>
          <button mat-menu-item routerLink="/events" class="create-event-button">
            <mat-icon>add_circle</mat-icon>
            <span>Criar novo evento</span>
          </button>
        </div>
      </ng-template>
    </mat-menu>
  `,
  styles: [`
    .sidenav-container {
      height: 100vh;
    }

    .sidenav {
      width: 250px;
      background: #f5f5f5;
    }

    .sidenav-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 0 16px;
    }

    .logo-icon {
      font-size: 24px;
    }

    .logo-text {
      font-size: 18px;
      font-weight: 500;
    }

    .main-toolbar {
      position: sticky;
      top: 0;
      z-index: 1000;
    }

    .toolbar-title {
      font-size: 20px;
      font-weight: 500;
    }

    .spacer {
      flex: 1 1 auto;
    }

    .main-content {
      padding: 24px;
      min-height: calc(100vh - 64px);
      background: #fafafa;
    }

    .active {
      background: rgba(103, 126, 234, 0.1);
      color: #667eea;
    }

    .active mat-icon {
      color: #667eea;
    }

    .user-info {
      padding: 16px;
      background: #f5f5f5;
    }

    .user-name {
      font-weight: 500;
      margin: 0;
      color: #333;
    }

    .user-email {
      font-size: 12px;
      color: #666;
      margin: 4px 0 0 0;
    }

    .notification-header {
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
      background: #f8f9fa;
    }

    .notification-header h3 {
      margin: 0;
      font-size: 16px;
      color: #333;
      font-weight: 500;
    }

    .notification-count {
      font-size: 12px;
      color: #666;
      font-weight: normal;
    }

    .notification-content {
      max-height: 400px;
      overflow-y: auto;
      min-width: 350px;
    }

    .notification-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px 16px;
      border-bottom: 1px solid #f0f0f0;
      transition: background-color 0.2s;
    }

    .notification-item:hover {
      background: #f8f9fa;
    }

    .notification-item:last-child {
      border-bottom: none;
    }

    .event-icon {
      flex-shrink: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background: #e3f2fd;
    }

    .event-icon mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .event-icon-vaccine { background: #e8f5e8; color: #4caf50; }
    .event-icon-medicine { background: #fff3e0; color: #ff9800; }
    .event-icon-diary { background: #f3e5f5; color: #9c27b0; }
    .event-icon-breed { background: #fce4ec; color: #e91e63; }
    .event-icon-service { background: #e1f5fe; color: #03a9f4; }

    .event-info {
      flex: 1;
      min-width: 0;
    }

    .event-description {
      font-weight: 500;
      color: #333;
      font-size: 14px;
      margin-bottom: 4px;
    }

    .event-date {
      font-size: 12px;
      color: #666;
      margin-bottom: 2px;
    }

    .event-pet {
      font-size: 11px;
      color: #999;
      font-style: italic;
    }

    .view-all-button {
      width: 100%;
      justify-content: center;
      color: #667eea;
      font-weight: 500;
    }

    .no-notifications {
      padding: 24px 16px;
      text-align: center;
      color: #666;
    }

    .no-notifications-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #ccc;
      margin-bottom: 8px;
    }

    .no-notifications p {
      margin: 0 0 16px 0;
      font-size: 14px;
    }

    .create-event-button {
      width: 100%;
      justify-content: center;
      color: #4caf50;
    }

    .has-notifications {
      color: #ff9800;
    }

    /* Animação do sino */
    .has-notifications {
      animation: bell-ring 2s ease-in-out infinite;
    }

    @keyframes bell-ring {
      0%, 50%, 100% { transform: rotate(0deg); }
      10%, 30% { transform: rotate(-10deg); }
      20%, 40% { transform: rotate(10deg); }
    }

    @media (max-width: 768px) {
      .sidenav {
        width: 100%;
      }
    }
  `]
})
export class LayoutComponent implements OnInit, OnDestroy {
  currentUser: TutorDetailResult | null = null;
  upcomingEventsCount = 0;
  upcomingEventsList: any[] = [];
  private eventUpdateSubscription?: Subscription;

  constructor(
    private authService: AuthService,
    private tutorService: TutorService,
    private eventService: EventService,
    private eventStateService: EventStateService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUserProfile();
    
    // Se inscrever para atualizações de eventos
    this.eventUpdateSubscription = this.eventStateService.eventUpdated$.subscribe(() => {
      console.log('Layout: Recebeu notificação de atualização de evento');
      this.refreshNotifications();
    });
  }

  ngOnDestroy(): void {
    if (this.eventUpdateSubscription) {
      this.eventUpdateSubscription.unsubscribe();
    }
  }

  private refreshNotifications(): void {
    if (this.currentUser && this.currentUser.pets && this.currentUser.pets.length > 0) {
      console.log('Layout: Recarregando notificações...');
      this.loadUpcomingEventsCount(this.currentUser.pets);
    }
  }

  loadUserProfile(): void {
    this.tutorService.getMyProfile().subscribe({
      next: (user) => {
        this.currentUser = user;
        
        // Carregar contagem real de eventos próximos
        if (user.pets && user.pets.length > 0) {
          this.loadUpcomingEventsCount(user.pets);
        } else {
          this.upcomingEventsCount = 0;
        }
      },
      error: () => {
        console.error('Error loading user profile');
        this.upcomingEventsCount = 0;
      }
    });
  }

  private loadUpcomingEventsCount(pets: any[]): void {
    console.log('=== LAYOUT: Carregando contagem de eventos próximos ===');
    
    const petEventRequests = pets.map(pet => 
      this.eventService.listByPet(pet.id)
    );

    forkJoin(petEventRequests).subscribe({
      next: (petEventsArrays) => {
        const allEvents: any[] = [];
        
        petEventsArrays.forEach((petEvents, index) => {
          const pet = pets[index];
          
          if (Array.isArray(petEvents)) {
            petEvents.forEach((event: any) => {
              allEvents.push({
                id: event.id,
                type: event.type,
                description: event.description,
                dateStart: event.dateStart,
                petId: pet.id,
                petName: pet.name,
                status: event.status || 'PENDING'
              });
            });
          }
        });
        
        // Contar apenas eventos próximos (próximos 7 dias)
        const now = new Date();
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        
        const upcomingEvents = allEvents.filter(event => {
          const eventDate = new Date(event.dateStart);
          const isNotDone = !isEventDone(event.status);
          const isInFuture = eventDate >= now;
          const isWithinWeek = eventDate <= nextWeek;
          
          return isNotDone && isInFuture && isWithinWeek;
        });
        
        // Ordenar por data (mais próximos primeiro)
        upcomingEvents.sort((a, b) => new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime());
        
        this.upcomingEventsCount = upcomingEvents.length;
        this.upcomingEventsList = upcomingEvents.slice(0, 5); // Mostrar apenas os 5 primeiros
        
        console.log('LAYOUT: Eventos próximos contados:', this.upcomingEventsCount);
        console.log('LAYOUT: Lista de eventos próximos:', this.upcomingEventsList);
      },
      error: (error) => {
        console.error('LAYOUT: Erro ao carregar eventos:', error);
        this.upcomingEventsCount = 0;
        this.upcomingEventsList = [];
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  getEventIcon(type: string): string {
    const icons: { [key: string]: string } = {
      VACCINE: 'vaccines',
      MEDICINE: 'medication',
      DIARY: 'book',
      BREED: 'favorite',
      SERVICE: 'content_cut'
    };
    return icons[type] || 'event';
  }

  formatEventDate(dateString: string): string {
    if (!dateString) return 'Data inválida';
    
    const eventDate = new Date(dateString);
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const dayAfterTomorrow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    
    // Resetar horas para comparação apenas de datas
    const eventDateOnly = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
    const nowDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrowDateOnly = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
    const dayAfterTomorrowDateOnly = new Date(dayAfterTomorrow.getFullYear(), dayAfterTomorrow.getMonth(), dayAfterTomorrow.getDate());
    
    if (eventDateOnly.getTime() === nowDateOnly.getTime()) {
      return `Hoje às ${eventDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (eventDateOnly.getTime() === tomorrowDateOnly.getTime()) {
      return `Amanhã às ${eventDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (eventDateOnly.getTime() === dayAfterTomorrowDateOnly.getTime()) {
      return `Depois de amanhã às ${eventDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return eventDate.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }
}
