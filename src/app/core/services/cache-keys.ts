/** Chaves de cache compartilhadas entre serviços (permite invalidação cruzada, ex.: pet -> perfil do tutor). */
export const CacheKeys = {
  dashboard: 'dashboard:overview',
  petsPrefix: 'pets:',
  petsAll: (page: number, size: number) => `pets:all:${page}:${size}`,
  petsList: 'pets:list',
  petById: (id: number) => `pets:byId:${id}`,

  eventsPrefix: 'events:',
  eventsAll: (page: number, size: number) => `events:all:${page}:${size}`,
  eventsList: 'events:list',
  eventsByPet: (petId: number) => `events:byPet:${petId}`,
  eventById: (id: number) => `events:byId:${id}`,

  tutorMe: 'tutor:me'
};
