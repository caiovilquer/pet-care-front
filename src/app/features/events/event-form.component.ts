import { Component, Inject, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { ToastService } from '../../core/services/toast.service';
import { CommonModule } from '@angular/common';
import { EventService } from '../../core/services/event.service';
import { PetService } from '../../core/services/pet.service';
import { EventStateService } from '../../core/services/event-state.service';
import { DateTimeService } from '../../core/services/datetime.service';
import { EventCreateRequest, EventUpdateRequest, EventType, RecurrenceFrequency } from '../../core/models/event.model';
import { PetSummary } from '../../core/models/pet.model';
import { ApiErrorService } from '../../core/services/api-error.service';

interface EventFormData { eventId?: number; petId?: number }

@Component({
  selector: 'app-event-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDatepickerModule,
    MatIconModule
  ],
  templateUrl: './event-form.component.html',
  styleUrls: ['./event-form.component.css']
})
export class EventFormComponent implements OnInit {
  eventForm: FormGroup;
  isEdit = false;
  isLoading = false;
  pets: PetSummary[] = [];

  frequencies: { value: RecurrenceFrequency, viewValue: string }[] = [
    { value: 'DAILY', viewValue: 'Diariamente' },
    { value: 'WEEKLY', viewValue: 'Semanalmente' },
    { value: 'MONTHLY', viewValue: 'Mensalmente' },
    { value: 'YEARLY', viewValue: 'Anualmente' }
  ];

  eventTypes: { value: EventType; label: string; icon: string }[] = [
    { value: 'VACCINE', label: 'Vacina', icon: 'vaccines' },
    { value: 'MEDICINE', label: 'Remédio', icon: 'medication' },
    { value: 'DIARY', label: 'Diário', icon: 'book' },
    { value: 'BREED', label: 'Reprodução', icon: 'favorite' },
    { value: 'SERVICE', label: 'Serviço', icon: 'content_cut' }
  ];

  constructor(
    private fb: FormBuilder,
    private eventService: EventService,
    private petService: PetService,
    private eventStateService: EventStateService,
    private dateTimeService: DateTimeService,
    private toast: ToastService,
    private apiError: ApiErrorService,
    public dialogRef: MatDialogRef<EventFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EventFormData | null
  ) {
    this.isEdit = !!data && !!data.eventId;

    this.eventForm = this.fb.group({
      petId: [null, Validators.required],
      type: ['', Validators.required],
      description: ['', [Validators.required, Validators.maxLength(255)]],
      dateStart: [null, Validators.required],
      timeStart: ['', Validators.required],
      frequency: [''],
      intervalCount: [1, [Validators.min(1)]],
      repetitions: [null, [Validators.min(1)]],
      finalDate: [null]
    }, { validators: this.finalDateValidator });
  }

  ngOnInit(): void {

    this.loadPets();
    if (this.isEdit) {
      this.eventForm.get('petId')?.disable();
      this.eventService.getById(this.data!.eventId!).subscribe(event => {
  

        // Tratar a data corretamente
        let dateStart = null;
        let timeStart = '';

        if (event.dateStart) {
          const eventDate = this.dateTimeService.parseAPIDate(event.dateStart); // FIX: usar parsing seguro
          if (eventDate) {
            dateStart = eventDate;
            timeStart = this.dateTimeService.extractTime(event.dateStart); // FIX: extrair hora corretamente
          }
        }

        // Tratar a data final se existir (apenas data, sem horário)
        let finalDate = null;
        if (event.recurrence?.finalDate) {
          finalDate = this.dateTimeService.parseAPIDate(event.recurrence.finalDate); // FIX: usar parsing seguro
        }

        this.eventForm.patchValue({
          petId: this.data!.petId,
          type: event.type,
          description: event.description,
          dateStart: dateStart,
          timeStart: timeStart,
          frequency: event.recurrence?.frequency,
          intervalCount: event.recurrence?.intervalCount,
          repetitions: event.recurrence?.repetitions,
          finalDate: finalDate
        });

  
      });
    } else if (this.data && this.data.petId) {
      this.eventForm.patchValue({ petId: this.data.petId });
  
    }
  }

  loadPets(): void {
    // Assuming the user has a reasonable number of pets, otherwise use pagination
    this.petService.getAllCached(0, 100).subscribe(page => {
      this.pets = page.items;
    });
  }

  onSubmit(): void {
    if (this.eventForm.invalid) {
      this.eventForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const formValue = this.eventForm.value;

    // Criar o objeto Date a partir dos valores do formulário
    let dateStart: Date;
    
    // Garantir que temos uma data válida
    if (!formValue.dateStart) {
      this.toast.warning('Data é obrigatória');
      this.isLoading = false;
      return;
    }

    if (formValue.dateStart instanceof Date) {
      dateStart = new Date(formValue.dateStart);
    } else {
      // Tentar criar data a partir da string
      dateStart = new Date(formValue.dateStart);
    }

    // Verificar se a data é válida
    if (isNaN(dateStart.getTime())) {
      this.toast.warning('Data inválida');
      this.isLoading = false;
      return;
    }

    // Adicionar a hora à data
    if (formValue.timeStart) {
      const [hours, minutes] = formValue.timeStart.split(':');
      const hoursNum = parseInt(hours, 10);
      const minutesNum = parseInt(minutes, 10);
      
      if (isNaN(hoursNum) || isNaN(minutesNum)) {
        this.toast.warning('Hora inválida');
        this.isLoading = false;
        return;
      }
      
      dateStart.setHours(hoursNum, minutesNum, 0, 0);
    } else {
      // Se não tem hora, definir como 00:00
      dateStart.setHours(0, 0, 0, 0);
    }

    const request: EventCreateRequest | EventUpdateRequest = {
      petId: formValue.petId,
      type: formValue.type,
      description: formValue.description.trim(),
      dateStart: this.dateTimeService.formatDateTimeForAPIWithoutTimezone(dateStart),
      frequency: formValue.frequency || null,
      intervalCount: formValue.frequency ? (formValue.intervalCount || 1) : 1,
      repetitions: formValue.frequency && formValue.repetitions > 0 ? formValue.repetitions : null,
      finalDate: formValue.frequency && formValue.finalDate
        ? this.dateTimeService.formatDateAsLocalDateTime(formValue.finalDate)
        : null
    };

    if (this.isEdit) {
      const { petId: _petId, ...updateRequest } = request as EventCreateRequest;
      this.eventService.update(this.data!.eventId!, updateRequest as EventUpdateRequest).subscribe({
        next: () => {
          this.eventStateService.notifyEventUpdated();
          this.handleSuccess('Evento atualizado com sucesso!');
        },
        error: (err) => this.handleError(err, 'Erro ao atualizar evento.'),
        complete: () => this.isLoading = false
      });
    } else {
      this.eventService.create(request as EventCreateRequest).subscribe({
        next: () => {
          this.eventStateService.notifyEventUpdated();
          this.handleSuccess('Evento adicionado com sucesso!');
        },
        error: (err) => this.handleError(err, 'Erro ao adicionar evento.'),
        complete: () => this.isLoading = false
      });
    }
  }

  private handleSuccess(message: string): void {
    this.toast.success(message);
    this.dialogRef.close(true);
  }

  private handleError(error: unknown, message: string): void {
    this.toast.error(this.apiError.message(error, message));
    this.isLoading = false;
  
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  selectType(value: EventType): void {
    const control = this.eventForm.get('type');
    control?.setValue(value);
    control?.markAsTouched();
  }

  private finalDateValidator(group: AbstractControl): ValidationErrors | null {
    const start = group.get('dateStart')?.value;
    const end = group.get('finalDate')?.value;
    if (!start || !end) return null;
    return new Date(end).setHours(23, 59, 59, 999) < new Date(start).getTime()
      ? { finalDateBeforeStart: true }
      : null;
  }
}
