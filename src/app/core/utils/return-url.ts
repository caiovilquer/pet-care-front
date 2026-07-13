export const safeReturnUrl = (value: string | null): string | null =>
  value?.startsWith('/') && !value.startsWith('//') ? value : null;
