export const environment = {
  production: true,
  apiUrl: (globalThis as any)?.['ENV']?.['API_URL'] || 'https://your-api-url.com/api/v1',
  googleMaps: {
    apiKey: (globalThis as any)?.['ENV']?.['GOOGLE_MAPS_API_KEY'] || '',
    language: 'pt-BR',
    region: 'BR'
  }
};
