import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CareOccurrence } from '../../../core/models/care.model';
import { EventType } from '../../../core/models/event.model';
import { DateTimeService } from '../../../core/services/datetime.service';

@Component({
  selector: 'rp-care-occurrence-card',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatTooltipModule],
  templateUrl: './care-occurrence-card.component.html',
  styleUrl: './care-occurrence-card.component.css'
})
export class CareOccurrenceCardComponent {
  constructor(private readonly dates: DateTimeService) {}
  @Input({ required: true }) occurrence!: CareOccurrence;
  @Input() petName = 'Pet';
  @Input() busy = false;
  @Input() showDate = false;
  @Input() showPlanActions = true;
  @Input() responsibleName = '';
  @Input() completedByName = '';
  @Input() canComplete = true;
  @Output() complete = new EventEmitter<CareOccurrence>();
  @Output() undo = new EventEmitter<CareOccurrence>();
  @Output() editPlan = new EventEmitter<CareOccurrence>();
  @Output() endPlan = new EventEmitter<CareOccurrence>();

  get isCompleted(): boolean { return this.occurrence.status === 'COMPLETED'; }
  get isOverdue(): boolean { return !this.isCompleted && this.dueDate().getTime() < Date.now(); }
  get canUndo(): boolean {
    return this.isCompleted && !!this.occurrence.canUndoUntil && new Date(this.occurrence.canUndoUntil).getTime() >= Date.now();
  }
  get time(): string {
    return this.dueDate().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }
  get date(): string {
    return this.dueDate().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  }
  get completedTime(): string {
    return this.occurrence.completedAt
      ? new Date(this.occurrence.completedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      : '';
  }
  get estimatedCost(): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: this.occurrence.estimatedCostCurrency || 'BRL' })
      .format(this.occurrence.estimatedCostAmount || 0);
  }
  get typeLabel(): string { return TYPE_LABELS[this.occurrence.type]; }
  get icon(): string { return TYPE_ICONS[this.occurrence.type]; }
  private dueDate(): Date { return this.dates.parseAPIDate(this.occurrence.dueAt, this.occurrence.timezone) || new Date(this.occurrence.dueAt); }
}

const TYPE_LABELS: Record<EventType, string> = {
  VACCINE: 'Vacina', MEDICINE: 'Remédio', DIARY: 'Rotina', BREED: 'Reprodução', SERVICE: 'Serviço'
};
const TYPE_ICONS: Record<EventType, string> = {
  VACCINE: 'vaccines', MEDICINE: 'medication', DIARY: 'task_alt', BREED: 'favorite', SERVICE: 'content_cut'
};
