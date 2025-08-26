import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin, of, BehaviorSubject } from 'rxjs';
import { map, switchMap, catchError, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { GoogleMapsService, PlaceResult } from './google-maps.service';
import { CacheService } from './cache.service';
import { 
  LocationSearchParams, 
  LocationSearchResponse, 
  Petshop, 
  Veterinary,
  Location,
  PetType,
  VeterinarySpecialty
} from '../models/location.model';

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  private readonly http = inject(HttpClient);
  private readonly googleMapsService = inject(GoogleMapsService);
  private readonly cacheService = inject(CacheService);
  private readonly apiUrl = environment.apiUrl;

  // Subject para debounce de pesquisas
  private searchSubject = new BehaviorSubject<LocationSearchParams | null>(null);
  
  // Cache de última localização pesquisada
  private lastGeocodedLocation: { zipCode: string; latitude: number; longitude: number } | null = null;

  constructor() {
    // Setup debounce para pesquisas
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged((prev, curr) => 
        JSON.stringify(prev) === JSON.stringify(curr)
      )
    ).subscribe();
  }

  searchPetshops(params: LocationSearchParams): Observable<LocationSearchResponse> {
    const cacheKey = this.cacheService.generateKey('petshops_search', params);
    
    return this.cacheService.getOrSet(
      cacheKey,
      () => this.searchPetshopsWithGoogleMaps(params),
      { ttl: 120, maxSize: 20 } // 2 horas de cache para pesquisas
    );
  }

  searchVeterinaries(params: LocationSearchParams): Observable<LocationSearchResponse> {
    const cacheKey = this.cacheService.generateKey('veterinaries_search', params);
    
    return this.cacheService.getOrSet(
      cacheKey,
      () => this.searchVeterinariesWithGoogleMaps(params),
      { ttl: 120, maxSize: 20 } // 2 horas de cache para pesquisas
    );
  }
  
  /**
   * Busca estabelecimentos muito próximos ou exatamente no CEP - versão otimizada
   */
  private searchExactAreaPetshops(latitude: number, longitude: number, radius: number): Observable<PlaceResult[]> {
    return this.googleMapsService.searchByKeywordOptimized(
      latitude,
      longitude,
      radius,
      ['pet_store', 'pet grooming', 'pet shop'] // Reduzir keywords
    );
  }
  
  /**
   * Busca veterinários muito próximos ou exatamente no CEP - versão otimizada
   */
  private searchExactAreaVeterinaries(latitude: number, longitude: number, radius: number): Observable<PlaceResult[]> {
    return this.googleMapsService.searchByKeywordOptimized(
      latitude,
      longitude,
      radius,
      ['veterinary_care', 'clinica veterinaria'] // Reduzir keywords
    );
  }

  /**
   * Busca petshops usando Google Maps API com otimizações
   */
  private searchPetshopsWithGoogleMaps(params: LocationSearchParams): Observable<LocationSearchResponse> {
    // Reutilizar coordenadas se for o mesmo CEP
    const getCoordinates = () => {
      if (this.lastGeocodedLocation && this.lastGeocodedLocation.zipCode === params.zipCode) {
        return of({
          latitude: this.lastGeocodedLocation.latitude,
          longitude: this.lastGeocodedLocation.longitude
        });
      }
      
      return this.googleMapsService.geocodeZipCode(params.zipCode).pipe(
        map(result => {
          this.lastGeocodedLocation = {
            zipCode: params.zipCode,
            latitude: result.latitude,
            longitude: result.longitude
          };
          return { latitude: result.latitude, longitude: result.longitude };
        })
      );
    };

    return getCoordinates().pipe(
      switchMap(coordinates => {
        const radiusInMeters = params.radius * 1000;

        // Buscar apenas na região mais próxima se raio for pequeno
        if (params.radius <= 2) {
          return this.googleMapsService.searchNearbyPetshops(
            coordinates.latitude, 
            coordinates.longitude, 
            radiusInMeters
          ).pipe(
            map(places => this.processPlacesSimple(places, params))
          );
        }

        // Para raios maiores, fazer busca dupla
        const exactSearch$ = this.searchExactAreaPetshops(
          coordinates.latitude,
          coordinates.longitude,
          Math.min(500, radiusInMeters / 2)
        );
        
        const regularSearch$ = this.googleMapsService.searchNearbyPetshops(
          coordinates.latitude, 
          coordinates.longitude, 
          radiusInMeters
        );
        
        return forkJoin({
          exactResults: exactSearch$,
          regularResults: regularSearch$
        }).pipe(
          map(results => {
            const combinedResults = this.combineAndDeduplicateResults(
              results.exactResults, 
              results.regularResults
            );
            
            return combinedResults;
          }),
          switchMap(googlePlaces => {
            let filteredPlaces = googlePlaces;

            // Aplicar filtros
            if (params.isOpenNow) {
              filteredPlaces = filteredPlaces.filter((place: any) => 
                place.openingHours?.openNow === true
              );
            }

            // Calcular distâncias reais
            const distanceCalculations = filteredPlaces.map((place: any) =>
              this.googleMapsService.calculateDistance(
                { lat: coordinates.latitude, lng: coordinates.longitude },
                { lat: place.location.lat, lng: place.location.lng }
              ).pipe(
                map(distanceInfo => ({
                  ...place,
                  distance: distanceInfo.distanceValue,
                  distanceText: distanceInfo.distance,
                  durationText: distanceInfo.duration
                })),
                catchError(() => of({
                  ...place,
                  distance: 0,
                  distanceText: 'N/A',
                  durationText: 'N/A'
                }))
              )
            );

            return forkJoin(distanceCalculations).pipe(
              map((placesWithDistances: any) => {
                // Filtrar por distância real
                // params.radius está em quilômetros, distance do Google Maps também está em quilômetros
                const maxDistanceKm = params.radius;
                
                const filteredByDistance = placesWithDistances.filter((place: any) => {
                  const distanceInKm = place.distance || 0;
                  return distanceInKm <= maxDistanceKm;
                });
                
                // Remover duplicatas novamente após cálculo de distância
                const uniqueResults = this.removeDuplicateResults(filteredByDistance);
                
                // Ordenar
                this.sortPlacesWithRealDistances(uniqueResults, params.sortBy || 'distance');

                // Converter para formato interno
                const locations = uniqueResults.map((place: any) => 
                  this.convertGooglePlaceToPetshop(place)
                );

                return {
                  locations,
                  total: locations.length,
                  searchParams: params
                } as LocationSearchResponse;
              })
            );
          })
        );
      }),
      catchError(error => {
        console.error('Erro ao buscar petshops com Google Maps:', error);
        throw error;
      })
    );
  }

  /**
   * Busca veterinários usando Google Maps API com otimizações
   */
  private searchVeterinariesWithGoogleMaps(params: LocationSearchParams): Observable<LocationSearchResponse> {
    // Reutilizar coordenadas se for o mesmo CEP
    const getCoordinates = () => {
      if (this.lastGeocodedLocation && this.lastGeocodedLocation.zipCode === params.zipCode) {
        return of({
          latitude: this.lastGeocodedLocation.latitude,
          longitude: this.lastGeocodedLocation.longitude
        });
      }
      
      return this.googleMapsService.geocodeZipCode(params.zipCode).pipe(
        map(result => {
          this.lastGeocodedLocation = {
            zipCode: params.zipCode,
            latitude: result.latitude,
            longitude: result.longitude
          };
          return { latitude: result.latitude, longitude: result.longitude };
        })
      );
    };

    return getCoordinates().pipe(
      switchMap(coordinates => {
        const radiusInMeters = params.radius * 1000;

        const exactSearch$ = this.searchExactAreaVeterinaries(
          coordinates.latitude,
          coordinates.longitude,
          Math.min(500, radiusInMeters / 2)
        );
        
        const regularSearch$ = this.googleMapsService.searchNearbyVeterinaries(
          coordinates.latitude, 
          coordinates.longitude, 
          radiusInMeters
        );
        
        return forkJoin({
          exactResults: exactSearch$,
          regularResults: regularSearch$
        }).pipe(
          map(results => {
            // Combinar e remover duplicatas usando uma estratégia mais robusta
            const combinedResults = this.combineAndDeduplicateResults(
              results.exactResults, 
              results.regularResults
            );
            
            return combinedResults;
          }),
          switchMap(googlePlaces => {
            let filteredPlaces = googlePlaces;

            // Aplicar filtros
            if (params.isOpenNow) {
              filteredPlaces = filteredPlaces.filter((place: any) => 
                place.openingHours?.openNow === true
              );
            }

            // Calcular distâncias reais
            const distanceCalculations = filteredPlaces.map((place: any) =>
              this.googleMapsService.calculateDistance(
                { lat: coordinates.latitude, lng: coordinates.longitude },
                { lat: place.location.lat, lng: place.location.lng }
              ).pipe(
                map(distanceInfo => ({
                  ...place,
                  distance: distanceInfo.distanceValue,
                  distanceText: distanceInfo.distance,
                  durationText: distanceInfo.duration
                })),
                catchError(() => of({
                  ...place,
                  distance: 0,
                  distanceText: 'N/A',
                  durationText: 'N/A'
                }))
              )
            );

            return forkJoin(distanceCalculations).pipe(
              map((placesWithDistances: any) => {
                // Filtrar por distância real
                // params.radius está em quilômetros, distance do Google Maps também está em quilômetros
                const maxDistanceKm = params.radius;
                
                const filteredByDistance = placesWithDistances.filter((place: any) => {
                  const distanceInKm = place.distance || 0;
                  return distanceInKm <= maxDistanceKm;
                });
                
                // Remover duplicatas novamente após cálculo de distância
                const uniqueResults = this.removeDuplicateResults(filteredByDistance);
                
                // Ordenar
                this.sortPlacesWithRealDistances(uniqueResults, params.sortBy || 'distance');

                // Converter para formato interno
                const locations = uniqueResults.map((place: any) => 
                  this.convertGooglePlaceToVeterinary(place)
                );

                return {
                  locations,
                  total: locations.length,
                  searchParams: params
                } as LocationSearchResponse;
              })
            );
          })
        );
      }),
      catchError(error => {
        console.error('Erro ao buscar veterinários com Google Maps:', error);
        throw error;
      })
    );
  }

  /**
   * Combina resultados e remove duplicatas usando múltiplos critérios
   */
  private combineAndDeduplicateResults(exactResults: PlaceResult[], regularResults: PlaceResult[]): PlaceResult[] {
    const combinedResults: PlaceResult[] = [];
    const processedKeys = new Set<string>();
    
    // Função melhorada para gerar chave única
    const generateUniqueKey = (place: PlaceResult): string => {
      // Primeiro critério: place_id (mais confiável)
      if (place.placeId) {
        return `id:${place.placeId}`;
      }
      
      // Segundo critério: combinação de nome normalizado + coordenadas
      const normalizedName = this.normalizeName(place.name);
      const coordKey = `${place.location.lat.toFixed(6)},${place.location.lng.toFixed(6)}`;
      
      // Terceiro critério: nome + primeiras palavras do endereço
      const addressStart = place.address.split(',')[0]?.trim() || '';
      
      return `name:${normalizedName}|coord:${coordKey}|addr:${addressStart.toLowerCase()}`;
    };

    // Processar resultados exatos primeiro (maior prioridade)
    exactResults.forEach(place => {
      const key = generateUniqueKey(place);
      if (!processedKeys.has(key)) {
        processedKeys.add(key);
        combinedResults.push(place);
      }
    });

    // Processar resultados regulares
    regularResults.forEach(place => {
      const key = generateUniqueKey(place);
      if (!processedKeys.has(key)) {
        processedKeys.add(key);
        combinedResults.push(place);
      }
    });

    return combinedResults;
  }

  /**
   * Normaliza nome para comparação
   */
  private normalizeName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[áàãâ]/g, 'a')
      .replace(/[éêë]/g, 'e')
      .replace(/[íîï]/g, 'i')
      .replace(/[óôõö]/g, 'o')
      .replace(/[úûü]/g, 'u')
      .replace(/[ç]/g, 'c')
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Remove resultados duplicados após o cálculo de distâncias
   */
  private removeDuplicateResults(places: any[]): any[] {
    const uniquePlaces: any[] = [];
    const processedKeys = new Set<string>();
    
    places.forEach(place => {
      const key = this.getUniqueKey(place);
      if (!processedKeys.has(key)) {
        processedKeys.add(key);
        uniquePlaces.push(place);
      }
    });
    
    return uniquePlaces;
  }
  
  /**
   * Gera uma chave única para cada estabelecimento
   */
  private getUniqueKey(place: any): string {
    if (place.placeId) {
      return place.placeId;
    }
    
    return `${this.normalizeName(place.name)}|${place.address}`.toLowerCase();
  }

  /**
   * Ordena lugares com distâncias reais calculadas
   */
  private sortPlacesWithRealDistances(places: any[], sortBy: string): void {
    switch (sortBy) {
      case 'rating':
        places.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'name':
        places.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'distance':
      default:
        places.sort((a, b) => (a.distance || 0) - (b.distance || 0));
        break;
    }
  }

  /**
   * Converte PlaceResult do Google Maps para Petshop
   */
  private convertGooglePlaceToPetshop(place: any): Petshop {
    return {
      id: place.placeId,
      name: place.name,
      address: place.address,
      neighborhood: this.extractNeighborhood(place.address),
      city: this.extractCity(place.address),
      state: this.extractState(place.address),
      zipCode: '',
      latitude: place.location.lat,
      longitude: place.location.lng,
      phone: place.phoneNumber,
      rating: place.rating || 0,
      reviewCount: place.userRatingsTotal || 0,
      distance: place.distance || this.calculateDistanceFromOrigin(place.location.lat, place.location.lng),
      distanceText: place.distanceText,
      durationText: place.durationText,
      isOpen: place.openingHours?.openNow || false,
      type: 'petshop',
      hasGrooming: false,
      hasDaycare: false,
      hasHotel: false,
      hasVaccination: false,
      acceptedPetTypes: [PetType.DOG, PetType.CAT],
      services: ['petshop'],
      openingHours: this.convertGoogleHoursToOpeningHours(place.openingHours)
    };
  }

  /**
   * Converte PlaceResult do Google Maps para Veterinary
   */
  private convertGooglePlaceToVeterinary(place: any): Veterinary {
    // Verificar se é emergência apenas pelo nome para reduzir API calls
    const hasEmergency = this.inferEmergencyFromName(place.name);
    
    return {
      id: place.placeId,
      name: place.name,
      address: place.address,
      neighborhood: this.extractNeighborhood(place.address),
      city: this.extractCity(place.address),
      state: this.extractState(place.address),
      zipCode: '',
      latitude: place.location.lat,
      longitude: place.location.lng,
      phone: place.phoneNumber,
      rating: place.rating || 0,
      reviewCount: place.userRatingsTotal || 0,
      distance: place.distance || this.calculateDistanceFromOrigin(place.location.lat, place.location.lng),
      distanceText: place.distanceText,
      durationText: place.durationText,
      isOpen: place.openingHours?.openNow || false,
      type: 'veterinary',
      hasEmergency: hasEmergency,
      hasLaboratory: false,
      hasSurgery: false,
      hasRadiology: false,
      specialties: [],
      acceptedPetTypes: [PetType.DOG, PetType.CAT],
      services: hasEmergency ? ['veterinary', 'emergency'] : ['veterinary'],
      openingHours: this.convertGoogleHoursToOpeningHours(place.openingHours)
    };
  }

  private extractNeighborhood(address: string): string {
    const parts = address.split(',');
    return parts.length > 1 ? parts[1].trim() : '';
  }

  private extractCity(address: string): string {
    const parts = address.split(',');
    return parts.length > 2 ? parts[2].trim() : '';
  }

  private extractState(address: string): string {
    const parts = address.split(',');
    const lastPart = parts[parts.length - 1];
    const match = lastPart.match(/([A-Z]{2})/);
    return match ? match[1] : '';
  }

  private calculateDistanceFromOrigin(lat: number, lng: number): number {
    return 0; // Placeholder
  }

  private inferEmergencyFromName(name: string): boolean {
    const emergencyKeywords = ['24h', '24 horas', 'emergencia', 'urgencia', 'hospital'];
    const nameLower = name.toLowerCase();
    return emergencyKeywords.some(keyword => nameLower.includes(keyword));
  }

  private convertGoogleHoursToOpeningHours(googleHours?: { openNow: boolean; weekdayText: string[] }) {
    if (!googleHours || !googleHours.weekdayText) {
      return this.getDefaultOpeningHours();
    }

    const openingHours = {
      sunday: this.parseGoogleDaySchedule(googleHours.weekdayText[0]),
      monday: this.parseGoogleDaySchedule(googleHours.weekdayText[1]),
      tuesday: this.parseGoogleDaySchedule(googleHours.weekdayText[2]),
      wednesday: this.parseGoogleDaySchedule(googleHours.weekdayText[3]),
      thursday: this.parseGoogleDaySchedule(googleHours.weekdayText[4]),
      friday: this.parseGoogleDaySchedule(googleHours.weekdayText[5]),
      saturday: this.parseGoogleDaySchedule(googleHours.weekdayText[6])
    };

    return openingHours;
  }

  private parseGoogleDaySchedule(dayText: string): { isOpen: boolean; openTime?: string; closeTime?: string } {
    if (!dayText) {
      return { isOpen: false };
    }

    const timeText = dayText.split(': ')[1];
    
    if (!timeText || timeText.toLowerCase().includes('closed') || timeText.toLowerCase().includes('fechado')) {
      return { isOpen: false };
    }

    if (timeText.toLowerCase().includes('24 hours') || timeText.toLowerCase().includes('24 horas')) {
      return { isOpen: true, openTime: '00:00', closeTime: '23:59' };
    }

    const timeMatch = timeText.match(/(\d{1,2}):?(\d{0,2})\s?(AM|PM)?\s?[–-]\s?(\d{1,2}):?(\d{0,2})\s?(AM|PM)?/i);
    
    if (timeMatch) {
      const openHour = parseInt(timeMatch[1]);
      const openMin = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
      const openPeriod = timeMatch[3];
      const closeHour = parseInt(timeMatch[4]);
      const closeMin = timeMatch[5] ? parseInt(timeMatch[5]) : 0;
      const closePeriod = timeMatch[6];

      let openTime24 = openHour;
      let closeTime24 = closeHour;

      if (openPeriod) {
        if (openPeriod.toLowerCase() === 'pm' && openHour !== 12) {
          openTime24 = openHour + 12;
        } else if (openPeriod.toLowerCase() === 'am' && openHour === 12) {
          openTime24 = 0;
        }
      }

      if (closePeriod) {
        if (closePeriod.toLowerCase() === 'pm' && closeHour !== 12) {
          closeTime24 = closeHour + 12;
        } else if (closePeriod.toLowerCase() === 'am' && closeHour === 12) {
          closeTime24 = 0;
        }
      }

      const openTime = `${openTime24.toString().padStart(2, '0')}:${openMin.toString().padStart(2, '0')}`;
      const closeTime = `${closeTime24.toString().padStart(2, '0')}:${closeMin.toString().padStart(2, '0')}`;

      return {
        isOpen: true,
        openTime,
        closeTime
      };
    }

    return { isOpen: true, openTime: '09:00', closeTime: '18:00' };
  }

  private getDefaultOpeningHours() {
    const defaultHours = { isOpen: true, openTime: '08:00', closeTime: '18:00' };
    
    return {
      monday: defaultHours,
      tuesday: defaultHours,
      wednesday: defaultHours,
      thursday: defaultHours,
      friday: defaultHours,
      saturday: { isOpen: true, openTime: '08:00', closeTime: '14:00' },
      sunday: { isOpen: false }
    };
  }

  // Métodos legacy para compatibilidade
  
  private searchLocations(params: LocationSearchParams): Observable<LocationSearchResponse> {
    let httpParams = new HttpParams()
      .set('zipCode', params.zipCode)
      .set('radius', params.radius.toString())
      .set('type', params.type);

    if (params.services?.length) {
      httpParams = httpParams.set('services', params.services.join(','));
    }

    if (params.petTypes?.length) {
      httpParams = httpParams.set('petTypes', params.petTypes.join(','));
    }

    if (params.isOpenNow !== undefined) {
      httpParams = httpParams.set('isOpenNow', params.isOpenNow.toString());
    }

    if (params.sortBy) {
      httpParams = httpParams.set('sortBy', params.sortBy);
    }

    return this.http.get<LocationSearchResponse>(`${this.apiUrl}/locations/search`, { params: httpParams });
  }

  getLocationById(id: string): Observable<Petshop | Veterinary> {
    return this.http.get<Petshop | Veterinary>(`${this.apiUrl}/locations/${id}`);
  }

  getLocationsByIds(ids: string[]): Observable<(Petshop | Veterinary)[]> {
    const httpParams = new HttpParams().set('ids', ids.join(','));
    return this.http.get<(Petshop | Veterinary)[]>(`${this.apiUrl}/locations/batch`, { params: httpParams });
  }

  validateZipCode(zipCode: string): boolean {
    const zipCodeRegex = /^\d{5}-?\d{3}$/;
    return zipCodeRegex.test(zipCode);
  }

  formatZipCode(zipCode: string): string {
    const cleanZipCode = zipCode.replace(/\D/g, '');
    if (cleanZipCode.length === 8) {
      return `${cleanZipCode.substring(0, 5)}-${cleanZipCode.substring(5)}`;
    }
    return zipCode;
  }

  getCoordinatesByZipCode(zipCode: string): Observable<{ lat: number; lng: number; address: string }> {
    const formattedZipCode = this.formatZipCode(zipCode);
    return this.http.get<any>(`https://viacep.com.br/ws/${formattedZipCode.replace('-', '')}/json/`)
      .pipe(
        map(response => ({
          lat: 0,
          lng: 0,
          address: `${response.logradouro}, ${response.bairro}, ${response.localidade} - ${response.uf}`
        }))
      );
  }

  calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * 
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Processamento simplificado de lugares sem cálculo de distância
   */
  private processPlacesSimple(places: PlaceResult[], params: LocationSearchParams): LocationSearchResponse {
    let filteredPlaces = places;

    // Aplicar filtros básicos
    if (params.isOpenNow) {
      filteredPlaces = filteredPlaces.filter((place: any) => 
        place.openingHours?.openNow === true
      );
    }

    // Converter para formato interno (limitado a 5 resultados)
    const locations = filteredPlaces.slice(0, 5).map((place: any) => 
      this.convertGooglePlaceToPetshop(place)
    );

    return {
      locations,
      total: locations.length,
      searchParams: params
    } as LocationSearchResponse;
  }

  /**
   * Limpar cache de pesquisas
   */
  clearSearchCache(): void {
    this.cacheService.clear();
    this.lastGeocodedLocation = null;
    this.googleMapsService.clearSearchCache();
  }

  /**
   * Obter estatísticas de cache
   */
  getCacheStats() {
    return {
      location: this.cacheService.getStats(),
      googleMaps: this.googleMapsService.getCacheStats()
    };
  }

  isOpenNow(location: Location): boolean {
    if (location.isOpen !== undefined) {
      return location.isOpen;
    }

    const now = new Date();
    const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()] as keyof typeof location.openingHours;
    const todaySchedule = location.openingHours[dayOfWeek];
    
    if (!todaySchedule?.isOpen || !todaySchedule.openTime || !todaySchedule.closeTime) {
      return false;
    }

    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [openHour, openMin] = todaySchedule.openTime.split(':').map(Number);
    const [closeHour, closeMin] = todaySchedule.closeTime.split(':').map(Number);
    const openTime = openHour * 60 + openMin;
    const closeTime = closeHour * 60 + closeMin;

    if (closeTime < openTime) {
      return currentTime >= openTime || currentTime <= closeTime;
    }

    return currentTime >= openTime && currentTime <= closeTime;
  }

  getNextOpenTime(location: Location): string | null {
    const now = new Date();
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(now);
      checkDate.setDate(now.getDate() + i);
      const dayOfWeek = days[checkDate.getDay()] as keyof typeof location.openingHours;
      const schedule = location.openingHours[dayOfWeek];
      
      if (schedule?.isOpen && schedule.openTime) {
        if (i === 0) {
          const currentTime = now.getHours() * 60 + now.getMinutes();
          const [openHour, openMin] = schedule.openTime.split(':').map(Number);
          const openTime = openHour * 60 + openMin;
          
          if (currentTime < openTime) {
            return `Hoje às ${schedule.openTime}`;
          }
        } else {
          const dayName = i === 1 ? 'Amanhã' : 
                        ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][checkDate.getDay()];
          return `${dayName} às ${schedule.openTime}`;
        }
      }
    }
    
    return null;
  }
}
