import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  HEALTH_MEASUREMENT_META,
  HealthMeasurement,
  HealthMeasurementRequest,
  HealthMeasurementType
} from '../../core/models/health.model';
import { ApiErrorService } from '../../core/services/api-error.service';
import { HealthService } from '../../core/services/health.service';
import { ToastService } from '../../core/services/toast.service';

export interface HealthMeasurementFormData {
  petId: number;
  petName: string;
  type?: HealthMeasurementType;
  measurement?: HealthMeasurement;
}

@Component({
  selector: 'rp-health-measurement-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule,
    MatIconModule, MatInputModule, MatProgressSpinnerModule
  ],
  templateUrl: './health-measurement-form.component.html',
  styleUrls: ['./health-measurement-form.component.css']
})
export class HealthMeasurementFormComponent {
  private readonly fb = inject(FormBuilder);
  readonly data = inject<HealthMeasurementFormData>(MAT_DIALOG_DATA);
  readonly meta = HEALTH_MEASUREMENT_META;
  readonly types = Object.keys(HEALTH_MEASUREMENT_META) as HealthMeasurementType[];
  readonly isEdit = !!this.data.measurement;
  readonly form = this.fb.group({
    type: this.fb.control<HealthMeasurementType>(this.data.measurement?.type || this.data.type || 'WEIGHT', Validators.required),
    value: this.fb.control<number | null>(this.data.measurement?.value ?? null, Validators.required),
    measuredAt: this.fb.control(this.toLocalInput(this.data.measurement?.measuredAt), Validators.required),
    notes: this.fb.control(this.data.measurement?.notes || '', Validators.maxLength(500))
  });
  isSaving = false;

  constructor(
    public readonly dialogRef: MatDialogRef<HealthMeasurementFormComponent>,
    private readonly health: HealthService,
    private readonly toast: ToastService,
    private readonly apiError: ApiErrorService
  ) { this.applyValueValidation(); }

  get selectedType(): HealthMeasurementType { return this.form.controls.type.value || 'WEIGHT'; }
  get step(): string { return this.selectedType === 'BODY_CONDITION_SCORE' ? '1' : '0.1'; }
  get min(): number { return this.selectedType === 'WEIGHT' ? 0.01 : this.selectedType === 'TEMPERATURE' ? 20 : 1; }
  get max(): number { return this.selectedType === 'WEIGHT' ? 500 : this.selectedType === 'TEMPERATURE' ? 50 : 9; }

  selectType(type: HealthMeasurementType): void {
    if (this.isEdit) return;
    this.form.controls.type.setValue(type);
    this.form.controls.value.setValue(null);
    this.applyValueValidation();
  }

  submit(): void {
    this.form.updateValueAndValidity();
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.warning('Revise a medição antes de salvar.');
      return;
    }
    const value = this.form.getRawValue();
    const request: HealthMeasurementRequest = {
      type: value.type!,
      value: Number(value.value),
      measuredAt: new Date(value.measuredAt!).toISOString(),
      notes: value.notes?.trim() || null
    };
    this.isSaving = true;
    const operation = this.data.measurement
      ? this.health.updateMeasurement(this.data.measurement, {
          value: request.value, measuredAt: request.measuredAt, notes: request.notes
        })
      : this.health.createMeasurement(this.data.petId, request);
    operation.subscribe({
      next: () => {
        this.toast.success(this.isEdit ? 'Medição atualizada.' : `${this.meta[request.type].label} registrado.`);
        this.dialogRef.close(true);
      },
      error: error => {
        this.isSaving = false;
        this.toast.error(this.apiError.message(error, 'Não foi possível salvar a medição.'));
      }
    });
  }

  private applyValueValidation(): void {
    const validators = [Validators.required, Validators.min(this.min), Validators.max(this.max)];
    if (this.selectedType === 'BODY_CONDITION_SCORE') validators.push(Validators.pattern(/^\d$/));
    this.form.controls.value.setValidators(validators);
    this.form.controls.value.updateValueAndValidity();
  }

  private toLocalInput(value?: string): string {
    const date = value ? new Date(value) : new Date();
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date.toISOString().slice(0, 16);
  }
}
