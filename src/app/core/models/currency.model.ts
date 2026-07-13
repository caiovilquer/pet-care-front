export interface CurrencyOption {
  code: string;
  label: string;
  symbol: string;
}

export const CURRENCY_OPTIONS: readonly CurrencyOption[] = [
  { code: 'BRL', label: 'Real brasileiro', symbol: 'R$' },
  { code: 'USD', label: 'Dólar americano', symbol: '$' },
  { code: 'EUR', label: 'Euro', symbol: '€' },
  { code: 'GBP', label: 'Libra esterlina', symbol: '£' },
];

export function normalizeCurrency(code?: string | null, fallback = 'BRL'): string {
  return code?.trim().toUpperCase() || fallback;
}

export function currencySymbol(code?: string | null): string {
  const normalized = normalizeCurrency(code, '');
  return CURRENCY_OPTIONS.find(option => option.code === normalized)?.symbol || normalized || '';
}

export function isListedCurrency(code?: string | null): boolean {
  const normalized = normalizeCurrency(code, '');
  return CURRENCY_OPTIONS.some(option => option.code === normalized);
}
