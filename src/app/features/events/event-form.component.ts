import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { EventService } from '../../core/services/event.service';
import { PetService } from '../../core/services/pet.service';
import { EventStateService } from '../../core/services/event-state.service';
import { EventCreateRequest, EventUpdateRequest, RecurrenceFrequency } from '../../core/models/event.model';
import { PetSummary } from '../../core/models/pet.model';

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
    MatDatepickerModule
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

  constructor(
    private fb: FormBuilder,
    private eventService: EventService,
    private petService: PetService,
    private eventStateService: EventStateService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<EventFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.isEdit = !!data && !!data.eventId;

    this.eventForm = this.fb.group({
      petId: [null, Validators.required],
      type: ['', Validators.required],
      description: ['', Validators.required],
      dateStart: [null, Validators.required],
      timeStart: ['', Validators.required],
      frequency: [''],
      intervalCount: [1, [Validators.min(1)]],
      repetitions: [null, [Validators.min(1)]],
      finalDate: [null]
    });
  }

  ngOnInit(): void {
    console.log('=== EVENT FORM INIT ===');
    console.log('Data recebida:', this.data);
    console.log('É edição:', this.isEdit);

    this.loadPets();
    if (this.isEdit) {
      this.eventService.getById(this.data.eventId).subscribe(event => {
        console.log('Evento carregado da API:', event);

        // Tratar a data corretamente
        let dateStart = null;
        let timeStart = '';

        if (event.dateStart) {
          const eventDate = new Date(event.dateStart);
          dateStart = eventDate;
          timeStart = eventDate.toTimeString().substring(0, 5);
        }

        // Tratar a data final se existir (apenas data, sem horário)
        let finalDate = null;
        if (event.recurrence?.finalDate) {
          const finalDateStr = event.recurrence.finalDate.split('T')[0]; // Pegar apenas a parte da data
          const dateParts = finalDateStr.split('-');
          if (dateParts.length === 3) {
            finalDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
          }
        }

        this.eventForm.patchValue({
          petId: this.data.petId, // Usar sempre o petId passado no data
          type: event.type,
          description: event.description,
          dateStart: dateStart,
          timeStart: timeStart,
          frequency: event.recurrence?.frequency,
          intervalCount: event.recurrence?.intervalCount,
          repetitions: event.recurrence?.repetitions,
          finalDate: finalDate
        });

        console.log('Formulário após patchValue:', this.eventForm.value);
      });
    } else if (this.data && this.data.petId) {
      this.eventForm.patchValue({ petId: this.data.petId });
      console.log('Novo evento - petId pré-selecionado:', this.data.petId);
    }
  }

  loadPets(): void {
    // Assuming the user has a reasonable number of pets, otherwise use pagination
    this.petService.getAll(0, 100).subscribe(page => {
      this.pets = page.items;
    });
  }

  onSubmit(): void {
    if (this.eventForm.invalid) {
      return;
    }

    this.isLoading = true;
    const formValue = this.eventForm.value;

    // Criar o objeto Date a partir dos valores do formulário
    let dateStart: Date;
    if (formValue.dateStart instanceof Date) {
      dateStart = new Date(formValue.dateStart);
    } else {
      dateStart = new Date(formValue.dateStart);
    }

    // Adicionar a hora à data
    if (formValue.timeStart) {
      const [hours, minutes] = formValue.timeStart.split(':');
      dateStart.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    }

    const request: EventCreateRequest | EventUpdateRequest = {
      petId: formValue.petId,
      type: formValue.type,
      description: formValue.description,
      dateStart: dateStart.toISOString(),
      frequency: formValue.frequency || undefined,
      intervalCount: formValue.intervalCount,
      repetitions: formValue.repetitions || undefined,
      finalDate: formValue.finalDate ? this.formatDateOnlyForAPI(formValue.finalDate) : undefined
    };

    if (this.isEdit) {
      this.eventService.update(this.data.eventId, request as EventUpdateRequest).subscribe({
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
    this.snackBar.open(message, 'Fechar', { duration: 3000 });
    this.dialogRef.close(true);
  }

  private handleError(error: any, message: string): void {
    this.snackBar.open(message, 'Fechar', { duration: 3000 });
    console.error(error);
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  private formatDateOnlyForAPI(date: Date | string): string {
    if (!date) return '';

    let dateObj: Date;
    if (date instanceof Date) {
      dateObj = date;
    } else {
      dateObj = new Date(date);
    }

    // Usar getFullYear, getMonth, getDate para evitar problemas de timezone
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}T00:00:00.000Z`;
  }
}
