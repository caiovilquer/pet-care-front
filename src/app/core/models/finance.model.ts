export type ExpenseCategory =
  | 'VETERINARY' | 'MEDICATION' | 'VACCINE' | 'EXAM' | 'FOOD'
  | 'HYGIENE' | 'SERVICE' | 'INSURANCE' | 'OTHER';

export interface Expense {
  id: string; version: number; petId: number; category: ExpenseCategory; description: string;
  amount: number; currency: string; occurredAt: string; notes?: string | null; createdByTutorId: number;
}
export interface ExpenseRequest {
  petId: number; category: ExpenseCategory; description: string; amount: number;
  currency: string; occurredAt: string; notes: string | null;
}
export interface ExpensesPage { items: Expense[]; total: number; page: number; size: number; }
export interface MoneyTotal { currency: string; amount: number; }
export interface RealizedMoney { currency: string; expenses: number; clinical: number; total: number; }
export interface CategoryCost { category: string; currency: string; amount: number; }
export interface MonthlyCost { month: string; currency: string; amount: number; }
export interface ForecastCost {
  occurrenceId: string; petId: number; title: string; dueAt: string; amount: number; currency: string;
}
export interface FinancialInsight { code: string; message: string; }
export interface FinanceOverview {
  from: string; to: string; forecastTo: string; realized: RealizedMoney[]; forecast: MoneyTotal[];
  byCategory: CategoryCost[]; monthly: MonthlyCost[]; upcoming: ForecastCost[]; insights: FinancialInsight[];
}

export const EXPENSE_CATEGORY_META: Record<ExpenseCategory, { label: string; icon: string }> = {
  VETERINARY: { label: 'Veterinário', icon: 'local_hospital' }, MEDICATION: { label: 'Medicamentos', icon: 'medication' },
  VACCINE: { label: 'Vacinas', icon: 'vaccines' }, EXAM: { label: 'Exames', icon: 'biotech' },
  FOOD: { label: 'Alimentação', icon: 'restaurant' }, HYGIENE: { label: 'Higiene', icon: 'shower' },
  SERVICE: { label: 'Serviços', icon: 'content_cut' }, INSURANCE: { label: 'Plano ou seguro', icon: 'health_and_safety' },
  OTHER: { label: 'Outros', icon: 'receipt_long' }
};
