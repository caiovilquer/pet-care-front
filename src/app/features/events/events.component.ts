import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { CareOccurrence, CareOccurrenceStatus } from '../../core/models/care.model';
import { EventType } from '../../core/models/event.model';
import { PetSummary } from '../../core/models/pet.model';
import { ApiErrorService } from '../../core/services/api-error.service';
import { CareService } from '../../core/services/care.service';
import { DateTimeService } from '../../core/services/datetime.service';
import { EventStateService } from '../../core/services/event-state.service';
import { PetService } from '../../core/services/pet.service';
import { ToastService } from '../../core/services/toast.service';
import { CareOccurrenceCardComponent } from '../../shared/components/ui/care-occurrence-card.component';
import { ConfirmDialogComponent } from '../../shared/components/ui/confirm-dialog.component';
import { EmptyStateComponent } from '../../shared/components/ui/empty-state.component';
import { HintComponent } from '../../shared/components/ui/hint.component';
import { PageHeaderComponent } from '../../shared/components/ui/page-header.component';
import { SkeletonComponent } from '../../shared/components/ui/skeleton.component';
import { EventFormComponent } from './event-form.component';
import { HouseholdService } from '../../core/services/household.service';
import { DEFAULT_HOUSEHOLD_TIMEZONE } from '../../core/models/household.model';

type Period = 'PAST_30' | 'NEXT_7' | 'NEXT_30' | 'NEXT_90' | 'YEAR';
interface CareGroup { key: string; label: string; isToday: boolean; events: CareOccurrence[] }

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatButtonModule, MatIconModule, MatPaginatorModule, MatDialogModule,
    MatFormFieldModule, MatSelectModule, PageHeaderComponent, EmptyStateComponent, SkeletonComponent,
    CareOccurrenceCardComponent, HintComponent
  ],
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.css']
})
export class EventsComponent implements OnInit {
  events: CareOccurrence[] = [];
  groups: CareGroup[] = [];
  pets: PetSummary[] = [];
  totalItems = 0;
  currentPage = 0;
  pageSize = 20;
  routePetId: number | null = null;
  selectedPetId: number | null = null;
  selectedType: EventType | null = null;
  selectedStatus: CareOccurrenceStatus | null = null;
  selectedPeriod: Period = 'NEXT_30';
  isLoading = true;
  readonly busyIds = new Set<string>();
  readonly memberNames = new Map<number, string>();
  canManagePlans = false;
  canCompleteCare = false;
  householdTimezone = DEFAULT_HOUSEHOLD_TIMEZONE;
  readonly eventTypes: Array<{ value: EventType; label: string }> = [
    { value: 'VACCINE', label: 'Vacinas' }, { value: 'MEDICINE', label: 'Remédios' },
    { value: 'DIARY', label: 'Rotinas' }, { value: 'BREED', label: 'Reprodução' },
    { value: 'SERVICE', label: 'Serviços' }
  ];

  constructor(
    private readonly care: CareService,
    private readonly petService: PetService,
    private readonly dateTime: DateTimeService,
    private readonly dialog: MatDialog,
    private readonly toast: ToastService,
    private readonly apiError: ApiErrorService,
    private readonly eventState: EventStateService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly households: HouseholdService
  ) {}

  ngOnInit(): void {
    this.households.overview().subscribe({ next: value => { this.canManagePlans = value.household.role === 'OWNER'; this.canCompleteCare = value.household.role !== 'VIEWER'; this.householdTimezone = value.household.timezone || DEFAULT_HOUSEHOLD_TIMEZONE; value.members.forEach(member => this.memberNames.set(member.tutorId, member.firstName)); if (!this.isLoading) this.load(); } });
    this.petService.getPetsCached().subscribe({
      next: pets => { this.pets = pets; },
      error: () => this.toast.error('Não foi possível carregar os nomes dos pets.')
    });
    this.route.paramMap.subscribe(params => {
      const raw = params.get('petId');
      this.routePetId = raw ? Number(raw) : null;
      this.selectedPetId = this.routePetId;
      this.currentPage = 0;
      this.load();
    });
  }

  load(): void {
    this.isLoading = true;
    const { from, to } = this.periodRange();
    this.care.search({
      from: this.dateTime.formatCareDateTimeForAPI(from, this.householdTimezone),
      to: this.dateTime.formatCareDateTimeForAPI(to, this.householdTimezone),
      petId: this.selectedPetId, type: this.selectedType, status: this.selectedStatus,
      page: this.currentPage, size: this.pageSize
    }).subscribe({
      next: page => {
        this.events = page.items;
        this.totalItems = page.total;
        this.groups = this.groupByDay(page.items);
        this.isLoading = false;
      },
      error: error => {
        this.events = []; this.groups = []; this.totalItems = 0; this.isLoading = false;
        this.toast.error(this.apiError.message(error, 'Não foi possível carregar a agenda.'));
      }
    });
  }

  applyFilters(): void { this.currentPage = 0; this.load(); }
  clearFilters(): void {
    this.selectedPetId = this.routePetId;
    this.selectedType = null; this.selectedStatus = null; this.selectedPeriod = 'NEXT_30';
    this.applyFilters();
  }
  onPageChange(page: PageEvent): void {
    this.currentPage = page.pageIndex; this.pageSize = page.pageSize; this.load();
  }
  openPlan(planId?: string, petId?: number): void {
    const ref = this.dialog.open(EventFormComponent, {
      width: '680px', maxWidth: 'calc(100vw - 24px)',
      data: { planId, petId: petId || this.routePetId }
    });
    ref.afterClosed().subscribe(saved => { if (saved) this.load(); });
  }
  complete(event: CareOccurrence): void {
    if (this.busyIds.has(event.id)) return;
    this.busyIds.add(event.id);
    this.care.complete(event.id).subscribe({
      next: updated => {
        this.replace(updated); this.toast.success(`${event.title} concluído.`); this.eventState.notifyEventUpdated();
      },
      error: error => {
        this.busyIds.delete(event.id); this.load();
        this.toast.error(this.apiError.message(error, 'Não foi possível confirmar. A agenda foi atualizada por segurança.'));
      }
    });
  }
  undo(event: CareOccurrence): void {
    if (this.busyIds.has(event.id)) return;
    this.busyIds.add(event.id);
    this.care.undo(event.id).subscribe({
      next: updated => {
        this.replace(updated); this.toast.info('Conclusão desfeita.'); this.eventState.notifyEventUpdated();
      },
      error: error => {
        this.busyIds.delete(event.id); this.load();
        this.toast.error(this.apiError.message(error, 'Não foi possível desfazer.'));
      }
    });
  }
  endPlan(event: CareOccurrence): void {
    const ref = this.dialog.open(ConfirmDialogComponent, { data: {
      title: 'Encerrar este plano?',
      message: `As próximas ocorrências de “${event.title}” sairão da agenda. O histórico concluído será preservado.`,
      confirmLabel: 'Encerrar plano', danger: true
    }});
    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.busyIds.add(event.id);
      this.care.deactivatePlan(event.planId).subscribe({
        next: () => { this.toast.success('Plano encerrado. O histórico foi mantido.'); this.eventState.notifyEventUpdated(); this.load(); },
        error: error => { this.busyIds.delete(event.id); this.toast.error(this.apiError.message(error, 'Não foi possível encerrar o plano.')); }
      });
    });
  }
  goBack(): void { this.router.navigate(['/events']); }
  petName(id: number): string { return this.pets.find(pet => pet.id === id)?.name || `Pet #${id}`; }
  memberName(id?: number): string { return id ? this.memberNames.get(id) || 'Membro da família' : ''; }
  get routePetName(): string { return this.routePetId ? this.petName(this.routePetId) : ''; }
  get hasFilters(): boolean {
    return !!this.selectedType || !!this.selectedStatus || this.selectedPeriod !== 'NEXT_30' || this.selectedPetId !== this.routePetId;
  }

  private replace(updated: CareOccurrence): void {
    this.busyIds.delete(updated.id);
    this.events = this.events.map(item => item.id === updated.id ? updated : item);
    this.groups = this.groupByDay(this.events);
  }
  private periodRange(): { from: Date; to: Date } {
    const now = new Date();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const days = (amount: number) => new Date(startToday.getTime() + amount * 86_400_000);
    switch (this.selectedPeriod) {
      case 'PAST_30': return { from: days(-30), to: new Date(startToday.getTime() + 86_400_000) };
      case 'NEXT_7': return { from: days(-1), to: days(8) };
      case 'NEXT_90': return { from: days(-1), to: days(91) };
      case 'YEAR': return { from: days(-180), to: days(186) };
      default: return { from: days(-1), to: days(31) };
    }
  }
  private groupByDay(events: CareOccurrence[]): CareGroup[] {
    const groups = new Map<string, CareGroup>();
    events.forEach(event => {
      const date = this.dateTime.parseAPIDate(event.dueAt, event.timezone || this.householdTimezone) || new Date(event.dueAt);
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      if (!groups.has(key)) {
        const today = new Date();
        const isToday = date.toDateString() === today.toDateString();
        const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
        const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
        let label = isToday ? 'Hoje' : date.toDateString() === tomorrow.toDateString() ? 'Amanhã'
          : date.toDateString() === yesterday.toDateString() ? 'Ontem'
          : date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
        label = label.charAt(0).toUpperCase() + label.slice(1);
        groups.set(key, { key, label, isToday, events: [] });
      }
      groups.get(key)!.events.push(event);
    });
    return [...groups.values()];
  }
}
