export const environment = {
  production: false,
  apiUrl: (globalThis as any)?.['ENV']?.['API_URL'] || '/api/v1',
  googleMaps: {
    apiKey: (globalThis as any)?.['ENV']?.['GOOGLE_MAPS_API_KEY'] || '',
    language: 'pt-BR',
    region: 'BR'
  }
};
