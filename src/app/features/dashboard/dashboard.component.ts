import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { catchError, forkJoin, of, Subscription } from 'rxjs';
import { CareOccurrence, TodayCare } from '../../core/models/care.model';
import { DashboardOverview } from '../../core/models/dashboard.model';
import { PetSummary } from '../../core/models/pet.model';
import { ApiErrorService } from '../../core/services/api-error.service';
import { CareService } from '../../core/services/care.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { EventStateService } from '../../core/services/event-state.service';
import { ToastService } from '../../core/services/toast.service';
import { EventFormComponent } from '../events/event-form.component';
import { CareOccurrenceCardComponent } from '../../shared/components/ui/care-occurrence-card.component';
import { ConfirmDialogComponent } from '../../shared/components/ui/confirm-dialog.component';
import { EmptyStateComponent } from '../../shared/components/ui/empty-state.component';
import { PetAvatarComponent } from '../../shared/components/ui/pet-avatar.component';
import { SkeletonComponent } from '../../shared/components/ui/skeleton.component';
import { StatCardComponent } from '../../shared/components/ui/stat-card.component';
import { HouseholdService } from '../../core/services/household.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterLink, MatButtonModule, MatIconModule, StatCardComponent, PetAvatarComponent,
    EmptyStateComponent, SkeletonComponent, CareOccurrenceCardComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  overview: DashboardOverview | null = null;
  today: TodayCare | null = null;
  recentPets: PetSummary[] = [];
  isLoading = true;
  hadError = false;
  readonly busyIds = new Set<string>();
  readonly memberNames = new Map<number, string>();
  canManagePlans = false;
  canCompleteCare = false;
  private updates?: Subscription;

  constructor(
    private readonly dashboard: DashboardService,
    private readonly care: CareService,
    private readonly eventState: EventStateService,
    private readonly toast: ToastService,
    private readonly apiError: ApiErrorService,
    private readonly dialog: MatDialog,
    private readonly households: HouseholdService
  ) {}

  ngOnInit(): void {
    this.households.overview().subscribe({ next: value => { this.canManagePlans = value.household.role === 'OWNER'; this.canCompleteCare = value.household.role !== 'VIEWER'; value.members.forEach(member => this.memberNames.set(member.tutorId, member.firstName)); } });
    this.load();
    this.updates = this.eventState.eventUpdated$.subscribe(() => this.load(true));
  }
  ngOnDestroy(): void { this.updates?.unsubscribe(); }

  load(force = false): void {
    this.isLoading = true; this.hadError = false;
    forkJoin({
      overview: this.dashboard.getOverview(force).pipe(catchError(() => of(null))),
      today: this.care.today(force).pipe(catchError(() => of(null)))
    }).subscribe(({ overview, today }) => {
      this.overview = overview; this.today = today;
      this.recentPets = overview?.pets.slice(0, 5) || [];
      this.hadError = !overview || !today;
      this.isLoading = false;
    });
  }

  openPlan(planId?: string, petId?: number): void {
    const ref = this.dialog.open(EventFormComponent, {
      width: '680px', maxWidth: 'calc(100vw - 24px)', data: { planId, petId }
    });
    ref.afterClosed().subscribe(saved => { if (saved) this.load(true); });
  }
  complete(event: CareOccurrence): void {
    if (this.busyIds.has(event.id)) return;
    this.busyIds.add(event.id);
    this.care.complete(event.id).subscribe({
      next: () => { this.busyIds.delete(event.id); this.toast.success(`${event.title} concluído.`); this.eventState.notifyEventUpdated(); },
      error: error => { this.busyIds.delete(event.id); this.load(true); this.toast.error(this.apiError.message(error, 'Não foi possível confirmar. A lista foi atualizada por segurança.')); }
    });
  }
  undo(event: CareOccurrence): void {
    if (this.busyIds.has(event.id)) return;
    this.busyIds.add(event.id);
    this.care.undo(event.id).subscribe({
      next: () => { this.busyIds.delete(event.id); this.toast.info('Conclusão desfeita.'); this.eventState.notifyEventUpdated(); },
      error: error => { this.busyIds.delete(event.id); this.load(true); this.toast.error(this.apiError.message(error, 'Não foi possível desfazer.')); }
    });
  }
  endPlan(event: CareOccurrence): void {
    const ref = this.dialog.open(ConfirmDialogComponent, { data: {
      title: 'Encerrar este plano?', message: `As próximas ocorrências de “${event.title}” serão canceladas. O histórico fica preservado.`,
      confirmLabel: 'Encerrar plano', danger: true
    }});
    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.busyIds.add(event.id);
      this.care.deactivatePlan(event.planId).subscribe({
        next: () => { this.toast.success('Plano encerrado com histórico preservado.'); this.eventState.notifyEventUpdated(); },
        error: error => { this.busyIds.delete(event.id); this.toast.error(this.apiError.message(error, 'Não foi possível encerrar o plano.')); }
      });
    });
  }
  petName(id: number): string { return this.overview?.pets.find(pet => pet.id === id)?.name || `Pet #${id}`; }
  memberName(id?: number): string { return id ? this.memberNames.get(id) || 'Membro da família' : ''; }
  get greeting(): string { const h = new Date().getHours(); return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'; }
  get todayLabel(): string {
    const label = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
    return label.charAt(0).toUpperCase() + label.slice(1);
  }
}
