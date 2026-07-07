import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ToastService } from '../../core/services/toast.service';
import { forkJoin, Subscription } from 'rxjs';
import { TutorService } from '../../core/services/tutor.service';
import { EventService } from '../../core/services/event.service';
import { EventStateService } from '../../core/services/event-state.service';
import { UserStateService } from '../../core/services/user-state.service';
import { TutorDetailResult } from '../../shared/models/tutor.model';
import { EventSummary, isEventDone } from '../../core/models/event.model';
import { PageHeaderComponent } from '../../shared/components/ui/page-header.component';
import { StatCardComponent } from '../../shared/components/ui/stat-card.component';
import { PetAvatarComponent } from '../../shared/components/ui/pet-avatar.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    PageHeaderComponent,
    StatCardComponent,
    PetAvatarComponent
  ],
  template: `
    <div class="profile-page">
      <rp-page-header overline="Sua conta" title="Meu perfil"
                      subtitle="Seus dados e um resumo do seu quintal.">
      </rp-page-header>

      <div class="profile-grid">
        <section class="panel form-panel">
          <div class="panel-title">
            <div class="avatar-wrap">
              @if (currentUser?.avatar && !avatarFailed) {
                <img [src]="currentUser!.avatar" alt="" (error)="avatarFailed = true">
              } @else {
                <span class="avatar-fallback">{{ userInitial }}</span>
              }
            </div>
            <div class="panel-title-tx">
              <h2>{{ currentUser?.firstName }} {{ currentUser?.lastName }}</h2>
              <p>{{ currentUser?.email }}</p>
            </div>
          </div>

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
              <mat-label>URL do avatar</mat-label>
              <input matInput formControlName="avatar" type="url"
                     placeholder="https://exemplo.com/sua-foto.jpg">
              <mat-icon matSuffix>photo_camera</mat-icon>
              <mat-hint>Cole aqui a URL da sua foto de perfil</mat-hint>
            </mat-form-field>

            <div class="form-actions">
              <button mat-flat-button type="submit"
                      [disabled]="profileForm.invalid || isUpdating">
                {{ isUpdating ? 'Salvando...' : 'Salvar alterações' }}
              </button>
            </div>
          </form>
        </section>

        <aside class="side">
          <div class="stats">
            <rp-stat-card [value]="currentUser?.pets?.length || 0"
                          label="pets no quintal"
                          link="/pets" linkLabel="Ver pets"></rp-stat-card>
            <rp-stat-card [value]="upcomingEvents"
                          label="cuidados nos próximos 7 dias"
                          link="/events" linkLabel="Ver agenda"
                          [accent]="upcomingEvents > 0"></rp-stat-card>
            <rp-stat-card [value]="totalEvents"
                          label="cuidados registrados"></rp-stat-card>
          </div>

          @if (currentUser?.pets && currentUser!.pets.length > 0) {
            <section class="panel pets-panel">
              <h3>Seus pets</h3>
              <div class="pets-list">
                @for (pet of currentUser!.pets; track pet.id; let i = $index) {
                  <a class="pet-item" [routerLink]="['/pets', pet.id]">
                    <rp-pet-avatar [name]="pet.name" [species]="pet.species"
                                   size="sm" [seed]="i"></rp-pet-avatar>
                    <div class="pet-info">
                      <span class="pet-name">{{ pet.name }}</span>
                      <span class="pet-specie">{{ pet.species }}</span>
                    </div>
                    <mat-icon class="chev">chevron_right</mat-icon>
                  </a>
                }
              </div>
            </section>
          }
        </aside>
      </div>
    </div>
  `,
  styles: [`
    .profile-grid {
      display: grid;
      grid-template-columns: 1.4fr 1fr;
      gap: var(--q-space-4);
      align-items: start;
    }

    @media (max-width: 800px) {
      .profile-grid { grid-template-columns: 1fr; }
    }

    .panel {
      background: var(--q-surface);
      border: 1px solid var(--q-border);
      border-radius: var(--q-radius-lg);
      padding: var(--q-space-5);
      box-shadow: var(--q-shadow-sm);
    }

    .panel-title {
      display: flex;
      align-items: center;
      gap: var(--q-space-4);
      margin-bottom: var(--q-space-5);
    }

    .avatar-wrap {
      width: 64px;
      height: 64px;
      border-radius: var(--q-organic-1);
      overflow: hidden;
      flex-shrink: 0;
      background: var(--q-green-600);
    }

    .avatar-wrap img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .avatar-fallback {
      width: 100%;
      height: 100%;
      display: grid;
      place-items: center;
      color: var(--q-surface);
      font-family: var(--q-font-display);
      font-weight: 700;
      font-size: 1.5rem;
    }

    .panel-title-tx h2 {
      margin: 0;
      font-size: 1.25rem;
    }

    .panel-title-tx p {
      margin: 2px 0 0;
      color: var(--q-text-2);
      font-size: 0.8438rem;
    }

    form {
      display: flex;
      flex-direction: column;
      gap: var(--q-space-1);
    }

    .form-row {
      display: flex;
      gap: var(--q-space-3);
    }

    .half-width { flex: 1; min-width: 0; }
    .full-width { width: 100%; }

    @media (max-width: 480px) {
      .form-row { flex-direction: column; gap: var(--q-space-1); }
    }

    .form-actions {
      margin-top: var(--q-space-3);
    }

    .side {
      display: grid;
      gap: var(--q-space-4);
    }

    .stats {
      display: grid;
      gap: var(--q-space-3);
    }

    .pets-panel h3 {
      margin: 0 0 var(--q-space-3);
      font-size: 1.1rem;
    }

    .pets-list {
      display: grid;
      gap: var(--q-space-1);
    }

    .pet-item {
      display: flex;
      align-items: center;
      gap: var(--q-space-3);
      padding: var(--q-space-2);
      border-radius: var(--q-radius-sm);
      text-decoration: none;
      color: inherit;
      transition: background 0.15s ease;
    }

    .pet-item:hover {
      background: var(--q-surface-2);
    }

    .pet-info {
      flex: 1;
      min-width: 0;
      display: grid;
    }

    .pet-name {
      font-weight: 600;
      font-size: 0.9063rem;
      color: var(--q-ink);
    }

    .pet-specie {
      font-size: 0.75rem;
      color: var(--q-text-2);
    }

    .chev {
      color: var(--q-text-3);
    }
  `]
})
export class ProfileComponent implements OnInit, OnDestroy {
  profileForm: FormGroup;
  currentUser: TutorDetailResult | null = null;
  isUpdating = false;
  totalEvents = 0;
  upcomingEvents = 0;
  avatarFailed = false;
  private eventUpdateSubscription?: Subscription;

  constructor(
    private fb: FormBuilder,
    private tutorService: TutorService,
    private eventService: EventService,
    private eventStateService: EventStateService,
    private userStateService: UserStateService,
    private toast: ToastService
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
      this.refreshEventData();
    });
  }

  ngOnDestroy(): void {
    if (this.eventUpdateSubscription) {
      this.eventUpdateSubscription.unsubscribe();
    }
  }

  get userInitial(): string {
    return (this.currentUser?.firstName || '?').charAt(0).toUpperCase();
  }

  private refreshEventData(): void {
    if (this.currentUser && this.currentUser.pets && this.currentUser.pets.length > 0) {
      this.loadEventsForAllPets(this.currentUser.pets);
    }
  }

  loadProfile(): void {
    this.tutorService.getMyProfileCached().subscribe({
      next: (user) => {
        this.currentUser = user;
        this.avatarFailed = false;
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
        this.toast.error('Erro ao carregar perfil');
      }
    });
  }

  private loadEventsForAllPets(pets: any[]): void {
    const petEventRequests = pets.map(pet => this.eventService.listByPetCached(pet.id));

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
                description: event.description,
                dateStart: event.dateStart,
                petId: pet.id,
                status: event.status || 'PENDING'
              });
            });
          }
        });

        this.totalEvents = allEvents.length;
        const upcomingEvents = this.getUpcomingEvents(allEvents);
        this.upcomingEvents = upcomingEvents.length;
      },
      error: () => {
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
          this.toast.success('Perfil atualizado com sucesso!');
          this.isUpdating = false;

          // Notificar outros componentes sobre a atualização do perfil
          this.userStateService.notifyUserUpdated();
        },
        error: () => {
          this.toast.error('Erro ao atualizar perfil');
          this.isUpdating = false;
        }
      });
    }
  }
}
