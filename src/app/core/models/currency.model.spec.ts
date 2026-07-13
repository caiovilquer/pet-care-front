import { CURRENCY_OPTIONS, currencySymbol, isListedCurrency, normalizeCurrency } from './currency.model';

describe('currency options', () => {
  it('offers the four currencies supported by the cost forms', () => {
    expect(CURRENCY_OPTIONS.map(option => option.code)).toEqual(['BRL', 'USD', 'EUR', 'GBP']);
  });

  it('returns readable symbols and preserves other ISO codes', () => {
    expect(currencySymbol('USD')).toBe('$');
    expect(currencySymbol('eur')).toBe('€');
    expect(currencySymbol('JPY')).toBe('JPY');
    expect(isListedCurrency('GBP')).toBeTrue();
    expect(isListedCurrency('JPY')).toBeFalse();
    expect(normalizeCurrency(' usd ')).toBe('USD');
    expect(normalizeCurrency(null)).toBe('BRL');
  });
});
