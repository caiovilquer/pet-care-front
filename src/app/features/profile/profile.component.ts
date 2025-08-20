import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { forkJoin, Subscription } from 'rxjs';
import { TutorService } from '../../core/services/tutor.service';
import { EventService } from '../../core/services/event.service';
import { EventStateService } from '../../core/services/event-state.service';
import { UserStateService } from '../../core/services/user-state.service';
import { TutorDetailResult } from '../../shared/models/tutor.model';
import { EventSummary, isEventDone } from '../../core/models/event.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatDividerModule
  ],
  template: `
    <div class="profile-container">
      <h1>Meu Perfil</h1>

      <div class="profile-content">
        <mat-card class="profile-card">
          <mat-card-header>
            <div mat-card-avatar class="profile-avatar">
              <img *ngIf="currentUser?.avatar; else defaultProfileAvatar" 
                   [src]="currentUser!.avatar" 
                   [alt]="(currentUser!.firstName || '') + ' ' + (currentUser!.lastName || '')"
                   class="profile-avatar-image">
              <ng-template #defaultProfileAvatar>
                <mat-icon>person</mat-icon>
              </ng-template>
            </div>
            <mat-card-title>Informações Pessoais</mat-card-title>
            <mat-card-subtitle>Gerencie suas informações de perfil</mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <form [formGroup]="profileForm" (ngSubmit)="onUpdateProfile()">
              <div class="form-row">
                <mat-form-field appearance="outline" class="half-width">
                  <mat-label>Nome</mat-label>
                  <input matInput formControlName="firstName" required>
                  <mat-error *ngIf="profileForm.get('firstName')?.hasError('required')">
                    Nome é obrigatório
                  </mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline" class="half-width">
                  <mat-label>Sobrenome</mat-label>
                  <input matInput formControlName="lastName">
                </mat-form-field>
              </div>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Email</mat-label>
                <input matInput type="email" [value]="currentUser?.email" readonly>
                <mat-icon matSuffix>email</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Telefone</mat-label>
                <input matInput formControlName="phoneNumber" placeholder="(11) 99999-9999">
                <mat-icon matSuffix>phone</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>URL do Avatar</mat-label>
                <input matInput formControlName="avatar" type="url" 
                       placeholder="https://exemplo.com/sua-foto.jpg">
                <mat-icon matSuffix>photo_camera</mat-icon>
                <mat-hint>Cole aqui a URL da sua foto de perfil</mat-hint>
              </mat-form-field>

              <div class="form-actions">
                <button mat-raised-button color="primary" type="submit" 
                        [disabled]="profileForm.invalid || isUpdating">
                  {{isUpdating ? 'Salvando...' : 'Salvar Alterações'}}
                </button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>

        <mat-card class="stats-card">
          <mat-card-header>
            <mat-card-title>Estatísticas</mat-card-title>
            <mat-card-subtitle>Resumo da sua conta</mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <div class="stat-item">
              <mat-icon class="stat-icon pets-icon">pets</mat-icon>
              <div class="stat-info">
                <span class="stat-number">{{currentUser?.pets?.length || 0}}</span>
                <span class="stat-label">Pets cadastrados</span>
              </div>
            </div>

            <mat-divider></mat-divider>

            <div class="stat-item">
              <mat-icon class="stat-icon events-icon">event</mat-icon>
              <div class="stat-info">
                <span class="stat-number">{{totalEvents}}</span>
                <span class="stat-label">Eventos agendados</span>
              </div>
            </div>

            <mat-divider></mat-divider>

            <div class="stat-item">
              <mat-icon class="stat-icon calendar-icon">today</mat-icon>
              <div class="stat-info">
                <span class="stat-number">{{upcomingEvents}}</span>
                <span class="stat-label">Eventos próximos</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="pets-summary-card" *ngIf="currentUser?.pets && currentUser!.pets.length > 0">
          <mat-card-header>
            <mat-card-title>Meus Pets</mat-card-title>
            <mat-card-subtitle>Lista dos seus pets cadastrados</mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <div class="pets-list">
              <div class="pet-item" *ngFor="let pet of currentUser!.pets">
                <mat-icon class="pet-icon">pets</mat-icon>
                <div class="pet-info">
                  <span class="pet-name">{{pet.name}}</span>
                  <span class="pet-specie">{{pet.specie}}</span>
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .profile-container {
      max-width: 1200px;
      margin: 0 auto;
    }

    .profile-container h1 {
      font-size: 2rem;
      margin-bottom: 24px;
      color: #333;
    }

    .profile-content {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 24px;
    }

    .profile-card {
      grid-column: 1;
      grid-row: 1 / 3;
    }

    .stats-card {
      grid-column: 2;
      grid-row: 1;
    }

    .pets-summary-card {
      grid-column: 2;
      grid-row: 2;
    }

    .profile-avatar {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .profile-avatar-image {
      width: 40px;
      height: 40px;
      object-fit: cover;
      border-radius: 50%;
    }

    .form-row {
      display: flex;
      gap: 16px;
    }

    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }

    .half-width {
      width: 100%;
      margin-bottom: 16px;
    }

    .form-actions {
      margin-top: 24px;
    }

    .stat-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px 0;
    }

    .stat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
    }

    .pets-icon { color: var(--primary-color); }
    .events-icon { color: var(--secondary-color); }
    .calendar-icon { color: var(--accent-color); }

    .stat-info {
      display: flex;
      flex-direction: column;
    }

    .stat-number {
      font-size: 24px;
      font-weight: 600;
      color: #333;
    }

    .stat-label {
      font-size: 14px;
      color: #666;
    }

    .pets-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .pet-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px;
      border-radius: 8px;
      background: #f5f5f5;
    }

    .pet-icon {
      color: #667eea;
      font-size: 20px;
    }

    .pet-info {
      display: flex;
      flex-direction: column;
    }

    .pet-name {
      font-weight: 500;
      color: #333;
    }

    .pet-specie {
      font-size: 12px;
      color: #666;
    }

    @media (max-width: 768px) {
      .profile-content {
        grid-template-columns: 1fr;
      }

      .profile-card,
      .stats-card,
      .pets-summary-card {
        grid-column: 1;
        grid-row: auto;
      }

      .form-row {
        flex-direction: column;
        gap: 0;
      }
    }
  `]
})
export class ProfileComponent implements OnInit, OnDestroy {
  profileForm: FormGroup;
  currentUser: TutorDetailResult | null = null;
  isUpdating = false;
  totalEvents = 0;
  upcomingEvents = 0;
  private eventUpdateSubscription?: Subscription;

  constructor(
    private fb: FormBuilder,
    private tutorService: TutorService,
    private eventService: EventService,
    private eventStateService: EventStateService,
    private userStateService: UserStateService,
    private snackBar: MatSnackBar
  ) {
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: [''],
      phoneNumber: [''],
      avatar: ['']
    });
  }

  ngOnInit(): void {
    this.loadProfile();

    // Se inscrever para atualizações de eventos
    this.eventUpdateSubscription = this.eventStateService.eventUpdated$.subscribe(() => {
      console.log('Profile: Recebeu notificação de atualização de evento');
      this.refreshEventData();
    });
  }

  ngOnDestroy(): void {
    if (this.eventUpdateSubscription) {
      this.eventUpdateSubscription.unsubscribe();
    }
  }

  private refreshEventData(): void {
    if (this.currentUser && this.currentUser.pets && this.currentUser.pets.length > 0) {
      console.log('Profile: Recarregando dados dos eventos...');
      this.loadEventsForAllPets(this.currentUser.pets);
    }
  }

  loadProfile(): void {
    this.tutorService.getMyProfile().subscribe({
      next: (user) => {
        this.currentUser = user;
        this.profileForm.patchValue({
          firstName: user.firstName,
          lastName: user.lastName,
          phoneNumber: user.phoneNumber,
          avatar: user.avatar
        });

        // Carregar eventos reais dos pets
        if (user.pets && user.pets.length > 0) {
          this.loadEventsForAllPets(user.pets);
        } else {
          this.totalEvents = 0;
          this.upcomingEvents = 0;
        }
      },
      error: () => {
        this.snackBar.open('Erro ao carregar perfil', 'Fechar', { duration: 3000 });
      }
    });
  }

  private loadEventsForAllPets(pets: any[]): void {
    console.log('=== PERFIL: Carregando eventos dos pets ===');
    console.log('Pets para carregar eventos:', pets.map(p => ({ id: p.id, name: p.name })));

    const petEventRequests = pets.map(pet => {
      console.log(`PERFIL: Fazendo requisição para pet ${pet.id} (${pet.name})`);
      return this.eventService.listByPet(pet.id);
    });

    forkJoin(petEventRequests).subscribe({
      next: (petEventsArrays) => {
        console.log('PERFIL: Respostas dos eventos por pet:', petEventsArrays);

        // Combinar todos os eventos de todos os pets
        const allEvents: EventSummary[] = [];

        petEventsArrays.forEach((petEvents, index) => {
          const pet = pets[index];
          console.log(`PERFIL: Pet ${pet.id} (${pet.name}) - Eventos:`, petEvents);

          if (Array.isArray(petEvents)) {
            petEvents.forEach((event: any) => {
              allEvents.push({
                id: event.id,
                type: event.type,
                description: event.description,
                dateStart: event.dateStart,
                petId: pet.id,
                status: event.status || 'PENDING'
              });
            });
          }
        });

        console.log('PERFIL: Total de eventos coletados:', allEvents.length);

        this.totalEvents = allEvents.length;
        const upcomingEvents = this.getUpcomingEvents(allEvents);
        this.upcomingEvents = upcomingEvents.length;

        console.log('PERFIL: Total eventos:', this.totalEvents);
        console.log('PERFIL: Eventos próximos:', this.upcomingEvents);
      },
      error: (error) => {
        console.error('PERFIL: Erro ao carregar eventos:', error);
        this.totalEvents = 0;
        this.upcomingEvents = 0;
      }
    });
  }

  private getUpcomingEvents(events: EventSummary[]): EventSummary[] {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    return events.filter(event => {
      const eventDate = new Date(event.dateStart);
      const isNotDone = !isEventDone(event.status);
      const isInFuture = eventDate >= now;
      const isWithinWeek = eventDate <= nextWeek;

      return isNotDone && isInFuture && isWithinWeek;
    });
  }

  onUpdateProfile(): void {
    if (this.profileForm.valid && this.currentUser) {
      this.isUpdating = true;

      this.tutorService.updateProfile(this.currentUser.id, this.profileForm.value).subscribe({
        next: (updatedUser) => {
          this.currentUser = updatedUser;
          this.snackBar.open('Perfil atualizado com sucesso!', 'Fechar', { duration: 3000 });
          this.isUpdating = false;
          
          // Notificar outros componentes sobre a atualização do perfil
          this.userStateService.notifyUserUpdated();
        },
        error: () => {
          this.snackBar.open('Erro ao atualizar perfil', 'Fechar', { duration: 3000 });
          this.isUpdating = false;
        }
      });
    }
  }
}
