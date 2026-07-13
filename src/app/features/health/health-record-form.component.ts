import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { firstValueFrom } from 'rxjs';
import {
  HEALTH_RECORD_META,
  HealthRecord,
  HealthRecordRequest,
  HealthRecordType
} from '../../core/models/health.model';
import { PreparedAttachment } from '../../core/models/media.model';
import { ApiErrorService } from '../../core/services/api-error.service';
import { HealthService } from '../../core/services/health.service';
import { MediaService } from '../../core/services/media.service';
import { ToastService } from '../../core/services/toast.service';
import { CURRENCY_OPTIONS, currencySymbol, isListedCurrency, normalizeCurrency } from '../../core/models/currency.model';

export interface HealthRecordFormData {
  petId: number;
  petName: string;
  type?: HealthRecordType;
  record?: HealthRecord;
}

@Component({
  selector: 'rp-health-record-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule,
    MatIconModule, MatInputModule, MatProgressBarModule, MatProgressSpinnerModule, MatSelectModule
  ],
  templateUrl: './health-record-form.component.html',
  styleUrls: ['./health-record-form.component.css']
})
export class HealthRecordFormComponent {
  private readonly fb = inject(FormBuilder);
  readonly data = inject<HealthRecordFormData>(MAT_DIALOG_DATA);
  readonly meta = HEALTH_RECORD_META;
  readonly types = Object.keys(HEALTH_RECORD_META) as HealthRecordType[];
  readonly currencies = CURRENCY_OPTIONS;
  readonly isEdit = !!this.data.record;
  readonly form = this.fb.group({
    type: this.fb.control<HealthRecordType>(this.data.record?.type || this.data.type || 'CONSULTATION', Validators.required),
    title: this.fb.control(this.data.record?.title || '', [Validators.required, Validators.maxLength(120)]),
    occurredAt: this.fb.control(this.toLocalInput(this.data.record?.occurredAt), Validators.required),
    notes: this.fb.control(this.data.record?.notes || '', Validators.maxLength(4000)),
    productName: this.fb.control(this.data.record?.productName || '', Validators.maxLength(160)),
    dosage: this.fb.control(this.data.record?.dosage || '', Validators.maxLength(120)),
    batchNumber: this.fb.control(this.data.record?.batchNumber || '', Validators.maxLength(120)),
    professionalName: this.fb.control(this.data.record?.professionalName || '', Validators.maxLength(160)),
    clinicName: this.fb.control(this.data.record?.clinicName || '', Validators.maxLength(160)),
    costAmount: this.fb.control<number | null>(this.data.record?.costAmount ?? null, [Validators.min(0), Validators.max(9999999999.99)]),
    currency: this.fb.control(normalizeCurrency(this.data.record?.currency), [Validators.pattern(/^[A-Z]{3}$/)])
  });

  pendingAttachments: PreparedAttachment[] = [];
  isPreparingFile = false;
  isSaving = false;
  uploadProgress = 0;
  persistedRecord: HealthRecord | null = null;

  constructor(
    public readonly dialogRef: MatDialogRef<HealthRecordFormComponent>,
    private readonly health: HealthService,
    private readonly media: MediaService,
    private readonly toast: ToastService,
    private readonly apiError: ApiErrorService
  ) {
    if (!this.data.record) this.form.controls.title.setValue(this.defaultTitle(this.selectedType));
  }

  get selectedType(): HealthRecordType { return this.form.controls.type.value || 'CONSULTATION'; }
  get costCurrencySymbol(): string { return currencySymbol(this.form.controls.currency.value); }
  get hasUnlistedCurrency(): boolean { return !isListedCurrency(this.form.controls.currency.value); }
  get showsProduct(): boolean { return this.selectedType === 'VACCINE' || this.selectedType === 'MEDICATION'; }
  get showsProfessional(): boolean {
    return ['VACCINE', 'MEDICATION', 'CONSULTATION', 'EXAM'].includes(this.selectedType);
  }
  get availableAttachmentSlots(): number {
    return 5 - (this.data.record?.attachments.length || 0) - this.pendingAttachments.length;
  }

  selectType(type: HealthRecordType): void {
    this.form.controls.type.setValue(type);
    if (!this.showsProduct) this.form.patchValue({ productName: '', dosage: '', batchNumber: '' });
    if (!this.showsProfessional) this.form.patchValue({ professionalName: '', clinicName: '' });
    if (!this.form.controls.title.dirty) this.form.controls.title.setValue(this.defaultTitle(type));
  }

  async chooseFiles(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    input.value = '';
    if (!files.length) return;
    if (files.length > this.availableAttachmentSlots) {
      this.toast.warning(`Você pode adicionar mais ${Math.max(0, this.availableAttachmentSlots)} arquivo(s) a este registro.`);
      return;
    }
    this.isPreparingFile = true;
    try {
      for (const file of files) this.pendingAttachments.push(await this.media.prepareAttachment(file));
    } catch (error) {
      this.toast.error(error instanceof Error ? error.message : 'Não foi possível preparar o anexo.');
    } finally {
      this.isPreparingFile = false;
    }
  }

  removePending(index: number): void { this.pendingAttachments.splice(index, 1); }

  async submit(): Promise<void> {
    this.form.updateValueAndValidity();
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.warning('Revise os campos destacados antes de salvar.');
      return;
    }
    this.isSaving = true;
    try {
      if (!this.persistedRecord) {
        const request = this.request();
        this.persistedRecord = await firstValueFrom(
          this.data.record
            ? this.health.updateRecord(this.data.record, request)
            : this.health.createRecord(this.data.petId, request)
        );
      }
      const total = this.pendingAttachments.length;
      let uploaded = 0;
      while (this.pendingAttachments.length) {
        const attachment = this.pendingAttachments[0];
        await firstValueFrom(this.media.uploadAttachment(this.persistedRecord.id, attachment, progress => {
          this.uploadProgress = Math.round(((uploaded + progress / 100) / total) * 100);
        }));
        this.pendingAttachments.shift();
        uploaded += 1;
      }
      this.toast.success(this.isEdit ? 'Registro clínico atualizado.' : 'Registro adicionado à linha do tempo.');
      this.dialogRef.close(true);
    } catch (error) {
      this.isSaving = false;
      if (this.persistedRecord) {
        this.toast.warning(this.apiError.message(error, 'O registro foi salvo, mas um anexo não pôde ser enviado. Tente novamente.'));
      } else {
        this.toast.error(this.apiError.message(error, 'Não foi possível salvar o registro de saúde.'));
      }
    }
  }

  private request(): HealthRecordRequest {
    const value = this.form.getRawValue();
    const clean = (text: string | null | undefined) => text?.trim() || null;
    const hasCost = value.costAmount !== null && value.costAmount !== undefined;
    return {
      type: value.type!,
      title: value.title!.trim(),
      occurredAt: new Date(value.occurredAt!).toISOString(),
      notes: clean(value.notes),
      productName: this.showsProduct ? clean(value.productName) : null,
      dosage: this.showsProduct ? clean(value.dosage) : null,
      batchNumber: this.showsProduct ? clean(value.batchNumber) : null,
      professionalName: this.showsProfessional ? clean(value.professionalName) : null,
      clinicName: this.showsProfessional ? clean(value.clinicName) : null,
      costAmount: hasCost ? Number(value.costAmount) : null,
      currency: hasCost ? normalizeCurrency(value.currency) : null
    };
  }

  private toLocalInput(value?: string): string {
    const date = value ? new Date(value) : new Date();
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date.toISOString().slice(0, 16);
  }

  private defaultTitle(type: HealthRecordType): string {
    return ({
      VACCINE: 'Vacina aplicada', MEDICATION: 'Medicamento administrado', CONSULTATION: 'Consulta veterinária',
      EXAM: 'Exame realizado', SYMPTOM: 'Sintoma observado', DAILY_CARE: 'Cuidado diário'
    } as Record<HealthRecordType, string>)[type];
  }
}
