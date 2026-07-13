import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { ToastService } from '../../core/services/toast.service';
import { CommonModule } from '@angular/common';
import { PetService } from '../../core/services/pet.service';
import { DateTimeService } from '../../core/services/datetime.service';
import { PetCreateRequest, PetUpdateRequest } from '../../core/models/pet.model';
import { ApiErrorService } from '../../core/services/api-error.service';
import { PhotoUploadComponent } from '../../shared/components/ui/photo-upload.component';
import { finalize, map, of, switchMap } from 'rxjs';

interface PetFormData { id: number }

@Component({
  selector: 'app-pet-form',
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
    MatIconModule,
    PhotoUploadComponent
  ],
  templateUrl: './pet-form.component.html',
  styleUrls: ['./pet-form.component.css']
})
export class PetFormComponent implements OnInit {
  @ViewChild(PhotoUploadComponent) photoUpload?: PhotoUploadComponent;
  petForm: FormGroup;
  isEdit = false;
  isLoading = false;
  existingPhotoUrl: string | null = null;
  existingPhotoAssetId: string | null = null;
  private legacyPhotoUrl: string | null = null;
  private persistedPetId: number | null = null;
  readonly maxBirthdate = new Date();

  constructor(
    private fb: FormBuilder,
    private petService: PetService,
    private dateTimeService: DateTimeService,
    private toast: ToastService,
    private apiError: ApiErrorService,
    public dialogRef: MatDialogRef<PetFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PetFormData | null
  ) {
    this.isEdit = !!data;
    this.petForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(80)]],
      species: ['', [Validators.required, Validators.maxLength(40)]],
      breed: ['', Validators.maxLength(80)],
      birthdate: ['']
    });
  }

  ngOnInit(): void {
    if (this.isEdit) {
      this.petForm.get('species')?.disable();

      this.petService.getById(this.data!.id).subscribe(pet => {
        // Converter a string de data para objeto Date evitando problemas de timezone
        let birthdate = null;
        if (pet.birthdate) {
          birthdate = this.dateTimeService.parseAPIDate(pet.birthdate); // FIX: usar parsing seguro
        }

        const petData = {
          ...pet,
          birthdate: birthdate
        };
        this.petForm.patchValue(petData);
        
        this.existingPhotoUrl = pet.photoUrl || null;
        this.existingPhotoAssetId = pet.photoAssetId || null;
        this.legacyPhotoUrl = pet.photoAssetId ? null : pet.photoUrl || null;
      });
    }
  }

  onSubmit(): void {
    if (this.petForm.invalid) {
      this.petForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const formValue = this.petForm.getRawValue();

    const savePet$ = this.isEdit ? (() => {
      const updateRequest: PetUpdateRequest = {
        name: formValue.name.trim(),
        breed: formValue.breed?.trim() || null,
        birthdate: formValue.birthdate ? this.dateTimeService.formatDateOnlyForAPI(formValue.birthdate) : null,
        photoUrl: this.photoUpload?.removalRequested ? null : this.legacyPhotoUrl
      };
      return this.petService.update(this.data!.id, updateRequest).pipe(map(() => this.data!.id));
    })() : this.persistedPetId ? this.petService.update(this.persistedPetId, {
      name: formValue.name.trim(),
      breed: formValue.breed?.trim() || null,
      birthdate: formValue.birthdate ? this.dateTimeService.formatDateOnlyForAPI(formValue.birthdate) : null,
      photoUrl: null
    }).pipe(map(() => this.persistedPetId!)) : (() => {
      const createRequest: PetCreateRequest = {
        name: formValue.name.trim(),
        species: formValue.species.trim(),
        breed: formValue.breed?.trim() || null,
        birthdate: formValue.birthdate ? this.dateTimeService.formatDateOnlyForAPI(formValue.birthdate) : null,
        photoUrl: null
      };
      return this.petService.create(createRequest).pipe(
        map(result => {
          this.persistedPetId = result.petId;
          return result.petId;
        })
      );
    })();

    savePet$.pipe(
      switchMap(id => this.photoUpload?.commit(id) ?? of(null)),
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: () => {
        this.photoUpload?.markComplete();
        this.handleSuccess(this.isEdit ? 'Pet atualizado com sucesso!' : 'Pet adicionado com sucesso!');
      },
      error: (err) => {
        const fallback = this.persistedPetId
          ? 'O pet foi salvo, mas a foto não. Você pode tentar enviar novamente.'
          : (this.isEdit ? 'Erro ao atualizar pet.' : 'Erro ao adicionar pet.');
        const message = this.apiError.message(err, fallback);
        this.photoUpload?.markFailed(message);
        this.handleError(err, fallback);
      }
    });
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

}
