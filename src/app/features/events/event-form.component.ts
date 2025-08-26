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
import { DateTimeService } from '../../core/services/datetime.service';
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
    private dateTimeService: DateTimeService,
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

    this.loadPets();
    if (this.isEdit) {
      this.eventService.getById(this.data.eventId).subscribe(event => {
  

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

  
      });
    } else if (this.data && this.data.petId) {
      this.eventForm.patchValue({ petId: this.data.petId });
  
    }
  }

  loadPets(): void {
    // Assuming the user has a reasonable number of pets, otherwise use pagination
    this.petService.getAll(0, 100).subscribe(page => {
      this.pets = page.items;
    });
  }

  onSubmit(): void {
    console.log('Event Form - onSubmit chamado');
    console.log('Form valid:', this.eventForm.valid);
    console.log('Form errors:', this.eventForm.errors);
    console.log('Form value:', this.eventForm.value);
    
    if (this.eventForm.invalid) {
      console.log('Form inválido - parando submissão');
      // Log de erros específicos por campo
      Object.keys(this.eventForm.controls).forEach(key => {
        const control = this.eventForm.get(key);
        if (control && control.invalid) {
          console.log(`Campo ${key} inválido:`, control.errors);
        }
      });
      return;
    }

    this.isLoading = true;
    const formValue = this.eventForm.value;

    // Criar o objeto Date a partir dos valores do formulário
    console.log('Form dateStart value:', formValue.dateStart, 'type:', typeof formValue.dateStart);
    console.log('Form timeStart value:', formValue.timeStart);

    let dateStart: Date;
    
    // Garantir que temos uma data válida
    if (!formValue.dateStart) {
      console.error('Data não fornecida');
      this.snackBar.open('Data é obrigatória', 'Fechar', { duration: 3000 });
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
      console.error('Data inválida:', formValue.dateStart);
      this.snackBar.open('Data inválida', 'Fechar', { duration: 3000 });
      this.isLoading = false;
      return;
    }

    // Adicionar a hora à data
    if (formValue.timeStart) {
      const [hours, minutes] = formValue.timeStart.split(':');
      const hoursNum = parseInt(hours, 10);
      const minutesNum = parseInt(minutes, 10);
      
      if (isNaN(hoursNum) || isNaN(minutesNum)) {
        console.error('Hora inválida:', formValue.timeStart);
        this.snackBar.open('Hora inválida', 'Fechar', { duration: 3000 });
        this.isLoading = false;
        return;
      }
      
      dateStart.setHours(hoursNum, minutesNum, 0, 0);
    } else {
      // Se não tem hora, definir como 00:00
      dateStart.setHours(0, 0, 0, 0);
    }

    console.log('Data final criada:', dateStart);

    const request: EventCreateRequest | EventUpdateRequest = {
      petId: formValue.petId,
      type: formValue.type,
      description: formValue.description,
      dateStart: this.dateTimeService.formatDateTimeForAPI(dateStart), // FIX: usar timezone local
      frequency: formValue.frequency || undefined,
      intervalCount: formValue.frequency ? (formValue.intervalCount || 1) : 1, // Sempre 1 se não há recorrência
      repetitions: formValue.repetitions || undefined,
      finalDate: formValue.finalDate ? this.dateTimeService.formatDateOnlyForAPI(formValue.finalDate) : undefined
    };

    // Debug: log do request que será enviado
    console.log('Event Form - Request sendo enviado:', {
      ...request,
      dateStartOriginal: dateStart,
      timeStart: formValue.timeStart,
      dateValue: formValue.dateStart
    });

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
    console.error('Event Form Error:', error);
    console.error('Error details:', {
      status: error.status,
      statusText: error.statusText,
      url: error.url,
      message: error.message,
      error: error.error
    });
    this.snackBar.open(message, 'Fechar', { duration: 3000 });
  
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
