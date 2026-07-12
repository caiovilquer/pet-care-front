import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ToastService } from '../../core/services/toast.service';
import { Subscription } from 'rxjs';
import { TutorService } from '../../core/services/tutor.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { EventStateService } from '../../core/services/event-state.service';
import { UserStateService } from '../../core/services/user-state.service';
import { Tutor } from '../../core/models/tutor.model';
import { PageHeaderComponent } from '../../shared/components/ui/page-header.component';
import { StatCardComponent } from '../../shared/components/ui/stat-card.component';
import { PetAvatarComponent } from '../../shared/components/ui/pet-avatar.component';
import { PhotoUploadComponent } from '../../shared/components/ui/photo-upload.component';
import { ApiErrorService } from '../../core/services/api-error.service';
import { finalize, map, of, switchMap } from 'rxjs';

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
    PetAvatarComponent,
    PhotoUploadComponent
  ],
  template: `
    <div class="profile-page">
      <rp-page-header overline="Sua conta" title="Meu perfil"
                      subtitle="Seus dados e um resumo do seu quintal.">
      </rp-page-header>

      <div class="profile-grid">
        <section class="panel form-panel">
          <div class="panel-title">
            <div class="panel-title-tx">
              <h2>{{ currentUser?.firstName }} {{ currentUser?.lastName }}</h2>
              <p>{{ currentUser?.email }}</p>
            </div>
          </div>

          <form [formGroup]="profileForm" (ngSubmit)="onUpdateProfile()">
            <rp-photo-upload #avatarUpload
                             purpose="TUTOR_AVATAR"
                             label="Foto de perfil"
                             [subjectName]="currentUser?.firstName || ''"
                             [existingUrl]="currentUser?.avatar || null"
                             [existingAssetId]="currentUser?.avatarAssetId || null">
            </rp-photo-upload>

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

            <div class="form-actions">
              <button mat-flat-button type="submit"
                      [disabled]="profileForm.invalid || isUpdating || avatarUpload.isPreparing">
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
                                   [photoUrl]="pet.photoUrl"
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
  @ViewChild(PhotoUploadComponent) avatarUpload?: PhotoUploadComponent;
  profileForm: FormGroup;
  currentUser: Tutor | null = null;
  isUpdating = false;
  totalEvents = 0;
  upcomingEvents = 0;
  private legacyAvatar: string | null = null;
  private eventUpdateSubscription?: Subscription;

  constructor(
    private fb: FormBuilder,
    private tutorService: TutorService,
    private dashboardService: DashboardService,
    private eventStateService: EventStateService,
    private userStateService: UserStateService,
    private toast: ToastService,
    private apiError: ApiErrorService
  ) {
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.maxLength(80)]],
      lastName: ['', Validators.maxLength(100)],
      phoneNumber: ['']
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

  private refreshEventData(): void {
    if (this.currentUser && this.currentUser.pets && this.currentUser.pets.length > 0) {
      this.loadStats(true);
    }
  }

  loadProfile(): void {
    this.tutorService.getMyProfileCached().subscribe({
      next: (user) => {
        this.currentUser = user;
        this.legacyAvatar = user.avatarAssetId ? null : user.avatar || null;
        this.profileForm.patchValue({
          firstName: user.firstName,
          lastName: user.lastName,
          phoneNumber: user.phoneNumber
        });

        this.loadStats();
      },
      error: () => {
        this.toast.error('Erro ao carregar perfil');
      }
    });
  }

  private loadStats(forceRefresh = false): void {
    this.dashboardService.getOverview(forceRefresh).subscribe({
      next: overview => {
        this.totalEvents = overview.totalEvents;
        this.upcomingEvents = overview.upcomingEvents.length;
      },
      error: () => {
        this.totalEvents = 0;
        this.upcomingEvents = 0;
      }
    });
  }

  onUpdateProfile(): void {
    if (this.profileForm.valid && this.currentUser) {
      this.isUpdating = true;

      const value = this.profileForm.value;
      this.tutorService.updateProfile(this.currentUser.id, {
        firstName: value.firstName.trim(),
        lastName: value.lastName?.trim() || null,
        phoneNumber: value.phoneNumber?.trim() || null,
        avatar: this.avatarUpload?.removalRequested ? null : this.legacyAvatar
      }).pipe(
        switchMap(updatedUser => (this.avatarUpload?.commit(updatedUser.id) ?? of(null)).pipe(
          map(() => updatedUser)
        )),
        finalize(() => this.isUpdating = false)
      ).subscribe({
        next: () => {
          this.avatarUpload?.markComplete();
          this.loadProfile();
          this.toast.success('Perfil atualizado com sucesso!');

          // Notificar outros componentes sobre a atualização do perfil
          this.userStateService.notifyUserUpdated();
        },
        error: (error) => {
          const message = this.apiError.message(
            error,
            'Seus dados foram salvos, mas não foi possível atualizar a foto. Tente novamente.'
          );
          this.avatarUpload?.markFailed(message);
          this.toast.error(message);
        }
      });
    }
  }
}
