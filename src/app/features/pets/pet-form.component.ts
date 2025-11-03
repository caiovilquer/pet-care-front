import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { PetService } from '../../core/services/pet.service';
import { DateTimeService } from '../../core/services/datetime.service';
import { PetCreateRequest, PetUpdateRequest } from '../../core/models/pet.model';

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
    MatTooltipModule
  ],
  templateUrl: './pet-form.component.html',
  styleUrls: ['./pet-form.component.css']
})
export class PetFormComponent implements OnInit {
  petForm: FormGroup;
  isEdit = false;
  isLoading = false;
  photoPreviewUrl: string | null = null;

  constructor(
    private fb: FormBuilder,
    private petService: PetService,
    private dateTimeService: DateTimeService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<PetFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.isEdit = !!data;
    this.petForm = this.fb.group({
      name: ['', Validators.required],
      specie: ['', Validators.required],
      race: [''],
      birthdate: [''],
      photoUrl: ['']
    });
  }

  ngOnInit(): void {
    // Observar mudanças no campo photoUrl para preview
    this.petForm.get('photoUrl')?.valueChanges.subscribe(url => {
      this.updatePhotoPreview(url);
    });

    if (this.isEdit) {
      this.petService.getById(this.data.id).subscribe(pet => {
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
        
        // Configurar preview da foto se existir
        if (pet.photoUrl) {
          this.updatePhotoPreview(pet.photoUrl);
        }
      });
    }
  }

  onSubmit(): void {
    if (this.petForm.invalid) {
      return;
    }

    this.isLoading = true;
    const formValue = this.petForm.value;

    const request: PetCreateRequest | PetUpdateRequest = {
      name: formValue.name,
      specie: formValue.specie,
      race: formValue.race,
      birthdate: formValue.birthdate ? this.dateTimeService.formatDateOnlyForAPI(formValue.birthdate) : '',
      photoUrl: formValue.photoUrl || ''
    };

    if (this.isEdit) {
      this.petService.update(this.data.id, request as PetUpdateRequest).subscribe({
        next: () => this.handleSuccess('Pet atualizado com sucesso!'),
        error: (err) => this.handleError(err, 'Erro ao atualizar pet.'),
        complete: () => this.isLoading = false
      });
    } else {
      this.petService.create(request as PetCreateRequest).subscribe({
        next: () => this.handleSuccess('Pet adicionado com sucesso!'),
        error: (err) => this.handleError(err, 'Erro ao adicionar pet.'),
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
  
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  updatePhotoPreview(url: string): void {
    if (url && this.isValidImageUrl(url)) {
      this.photoPreviewUrl = url;
    } else {
      this.photoPreviewUrl = null;
    }
  }

  private isValidImageUrl(url: string): boolean {
    try {
      new URL(url);
      return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url) || 
             url.includes('drive.google.com') ||
             url.includes('imgur.com') ||
             url.includes('cloudinary.com');
    } catch {
      return false;
    }
  }

  onPhotoError(): void {
    this.photoPreviewUrl = null;
    this.snackBar.open('Não foi possível carregar a imagem. Verifique a URL.', 'Fechar', { 
      duration: 3000 
    });
  }

  removePhoto(): void {
    this.petForm.patchValue({ photoUrl: '' });
    this.photoPreviewUrl = null;
  }
}
