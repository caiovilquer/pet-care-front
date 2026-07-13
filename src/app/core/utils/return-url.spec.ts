import { safeReturnUrl } from './return-url';

describe('safeReturnUrl', () => {
  it('keeps an invitation route through login and signup', () => {
    expect(safeReturnUrl('/invite?token=secure-token')).toBe('/invite?token=secure-token');
  });

  it('rejects external and missing destinations', () => {
    expect(safeReturnUrl('//example.com/invite')).toBeNull();
    expect(safeReturnUrl('https://example.com/invite')).toBeNull();
    expect(safeReturnUrl(null)).toBeNull();
  });
});
