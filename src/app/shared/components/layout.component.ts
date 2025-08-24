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
import { MatDividerModule } from '@angular/material/divider';
import { forkJoin, Subscription } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { TutorService } from '../../core/services/tutor.service';
import { EventService } from '../../core/services/event.service';
import { EventStateService } from '../../core/services/event-state.service';
import { UserStateService } from '../../core/services/user-state.service';
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
    MatBadgeModule,
    MatDividerModule
  ],
  template: `
    <mat-sidenav-container class="sidenav-container">
      <mat-sidenav #drawer class="sidenav" fixedInViewport mode="side" opened>
        <mat-toolbar class="sidenav-header">
          <mat-icon class="logo-icon">pets</mat-icon>
          <span class="logo-text">Pet Care</span>
          <div class="paw-decoration">🐾</div>
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
          
          <mat-divider></mat-divider>
          
          <h3 class="nav-section-title">Localidades</h3>
          
          <a mat-list-item routerLink="/petshops" routerLinkActive="active">
            <mat-icon matListItemIcon>store</mat-icon>
            <span matListItemTitle>Petshops</span>
          </a>
          
          <a mat-list-item routerLink="/veterinaries" routerLinkActive="active">
            <mat-icon matListItemIcon>local_hospital</mat-icon>
            <span matListItemTitle>Veterinários</span>
          </a>
          
          <mat-divider></mat-divider>
          
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
                      [class.has-notifications]="upcomingEventsCount > 0"
                      aria-hidden="false">
              notifications
            </mat-icon>
          </button>
          
          <button mat-icon-button [matMenuTriggerFor]="userMenu" class="avatar-button">
            <div class="toolbar-avatar">
              <img *ngIf="currentUser?.avatar; else defaultAvatar" 
                   [src]="currentUser!.avatar" 
                   [alt]="(currentUser!.firstName || '') + ' ' + (currentUser!.lastName || '')"
                   class="avatar-image"
                   (error)="onAvatarError($event)">
              <ng-template #defaultAvatar>
                <mat-icon>account_circle</mat-icon>
              </ng-template>
            </div>
          </button>
        </mat-toolbar>

        <main class="main-content">
          <router-outlet></router-outlet>
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>

    <!-- User Menu -->
    <mat-menu #userMenu="matMenu" class="user-menu">
      <div class="user-info" *ngIf="currentUser">
        <div class="user-avatar">
          <img *ngIf="currentUser.avatar; else defaultMenuAvatar" 
               [src]="currentUser.avatar" 
               [alt]="(currentUser.firstName || '') + ' ' + (currentUser.lastName || '')"
               class="avatar-image"
               (error)="onAvatarError($event)">
          <ng-template #defaultMenuAvatar>
            <mat-icon>person</mat-icon>
          </ng-template>
        </div>
        <div class="user-details">
          <p class="user-name">{{currentUser.firstName}} {{currentUser.lastName}}</p>
          <p class="user-email">{{currentUser.email}}</p>
        </div>
      </div>
      <mat-divider></mat-divider>
      <button mat-menu-item routerLink="/profile" class="menu-item">
        <mat-icon>person</mat-icon>
        <span>Meu Perfil</span>
      </button>
      <button mat-menu-item (click)="logout()" class="menu-item logout-item">
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
      background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
    }

    .sidenav {
      width: 280px;
      background: linear-gradient(180deg, #ffffff 0%, var(--bg-primary) 100%);
      border-right: 1px solid var(--border-light);
      box-shadow: 2px 0 20px rgba(99, 102, 241, 0.08);
      overflow: hidden;
    }

    .sidenav-header {
      background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-light) 50%, var(--secondary-color) 100%);
      color: white;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 20px 24px;
      position: relative;
      overflow: hidden;
    }

    .sidenav-header::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="20" cy="20" r="2" fill="rgba(255,255,255,0.1)"/><circle cx="60" cy="40" r="1.5" fill="rgba(255,255,255,0.1)"/><circle cx="80" cy="70" r="1" fill="rgba(255,255,255,0.1)"/><path d="M10,10 Q50,5 90,20" stroke="rgba(255,255,255,0.05)" stroke-width="1" fill="none"/></svg>');
      pointer-events: none;
    }

    .logo-icon {
      font-size: 28px;
      animation: float 3s ease-in-out infinite;
    }

    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-3px); }
    }

    .logo-text {
      font-size: 20px;
      font-weight: 600;
      letter-spacing: 0.5px;
      text-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .paw-decoration {
      margin-left: auto;
      font-size: 16px;
      opacity: 0.7;
      animation: float 4s ease-in-out infinite reverse;
    }

    .main-toolbar {
      position: sticky;
      top: 0;
      z-index: 1000;
      background: linear-gradient(90deg, #ffffff 0%, var(--bg-primary) 100%);
      border-bottom: 1px solid var(--border-light);
      box-shadow: 0 2px 10px rgba(0,0,0,0.05);
    }

    .toolbar-title {
      font-size: 22px;
      font-weight: 600;
      color: var(--primary-dark);
      letter-spacing: 0.3px;
    }

    .spacer {
      flex: 1 1 auto;
    }

    .main-content {
      padding: 32px;
      min-height: calc(100vh - 64px);
      background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
      position: relative;
    }

    .main-content::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: 
        radial-gradient(circle at 20% 20%, rgba(99, 102, 241, 0.03) 0%, transparent 50%),
        radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.03) 0%, transparent 50%);
      pointer-events: none;
    }

    .active {
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%);
      color: var(--primary-dark);
      border-radius: 12px;
      margin: 4px 12px;
      transform: translateX(4px);
      box-shadow: 0 2px 8px rgba(99, 102, 241, 0.2);
    }

    .active mat-icon {
      color: var(--primary-dark);
    }

    mat-nav-list {
      overflow: hidden;
      height: auto;
      max-height: none;
    }

    mat-nav-list a {
      margin: 4px 12px;
      border-radius: 12px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
    }

    mat-nav-list a:hover:not(.active) {
      background: rgba(99, 102, 241, 0.08);
      transform: translateX(2px);
    }

    mat-nav-list a mat-icon {
      color: var(--primary-color);
      transition: all 0.3s ease;
    }

    mat-nav-list a:hover mat-icon {
      transform: scale(1.1);
    }

    .user-info {
      padding: 20px;
      background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
      border-radius: 12px;
      margin: 8px;
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .user-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-light) 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
      overflow: hidden;
    }

    .user-avatar .avatar-image {
      width: 48px;
      height: 48px;
      object-fit: cover;
      border-radius: 50%;
    }

    .user-avatar mat-icon {
      color: white;
      font-size: 24px;
    }

    .user-details {
      flex: 1;
    }

    .user-name {
      font-weight: 600;
      margin: 0;
      color: var(--primary-dark);
      font-size: 16px;
    }

    .user-email {
      font-size: 13px;
      color: var(--text-secondary);
      margin: 6px 0 0 0;
      font-weight: 400;
    }

    .menu-item {
      padding: 12px 20px;
      transition: all 0.3s ease;
      border-radius: 8px;
      margin: 4px 8px;
    }

    .menu-item:hover {
      background: rgba(99, 102, 241, 0.1);
      color: var(--primary-dark);
    }

    .menu-item mat-icon {
      color: var(--primary-color);
      margin-right: 12px;
    }

    .logout-item:hover {
      background: rgba(244, 67, 54, 0.1);
      color: #d32f2f;
    }

    .logout-item:hover mat-icon {
      color: #d32f2f;
    }

    /* Estilização moderna dos botões da toolbar */
    .main-toolbar button {
      transition: all 0.3s ease;
      border-radius: 12px;
    }

    .main-toolbar button:hover {
      background: rgba(99, 102, 241, 0.1);
      transform: scale(1.05);
    }

    .main-toolbar button mat-icon {
      color: var(--primary-color);
    }

    /* Estilização do menu de notificações */
    .notification-header {
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 12px;
      background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-light) 100%);
      color: white;
    }

    .notification-header mat-icon {
      font-size: 24px;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }

    .notification-header h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      letter-spacing: 0.3px;
    }

    .notification-count {
      font-size: 12px;
      background: rgba(255, 255, 255, 0.2);
      padding: 4px 8px;
      border-radius: 12px;
      font-weight: 500;
    }

    .notification-content {
      max-height: 420px;
      overflow-y: auto;
      min-width: 380px;
      background: var(--bg-card);
    }

    .notification-item {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      padding: 16px 20px;
      border-bottom: 1px solid var(--border-light);
      transition: all 0.3s ease;
      position: relative;
    }

    .notification-item::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 3px;
      background: linear-gradient(180deg, var(--primary-color) 0%, var(--primary-light) 100%);
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .notification-item:hover {
      background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
      transform: translateX(4px);
    }

    .notification-item:hover::before {
      opacity: 1;
    }

    .notification-item:last-child {
      border-bottom: none;
    }

    .event-icon {
      flex-shrink: 0;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      position: relative;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .event-icon::after {
      content: '';
      position: absolute;
      top: -2px;
      left: -2px;
      right: -2px;
      bottom: -2px;
      border-radius: 50%;
      background: linear-gradient(45deg, transparent, rgba(255,255,255,0.5), transparent);
      z-index: -1;
    }

    .event-icon mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .event-icon-vaccine { 
      background: linear-gradient(135deg, var(--success-bg) 0%, rgba(16, 185, 129, 0.2) 100%); 
      color: var(--success-color); 
      border: 2px solid rgba(16, 185, 129, 0.2);
    }
    .event-icon-medicine { 
      background: linear-gradient(135deg, var(--warning-bg) 0%, rgba(245, 158, 11, 0.2) 100%); 
      color: var(--warning-color); 
      border: 2px solid rgba(245, 158, 11, 0.2);
    }
    .event-icon-diary { 
      background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0.2) 100%); 
      color: var(--primary-light); 
      border: 2px solid rgba(139, 92, 246, 0.2);
    }
    .event-icon-breed { 
      background: linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(6, 182, 212, 0.2) 100%); 
      color: var(--secondary-color); 
      border: 2px solid rgba(6, 182, 212, 0.2);
    }
    .event-icon-service { 
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(99, 102, 241, 0.2) 100%); 
      color: var(--primary-color); 
      border: 2px solid rgba(99, 102, 241, 0.2);
    }

    .event-info {
      flex: 1;
      min-width: 0;
    }

    .event-description {
      font-weight: 600;
      color: var(--primary-dark);
      font-size: 15px;
      margin-bottom: 6px;
      line-height: 1.4;
    }

    .event-date {
      font-size: 13px;
      color: var(--text-secondary);
      margin-bottom: 4px;
      font-weight: 500;
    }

    .event-pet {
      font-size: 12px;
      color: var(--text-muted);
      font-style: italic;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .event-pet::before {
      content: '🐾';
      font-size: 10px;
    }

    .view-all-button {
      width: 100%;
      justify-content: center;
      color: var(--primary-color);
      font-weight: 600;
      padding: 16px;
      border-radius: 0 0 12px 12px;
      background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
      transition: all 0.3s ease;
    }

    .view-all-button:hover {
      background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-light) 100%);
      color: white;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
    }

    .no-notifications {
      padding: 32px 24px;
      text-align: center;
      color: var(--text-muted);
      background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
    }

    .no-notifications-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: var(--text-muted);
      margin-bottom: 16px;
      animation: float 3s ease-in-out infinite;
    }

    .no-notifications p {
      margin: 0 0 20px 0;
      font-size: 16px;
      font-weight: 500;
    }

    .create-event-button {
      width: 100%;
      justify-content: center;
      color: var(--primary-color);
      font-weight: 600;
      background: rgba(99, 102, 241, 0.1);
      border-radius: 25px;
      padding: 12px;
      transition: all 0.3s ease;
    }

    .create-event-button:hover {
      background: var(--primary-color);
      color: white;
      transform: scale(1.05);
    }

    /* Animação e estilização do sino de notificação */
    .has-notifications {
      color: #ff6f00;
      position: relative;
    }

    .has-notifications::after {
      content: '';
      position: absolute;
      top: -2px;
      right: -2px;
      width: 8px;
      height: 8px;
      background: #ff6f00;
      border-radius: 50%;
      animation: pulse-dot 2s infinite;
    }

    @keyframes pulse-dot {
      0%, 100% { 
        transform: scale(1); 
        opacity: 1; 
      }
      50% { 
        transform: scale(1.3); 
        opacity: 0.7; 
      }
    }

    .has-notifications {
      animation: bell-ring 3s ease-in-out infinite;
    }

    @keyframes bell-ring {
      0%, 90%, 100% { transform: rotate(0deg); }
      5%, 15%, 25% { transform: rotate(-8deg); }
      10%, 20% { transform: rotate(8deg); }
    }

    /* Responsividade e otimizações */
    @media (max-width: 768px) {
      .sidenav { width: 100%; }
      .main-content { padding: 20px 16px; }
      .notification-content { min-width: 320px; max-height: 350px; }
      .toolbar-title { font-size: 18px; }
    }

    @media (max-width: 480px) {
      .sidenav-header { padding: 16px 20px; }
      .logo-text { font-size: 18px; }
      .main-content { padding: 16px 12px; }
    }

    /* Customizações globais */
    ::ng-deep .mat-mdc-menu-panel {
      border-radius: 16px !important;
      box-shadow: 0 8px 32px rgba(0,0,0,0.12) !important;
      border: 1px solid var(--border-light) !important;
      overflow: hidden !important;
    }

    /* Remove barra de rolagem do sidenav */
    ::ng-deep .mat-drawer-inner-container {
      overflow: hidden !important;
    }

    ::ng-deep .mat-sidenav {
      overflow: hidden !important;
    }

    ::ng-deep .mat-badge-content {
      background: linear-gradient(135deg, #ff6f00 0%, #ff8f00 100%) !important;
      color: white !important;
      font-weight: 600 !important;
      font-size: 11px !important;
      min-width: 18px !important;
      height: 18px !important;
      line-height: 18px !important;
    }

    .toolbar-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-light) 100%);
    }

    .toolbar-avatar .avatar-image {
      width: 40px;
      height: 40px;
      object-fit: cover;
      border-radius: 50%;
    }

    .toolbar-avatar mat-icon {
      color: white;
      font-size: 24px;
    }

    .avatar-button {
      padding: 4px !important;
      width: 48px !important;
      height: 48px !important;
    }

    .nav-section-title {
      padding: 16px 24px 8px 24px;
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      color: var(--primary-color);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      opacity: 0.8;
    }
  `]
})
export class LayoutComponent implements OnInit, OnDestroy {
  currentUser: TutorDetailResult | null = null;
  upcomingEventsCount = 0;
  upcomingEventsList: any[] = [];
  private eventUpdateSubscription?: Subscription;
  private userUpdateSubscription?: Subscription;

  constructor(
    private authService: AuthService,
    private tutorService: TutorService,
    private eventService: EventService,
    private eventStateService: EventStateService,
    private userStateService: UserStateService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadUserProfile();

    // Se inscrever para atualizações de eventos
    this.eventUpdateSubscription = this.eventStateService.eventUpdated$.subscribe(() => {
  
      this.refreshNotifications();
    });

    // Se inscrever para atualizações do perfil do usuário
    this.userUpdateSubscription = this.userStateService.userUpdated$.subscribe(() => {
  
      this.refreshUserProfile();
    });
  }

  ngOnDestroy(): void {
    if (this.eventUpdateSubscription) {
      this.eventUpdateSubscription.unsubscribe();
    }
    if (this.userUpdateSubscription) {
      this.userUpdateSubscription.unsubscribe();
    }
  }

  private refreshNotifications(): void {
    if (this.currentUser && this.currentUser.pets && this.currentUser.pets.length > 0) {
  
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
  
        this.upcomingEventsCount = 0;
      }
    });
  }

  private loadUpcomingEventsCount(pets: any[]): void {
  

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
                status: event.status
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

  
      },
      error: (error) => {
  
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

  onAvatarError(event: any): void {
    // Esconder a imagem com erro e mostrar o ícone padrão
    event.target.style.display = 'none';
  }

  private refreshUserProfile(): void {
  
    this.tutorService.getMyProfile().subscribe({
      next: (user) => {
        this.currentUser = user;
  
        
        // Também recarregar notificações porque podem ter mudado com novos pets, etc.
        if (user.pets && user.pets.length > 0) {
          this.loadUpcomingEventsCount(user.pets);
        } else {
          this.upcomingEventsCount = 0;
        }
      },
      error: (error) => {
  
      }
    });
  }
}
