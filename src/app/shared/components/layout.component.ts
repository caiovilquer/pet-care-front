import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { forkJoin, Subscription } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';
import { TutorService } from '../../core/services/tutor.service';
import { EventService } from '../../core/services/event.service';
import { EventStateService } from '../../core/services/event-state.service';
import { DateTimeService } from '../../core/services/datetime.service';
import { UserStateService } from '../../core/services/user-state.service';
import { TutorDetailResult } from '../../shared/models/tutor.model';
import { isEventDone } from '../../core/models/event.model';
import { FooterComponent } from './ui/footer.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    MatTooltipModule,
    FooterComponent
  ],
  template: `
    <div class="shell">
      <header class="rp-header">
        <a routerLink="/dashboard" class="wordmark" aria-label="RotinaPet — início">
          rotina<b>pet</b><span class="dot" aria-hidden="true"></span>
        </a>

        <nav class="desktop-nav" aria-label="Navegação principal">
          <a routerLink="/dashboard" routerLinkActive="on">Início</a>
          <a routerLink="/pets" routerLinkActive="on">Pets</a>
          <a routerLink="/events" routerLinkActive="on">Agenda</a>
          <a routerLink="/petshops" [class.on]="isNearbyActive">Por perto</a>
        </nav>

        <span class="spacer"></span>

        <div class="header-actions">
          <button mat-icon-button (click)="toggleTheme()"
                  [matTooltip]="isDark ? 'Tema claro' : 'Tema escuro'">
            <mat-icon>{{ isDark ? 'light_mode' : 'dark_mode' }}</mat-icon>
          </button>

          <button mat-icon-button [matMenuTriggerFor]="notificationMenu"
                  class="bell" matTooltip="Cuidados próximos"
                  [attr.aria-label]="'Notificações: ' + upcomingEventsCount + ' cuidados próximos'">
            <mat-icon>notifications_none</mat-icon>
            @if (upcomingEventsCount > 0) {
              <span class="badge">{{ upcomingEventsCount > 9 ? '9+' : upcomingEventsCount }}</span>
            }
          </button>

          <button mat-icon-button [matMenuTriggerFor]="userMenu" class="avatar-btn"
                  aria-label="Menu do usuário">
            @if (currentUser?.avatar && !avatarFailed) {
              <img [src]="currentUser!.avatar" alt="" class="avatar-img"
                   (error)="avatarFailed = true">
            } @else {
              <span class="avatar-fallback">{{ userInitial }}</span>
            }
          </button>
        </div>
      </header>

      <main class="rp-main">
        <router-outlet></router-outlet>
        <rp-footer [isDark]="isDark" (themeToggle)="toggleTheme()"></rp-footer>
      </main>

      <nav class="rp-bottom-nav" aria-label="Navegação principal">
        <a routerLink="/dashboard" routerLinkActive="on">
          <mat-icon>home</mat-icon><span>Início</span>
        </a>
        <a routerLink="/pets" routerLinkActive="on">
          <mat-icon>pets</mat-icon><span>Pets</span>
        </a>
        <a routerLink="/events" routerLinkActive="on">
          <mat-icon>calendar_month</mat-icon><span>Agenda</span>
        </a>
        <a routerLink="/petshops" [class.on]="isNearbyActive">
          <mat-icon>near_me</mat-icon><span>Por perto</span>
        </a>
        <a routerLink="/profile" routerLinkActive="on">
          <mat-icon>person_outline</mat-icon><span>Perfil</span>
        </a>
      </nav>
    </div>

    <!-- Menu do usuário -->
    <mat-menu #userMenu="matMenu" xPosition="before">
      @if (currentUser) {
        <div class="menu-user-info" (click)="$event.stopPropagation()">
          <p class="menu-user-name">{{ currentUser.firstName }} {{ currentUser.lastName }}</p>
          <p class="menu-user-email">{{ currentUser.email }}</p>
        </div>
        <mat-divider></mat-divider>
      }
      <button mat-menu-item routerLink="/profile">
        <mat-icon>person_outline</mat-icon>
        <span>Meu perfil</span>
      </button>
      <button mat-menu-item (click)="logout()">
        <mat-icon>logout</mat-icon>
        <span>Sair</span>
      </button>
    </mat-menu>

    <!-- Menu de notificações -->
    <mat-menu #notificationMenu="matMenu" xPosition="before" class="rp-notif-menu">
      <div class="notif-head" (click)="$event.stopPropagation()">
        <span class="q-overline">Próximos 7 dias</span>
        <h4>Cuidados próximos</h4>
      </div>
      <mat-divider></mat-divider>
      @if (upcomingEventsCount > 0) {
        @for (event of upcomingEventsList; track event.id) {
          <div class="notif-item" (click)="$event.stopPropagation()">
            <div class="q-ev-icon q-ev-{{ event.type.toLowerCase() }}">
              <mat-icon>{{ getEventIcon(event.type) }}</mat-icon>
            </div>
            <div class="notif-tx">
              <span class="notif-desc">{{ event.description }}</span>
              <span class="notif-when">{{ formatEventDate(event.dateStart) }}
                @if (event.petName) { · {{ event.petName }} }
              </span>
            </div>
          </div>
        }
        <mat-divider></mat-divider>
        <button mat-menu-item routerLink="/events" class="notif-all">
          <span>Ver agenda completa</span>
        </button>
      } @else {
        <div class="notif-empty" (click)="$event.stopPropagation()">
          <p>Por aqui está tranquilo — nenhum cuidado nos próximos dias.</p>
        </div>
        <button mat-menu-item routerLink="/events" class="notif-all">
          <span>Abrir agenda</span>
        </button>
      }
    </mat-menu>
  `,
  styles: [`
    .shell {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background: var(--q-bg);
    }

    /* ---------- header ---------- */
    .rp-header {
      position: sticky;
      top: 0;
      z-index: 100;
      display: flex;
      align-items: center;
      gap: var(--q-space-5);
      padding: 0 var(--q-space-5);
      height: 64px;
      background: color-mix(in srgb, var(--q-bg) 88%, transparent);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--q-border);
    }

    .wordmark {
      font-family: var(--q-font-display);
      font-size: 1.35rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: var(--q-ink);
      text-decoration: none;
      display: inline-flex;
      align-items: baseline;
    }
    .wordmark b { color: var(--q-green-600); font-weight: 700; }
    .wordmark .dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--q-ipe-500);
      margin-left: 3px;
      align-self: flex-start;
      margin-top: 7px;
    }

    .desktop-nav {
      display: flex;
      gap: var(--q-space-1);
    }
    .desktop-nav a {
      font-size: 0.9063rem;
      font-weight: 600;
      color: var(--q-text-2);
      text-decoration: none;
      padding: 7px 14px;
      border-radius: var(--q-radius-pill);
      transition: color 0.15s ease, background 0.15s ease;
    }
    .desktop-nav a:hover { color: var(--q-ink); background: var(--q-surface-2); }
    .desktop-nav a.on { color: var(--q-green-600); background: var(--q-green-50); }

    .spacer { flex: 1; }

    .header-actions {
      display: flex;
      align-items: center;
      gap: var(--q-space-1);
    }
    .header-actions .mat-mdc-icon-button { color: var(--q-text-2); }

    .bell { position: relative; }
    .badge {
      position: absolute;
      top: 5px;
      right: 4px;
      min-width: 17px;
      height: 17px;
      padding: 0 4px;
      display: grid;
      place-items: center;
      background: var(--q-ipe-500);
      color: #3A2D00;
      font-size: 0.6563rem;
      font-weight: 700;
      border-radius: 9px;
      pointer-events: none;
    }

    .avatar-btn {
      width: 40px;
      height: 40px;
      padding: 0;
      flex-shrink: 0;
      overflow: hidden;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .avatar-img {
      width: 32px;
      height: 32px;
      aspect-ratio: 1 / 1;
      border-radius: 50%;
      object-fit: cover;
      display: block;
      flex-shrink: 0;
    }
    .avatar-fallback {
      width: 32px;
      height: 32px;
      aspect-ratio: 1 / 1;
      border-radius: 50%;
      display: grid;
      place-items: center;
      flex-shrink: 0;
      background: var(--q-green-600);
      color: var(--q-surface);
      font-family: var(--q-font-display);
      font-weight: 700;
      font-size: 0.9rem;
    }

    /* ---------- conteúdo ---------- */
    .rp-main {
      flex: 1;
      width: 100%;
      max-width: 1120px;
      margin: 0 auto;
      padding: var(--q-space-6) var(--q-space-5) var(--q-space-7);
    }

    /* ---------- bottom nav (mobile) ---------- */
    .rp-bottom-nav {
      display: none;
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 100;
      background: var(--q-surface);
      border-top: 1px solid var(--q-border);
      padding: 6px 4px calc(6px + env(safe-area-inset-bottom));
      justify-content: space-around;
    }
    .rp-bottom-nav a {
      display: grid;
      justify-items: center;
      gap: 2px;
      min-width: 56px;
      padding: 4px 8px;
      border-radius: var(--q-radius-sm);
      font-size: 0.625rem;
      font-weight: 600;
      color: var(--q-text-3);
      text-decoration: none;
    }
    .rp-bottom-nav a mat-icon { font-size: 22px; width: 22px; height: 22px; }
    .rp-bottom-nav a.on { color: var(--q-green-600); }

    @media (max-width: 959px) {
      .desktop-nav { display: none; }
      .rp-bottom-nav { display: flex; }
      .rp-header { height: 56px; padding: 0 var(--q-space-3) 0 var(--q-space-4); }
      .rp-main {
        padding: var(--q-space-4) var(--q-space-4) calc(76px + env(safe-area-inset-bottom));
      }
    }

    /* ---------- menus ---------- */
    .menu-user-info { padding: 12px 16px 10px; min-width: 220px; }
    .menu-user-name { margin: 0; font-weight: 600; font-size: 0.9375rem; color: var(--q-ink); }
    .menu-user-email {
      margin: 2px 0 0;
      font-size: 0.7813rem;
      color: var(--q-text-3);
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .notif-head { padding: 14px 16px 10px; }
    .notif-head h4 { margin: 4px 0 0; font-size: 1rem; }
    .notif-item {
      display: flex;
      gap: 12px;
      align-items: center;
      padding: 10px 16px;
      max-width: 340px;
    }
    .notif-tx { min-width: 0; display: grid; }
    .notif-desc {
      font-size: 0.8438rem;
      font-weight: 600;
      color: var(--q-ink);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .notif-when { font-size: 0.75rem; color: var(--q-text-2); }
    .notif-all span { color: var(--q-green-600); font-weight: 600; }
    .notif-empty {
      padding: 18px 16px;
      max-width: 300px;
    }
    .notif-empty p { margin: 0; font-size: 0.8438rem; color: var(--q-text-2); }
  `]
})
export class LayoutComponent implements OnInit, OnDestroy {
  currentUser: TutorDetailResult | null = null;
  upcomingEventsCount = 0;
  upcomingEventsList: any[] = [];
  avatarFailed = false;
  isDark = false;
  isProduction = environment.production;
  private eventUpdateSubscription?: Subscription;
  private userUpdateSubscription?: Subscription;

  constructor(
    private authService: AuthService,
    private tutorService: TutorService,
    private eventService: EventService,
    private eventStateService: EventStateService,
    private dateTimeService: DateTimeService,
    private userStateService: UserStateService,
    private router: Router
  ) {
    this.isDark = this.resolveIsDark();
  }

  ngOnInit(): void {
    this.loadUserProfile();

    this.eventUpdateSubscription = this.eventStateService.eventUpdated$.subscribe(() => {
      this.refreshNotifications();
    });

    this.userUpdateSubscription = this.userStateService.userUpdated$.subscribe(() => {
      this.refreshUserProfile();
    });
  }

  ngOnDestroy(): void {
    this.eventUpdateSubscription?.unsubscribe();
    this.userUpdateSubscription?.unsubscribe();
  }

  get isNearbyActive(): boolean {
    const url = this.router.url;
    return url.startsWith('/petshops') || url.startsWith('/veterinaries');
  }

  get userInitial(): string {
    return (this.currentUser?.firstName || '?').charAt(0).toUpperCase();
  }

  toggleTheme(): void {
    const next = this.isDark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem('rp-theme', next);
    } catch { /* localStorage indisponível */ }
    this.isDark = next === 'dark';
  }

  private resolveIsDark(): boolean {
    const attr = document.documentElement.getAttribute('data-theme');
    if (attr === 'dark') return true;
    return false;
  }

  private refreshNotifications(): void {
    if (this.currentUser?.pets && this.currentUser.pets.length > 0) {
      this.loadUpcomingEventsCount(this.currentUser.pets);
    }
  }

  loadUserProfile(): void {
    this.tutorService.getMyProfileCached().subscribe({
      next: (user) => {
        this.currentUser = user;
        this.avatarFailed = false;
        if (user.pets && user.pets.length > 0) {
          this.loadUpcomingEventsCount(user.pets);
        } else {
          this.upcomingEventsCount = 0;
        }
      },
      error: () => {
        this.upcomingEventsCount = 0;
      }
    });
  }

  private loadUpcomingEventsCount(pets: any[]): void {
    const petEventRequests = pets.map(pet => this.eventService.listByPetCached(pet.id));

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
                status: event.status
              });
            });
          }
        });

        const now = new Date();
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        const upcomingEvents = allEvents.filter(event => {
          const eventDate = new Date(event.dateStart);
          return !isEventDone(event.status) && eventDate >= now && eventDate <= nextWeek;
        });

        upcomingEvents.sort((a, b) =>
          new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime());

        this.upcomingEventsCount = upcomingEvents.length;
        this.upcomingEventsList = upcomingEvents.slice(0, 5);
      },
      error: () => {
        this.upcomingEventsCount = 0;
        this.upcomingEventsList = [];
      }
    });
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/auth/login']),
      error: () => this.router.navigate(['/auth/login'])
    });
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

    const eventDate = this.dateTimeService.parseAPIDate(dateString);
    if (!eventDate) return 'Data inválida';

    const now = new Date();
    const time = eventDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const dayDiff = this.daysBetween(now, eventDate);

    if (dayDiff === 0) return `Hoje às ${time}`;
    if (dayDiff === 1) return `Amanhã às ${time}`;
    return eventDate.toLocaleDateString('pt-BR', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  }

  private daysBetween(from: Date, to: Date): number {
    const a = new Date(from.getFullYear(), from.getMonth(), from.getDate());
    const b = new Date(to.getFullYear(), to.getMonth(), to.getDate());
    return Math.round((b.getTime() - a.getTime()) / 86400000);
  }

  private refreshUserProfile(): void {
    this.tutorService.getMyProfileCached().subscribe({
      next: (user) => {
        this.currentUser = user;
        this.avatarFailed = false;
        if (user.pets && user.pets.length > 0) {
          this.loadUpcomingEventsCount(user.pets);
        } else {
          this.upcomingEventsCount = 0;
        }
      },
      error: () => { /* mantém estado atual */ }
    });
  }
}
