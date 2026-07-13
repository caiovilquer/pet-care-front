import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { EXPENSE_CATEGORY_META, Expense, ExpenseCategory, ExpenseRequest } from '../../core/models/finance.model';
import { PetSummary } from '../../core/models/pet.model';
import { ApiErrorService } from '../../core/services/api-error.service';
import { DateTimeService } from '../../core/services/datetime.service';
import { FinanceService } from '../../core/services/finance.service';
import { ToastService } from '../../core/services/toast.service';
import { CURRENCY_OPTIONS, currencySymbol, isListedCurrency, normalizeCurrency } from '../../core/models/currency.model';

export interface ExpenseFormData { pets: PetSummary[]; expense?: Expense; defaultPetId?: number | null; }

@Component({
  selector: 'rp-expense-form', standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatButtonModule, MatDatepickerModule, MatFormFieldModule, MatIconModule, MatInputModule, MatProgressSpinnerModule, MatSelectModule],
  template: `
    <div class="head"><p class="q-overline">Custo realizado</p><h2 mat-dialog-title>{{ data.expense ? 'Editar despesa' : 'Registrar despesa' }}</h2><p>Registre apenas o que já aconteceu. Custos de consultas e exames informados na caderneta entram automaticamente — não os repita aqui.</p></div>
    <mat-dialog-content><form id="expense-form" [formGroup]="form" (ngSubmit)="save()">
      <mat-form-field appearance="outline"><mat-label>Pet</mat-label><mat-select formControlName="petId" required>@for (pet of data.pets; track pet.id) { <mat-option [value]="pet.id">{{ pet.name }}</mat-option> }</mat-select><mat-error>Escolha um pet</mat-error></mat-form-field>
      <mat-form-field appearance="outline"><mat-label>Categoria</mat-label><mat-select formControlName="category" required>@for (item of categories; track item) { <mat-option [value]="item"><mat-icon>{{ meta[item].icon }}</mat-icon>{{ meta[item].label }}</mat-option> }</mat-select></mat-form-field>
      <mat-form-field appearance="outline"><mat-label>Descrição</mat-label><input matInput formControlName="description" maxlength="160" placeholder="Ex.: Consulta de retorno" required><mat-error>Informe uma descrição</mat-error></mat-form-field>
      <div class="row"><mat-form-field appearance="outline" floatLabel="always"><mat-label>Valor</mat-label><span matTextPrefix>{{ costCurrencySymbol }}&nbsp;</span><input matInput type="number" formControlName="amount" min="0.01" max="9999999999.99" step="0.01" placeholder="0,00" required><mat-error>Informe um valor positivo</mat-error></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Moeda</mat-label><mat-select formControlName="currency">@for (currency of currencies; track currency.code) { <mat-option [value]="currency.code">{{ currency.label }} ({{ currency.code }})</mat-option> } @if (hasUnlistedCurrency) { <mat-option [value]="form.controls.currency.value">{{ form.controls.currency.value }}</mat-option> }</mat-select></mat-form-field></div>
      <div class="row"><mat-form-field appearance="outline"><mat-label>Data</mat-label><input matInput [matDatepicker]="picker" formControlName="date" required><mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle><mat-datepicker #picker></mat-datepicker></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Horário</mat-label><input matInput type="time" formControlName="time" required></mat-form-field></div>
      <mat-form-field appearance="outline"><mat-label>Observação (opcional)</mat-label><textarea matInput rows="3" maxlength="1000" formControlName="notes"></textarea></mat-form-field>
    </form></mat-dialog-content>
    <mat-dialog-actions align="end"><button mat-button (click)="dialogRef.close()" [disabled]="saving">Cancelar</button><button mat-flat-button type="submit" form="expense-form" [disabled]="saving">@if (saving) { <mat-spinner diameter="18"></mat-spinner> }{{ saving ? 'Salvando…' : 'Salvar despesa' }}</button></mat-dialog-actions>
  `,
  styles: [`
    .head{padding:var(--q-space-4) var(--q-space-5) var(--q-space-2)}.head h2{margin:0;padding:0}.head>p:last-child{color:var(--q-text-2);margin:5px 0 0;font-size:.84rem}
    form{display:grid;gap:16px;padding-top:8px}.row{display:grid;grid-template-columns:1fr 1fr;gap:12px}mat-form-field{width:100%}mat-dialog-actions{padding:12px 24px 20px}mat-spinner{display:inline-block;margin-right:8px}
    @media(max-width:520px){.row{grid-template-columns:1fr;gap:16px}.head{padding-inline:16px}}
  `]
})
export class ExpenseFormComponent {
  readonly meta = EXPENSE_CATEGORY_META;
  readonly categories = Object.keys(EXPENSE_CATEGORY_META) as ExpenseCategory[];
  readonly currencies = CURRENCY_OPTIONS;
  saving = false;
  readonly form;

  constructor(
    fb: FormBuilder,
    private readonly finance: FinanceService,
    private readonly dates: DateTimeService,
    private readonly toast: ToastService,
    private readonly errors: ApiErrorService,
    public readonly dialogRef: MatDialogRef<ExpenseFormComponent>,
    @Inject(MAT_DIALOG_DATA) public readonly data: ExpenseFormData,
  ) {
    const occurred = data.expense ? new Date(data.expense.occurredAt) : new Date();
    this.form = fb.nonNullable.group({
      petId: [data.expense?.petId || data.defaultPetId || 0, [Validators.required, Validators.min(1)]],
      category: [data.expense?.category || 'VETERINARY' as ExpenseCategory, Validators.required],
      description: [data.expense?.description || '', [Validators.required, Validators.maxLength(160)]],
      amount: [data.expense?.amount ?? (null as number | null), [Validators.required, Validators.min(.01), Validators.max(9999999999.99)]],
      currency: [normalizeCurrency(data.expense?.currency), [Validators.required, Validators.pattern(/^[A-Z]{3}$/)]],
      date: [occurred, Validators.required], time: [this.time(occurred), Validators.required],
      notes: [data.expense?.notes || '', Validators.maxLength(1000)],
    });
  }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const value = this.form.getRawValue();
    const occurred = this.dates.combineDateAndTime(value.date, value.time);
    if (occurred.getTime() > Date.now() + 5 * 60_000) { this.toast.warning('A despesa não pode estar no futuro.'); return; }
    const request: ExpenseRequest = {
      petId: Number(value.petId), category: value.category, description: value.description.trim(), amount: Number(value.amount),
      currency: normalizeCurrency(value.currency), occurredAt: occurred.toISOString(), notes: value.notes.trim() || null,
    };
    this.saving = true;
    const operation = this.data.expense ? this.finance.update(this.data.expense, request) : this.finance.create(request);
    operation.subscribe({
      next: result => { this.toast.success('Despesa registrada.'); this.dialogRef.close(result); },
      error: error => { this.saving = false; this.toast.error(this.errors.message(error, 'Não foi possível salvar a despesa.')); },
    });
  }
  get costCurrencySymbol(): string { return currencySymbol(this.form.controls.currency.value); }
  get hasUnlistedCurrency(): boolean { return !isListedCurrency(this.form.controls.currency.value); }
  private time(value: Date): string { return `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`; }
}
