import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { forkJoin } from 'rxjs';
import { EXPENSE_CATEGORY_META, Expense, ExpenseCategory, FinanceOverview, MonthlyCost } from '../../core/models/finance.model';
import { PetSummary } from '../../core/models/pet.model';
import { ApiErrorService } from '../../core/services/api-error.service';
import { FinanceService } from '../../core/services/finance.service';
import { HouseholdService } from '../../core/services/household.service';
import { PetService } from '../../core/services/pet.service';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmDialogComponent } from '../../shared/components/ui/confirm-dialog.component';
import { ExpenseFormComponent } from './expense-form.component';

@Component({
  selector: 'rp-finance', standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatProgressSpinnerModule, MatSelectModule],
  templateUrl: './finance.component.html', styleUrl: './finance.component.css'
})
export class FinanceComponent implements OnInit {
  readonly categoryMeta = EXPENSE_CATEGORY_META;
  overview: FinanceOverview | null = null;
  expenses: Expense[] = [];
  pets: PetSummary[] = [];
  selectedPetId: number | null = null;
  selectedMonths = 6;
  loading = true; owner = false;

  constructor(
    private readonly finance: FinanceService, private readonly petService: PetService,
    private readonly households: HouseholdService, private readonly toast: ToastService,
    private readonly errors: ApiErrorService, private readonly dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.households.overview().subscribe({
      next: value => { this.owner = value.household.role === 'OWNER'; if (this.owner) this.load(); else this.loading = false; },
      error: error => { this.loading = false; this.toast.error(this.errors.message(error, 'Não foi possível verificar as permissões.')); },
    });
  }
  load(): void {
    this.loading = true;
    const range = this.range();
    forkJoin({
      pets: this.petService.getAllCached(0, 100),
      overview: this.finance.overview(range.fromDate, range.toDate, range.forecastTo, this.selectedPetId),
      expenses: this.finance.expenses(range.fromInstant, range.toInstant, this.selectedPetId, null, 0, 100),
    }).subscribe({
      next: value => { this.pets = value.pets.items; this.overview = value.overview; this.expenses = value.expenses.items; this.loading = false; },
      error: error => { this.loading = false; this.toast.error(this.errors.message(error, 'Não foi possível carregar o planejamento financeiro.')); },
    });
  }
  openExpense(expense?: Expense): void {
    this.dialog.open(ExpenseFormComponent, { width: '660px', maxWidth: 'calc(100vw - 24px)', data: { pets: this.pets, expense, defaultPetId: this.selectedPetId } })
      .afterClosed().subscribe(saved => { if (saved) this.load(); });
  }
  remove(expense: Expense): void {
    this.dialog.open(ConfirmDialogComponent, { data: {
      title: 'Excluir esta despesa?', message: 'O valor sairá dos totais realizados. Planos e registros clínicos não serão alterados.',
      confirmLabel: 'Excluir despesa', danger: true,
    }}).afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.finance.delete(expense).subscribe({ next: () => { this.toast.success('Despesa excluída.'); this.load(); }, error: e => this.toast.error(this.errors.message(e, 'Não foi possível excluir.')) });
    });
  }
  petName(id: number): string { return this.pets.find(pet => pet.id === id)?.name || 'Pet'; }
  money(value: number, currency = 'BRL'): string { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(value); }
  date(value: string): string { return new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }); }
  categoryLabel(value: ExpenseCategory | string): string { return value === 'CLINICAL' ? 'Registros clínicos' : this.categoryMeta[value as ExpenseCategory]?.label || value; }
  monthLabel(value: string): string { const [year, month] = value.split('-').map(Number); return new Date(year, month - 1, 1).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }); }
  monthPercent(item: MonthlyCost): number {
    const max = Math.max(...(this.overview?.monthly.filter(value => value.currency === item.currency).map(value => value.amount) || [1]));
    return max ? Math.max(3, item.amount / max * 100) : 0;
  }
  exportCsv(): void {
    if (!this.expenses.length) { this.toast.info('Não há despesas neste período para exportar.'); return; }
    const rows = [['Data', 'Pet', 'Categoria', 'Descrição', 'Valor', 'Moeda', 'Observação'], ...this.expenses.map(item => [
      item.occurredAt, this.petName(item.petId), this.categoryLabel(item.category), item.description,
      item.amount.toFixed(2), item.currency, item.notes || '',
    ])];
    const csv = '\uFEFF' + rows.map(row => row.map(this.csvCell).join(';')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = `rotinapet-despesas-${this.localDate(new Date())}.csv`;
    document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
  }
  private csvCell(value: string | number): string {
    let text = String(value).replace(/"/g, '""');
    if (/^[=+\-@]/.test(text)) text = `'${text}`;
    return `"${text}"`;
  }
  private range() {
    const now = new Date(); const from = new Date(now.getFullYear(), now.getMonth() - this.selectedMonths + 1, 1);
    const toExclusive = new Date(now); toExclusive.setDate(toExclusive.getDate() + 1); toExclusive.setHours(0, 0, 0, 0);
    const forecast = new Date(now); forecast.setDate(forecast.getDate() + 30);
    return { fromDate: this.localDate(from), toDate: this.localDate(now), forecastTo: this.localDate(forecast), fromInstant: from.toISOString(), toInstant: toExclusive.toISOString() };
  }
  private localDate(value: Date): string { return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`; }
}
