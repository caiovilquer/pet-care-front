import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { API_CONFIG } from '../config/api.config';
import { GoogleMapsService, PlaceResult } from './google-maps.service';
import { 
  LocationSearchParams, 
  LocationSearchResponse, 
  Petshop, 
  Veterinary,
  Location,
  PetType,
  VeterinarySpecialty
} from '../models/location.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  private readonly http = inject(HttpClient);
  private readonly googleMapsService = inject(GoogleMapsService);
  private readonly apiUrl = API_CONFIG.baseUrl;

  searchPetshops(params: LocationSearchParams): Observable<LocationSearchResponse> {
    return this.searchPetshopsWithGoogleMaps(params);
  }

  searchVeterinaries(params: LocationSearchParams): Observable<LocationSearchResponse> {
    return this.searchVeterinariesWithGoogleMaps(params);
  }

  /**
   * Busca petshops usando Google Maps API
   */
  private searchPetshopsWithGoogleMaps(params: LocationSearchParams): Observable<LocationSearchResponse> {
    return this.googleMapsService.geocodeZipCode(params.zipCode).pipe(
      switchMap(geocodeResult => {
        const radiusInMeters = params.radius * 1000; // Converter km para metros
        return this.googleMapsService.searchNearbyPetshops(
          geocodeResult.latitude, 
          geocodeResult.longitude, 
          radiusInMeters
        ).pipe(
          switchMap(googlePlaces => {
            let filteredPlaces = googlePlaces;

            // Aplicar filtros
            if (params.isOpenNow) {
              filteredPlaces = filteredPlaces.filter(place => 
                place.openingHours?.openNow === true
              );
            }

            // Calcular distâncias reais para cada local
            const distanceCalculations = filteredPlaces.map(place =>
              this.googleMapsService.calculateDistance(
                { lat: geocodeResult.latitude, lng: geocodeResult.longitude },
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
              map(placesWithDistances => {
                // Ordenar
                this.sortPlacesWithRealDistances(placesWithDistances, params.sortBy || 'distance');

                // Converter para formato interno
                const locations = placesWithDistances.map(place => 
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
   * Busca veterinários usando Google Maps API
   */
  private searchVeterinariesWithGoogleMaps(params: LocationSearchParams): Observable<LocationSearchResponse> {
    return this.googleMapsService.geocodeZipCode(params.zipCode).pipe(
      switchMap(geocodeResult => {
        const radiusInMeters = params.radius * 1000; // Converter km para metros
        return this.googleMapsService.searchNearbyVeterinaries(
          geocodeResult.latitude, 
          geocodeResult.longitude, 
          radiusInMeters
        ).pipe(
          switchMap(googlePlaces => {
            let filteredPlaces = googlePlaces;

            // Aplicar filtros
            if (params.isOpenNow) {
              filteredPlaces = filteredPlaces.filter(place => 
                place.openingHours?.openNow === true
              );
            }

            // Calcular distâncias reais para cada local
            const distanceCalculations = filteredPlaces.map(place =>
              this.googleMapsService.calculateDistance(
                { lat: geocodeResult.latitude, lng: geocodeResult.longitude },
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
              map(placesWithDistances => {
                // Ordenar
                this.sortPlacesWithRealDistances(placesWithDistances, params.sortBy || 'distance');

                // Converter para formato interno
                const locations = placesWithDistances.map(place => 
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

  // Método para validar CEP brasileiro
  validateZipCode(zipCode: string): boolean {
    const zipCodeRegex = /^\d{5}-?\d{3}$/;
    return zipCodeRegex.test(zipCode);
  }

  // Método para formatar CEP
  formatZipCode(zipCode: string): string {
    const cleanZipCode = zipCode.replace(/\D/g, '');
    if (cleanZipCode.length === 8) {
      return `${cleanZipCode.substring(0, 5)}-${cleanZipCode.substring(5)}`;
    }
    return zipCode;
  }

  // Método para buscar coordenadas por CEP (usando API externa)
  getCoordinatesByZipCode(zipCode: string): Observable<{ lat: number; lng: number; address: string }> {
    const formattedZipCode = this.formatZipCode(zipCode);
    return this.http.get<any>(`https://viacep.com.br/ws/${formattedZipCode.replace('-', '')}/json/`)
      .pipe(
        map(response => ({
          lat: 0, // ViaCEP não retorna coordenadas, você pode integrar com Google Maps API
          lng: 0,
          address: `${response.logradouro}, ${response.bairro}, ${response.localidade} - ${response.uf}`
        }))
      );
  }

  // Método para calcular distância entre dois pontos (fórmula de Haversine)
  calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Raio da Terra em km
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
   * Ordena lugares por critério especificado
   */
  private sortPlaces(places: PlaceResult[], sortBy: string): void {
    switch (sortBy) {
      case 'rating':
        places.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'name':
        places.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'distance':
      default:
        // Google Maps já retorna ordenado por distância
        break;
    }
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
      website: place.website,
      rating: place.rating || 0,
      reviewCount: place.userRatingsTotal || 0,
      distance: place.distance || this.calculateDistanceFromOrigin(place.location.lat, place.location.lng),
      distanceText: place.distanceText,
      durationText: place.durationText,
      isOpen: place.openingHours?.openNow || false,
      type: 'petshop',
      hasGrooming: this.inferServiceFromTypes(place.types, 'grooming'),
      hasDaycare: this.inferServiceFromTypes(place.types, 'daycare'),
      hasHotel: this.inferServiceFromTypes(place.types, 'hotel'),
      hasVaccination: this.inferServiceFromTypes(place.types, 'vaccination'),
      acceptedPetTypes: [PetType.DOG, PetType.CAT], // Padrão
      services: this.inferServicesFromTypes(place.types, 'petshop'),
      imageUrl: place.photos?.[0],
      openingHours: this.convertGoogleHoursToOpeningHours(place.openingHours)
    };
  }

  /**
   * Converte PlaceResult do Google Maps para Veterinary
   */
  private convertGooglePlaceToVeterinary(place: any): Veterinary {
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
      website: place.website,
      rating: place.rating || 0,
      reviewCount: place.userRatingsTotal || 0,
      distance: place.distance || this.calculateDistanceFromOrigin(place.location.lat, place.location.lng),
      distanceText: place.distanceText,
      durationText: place.durationText,
      isOpen: place.openingHours?.openNow || false,
      type: 'veterinary',
      hasEmergency: this.inferEmergencyFromName(place.name) || this.inferServiceFromTypes(place.types, 'emergency'),
      hasLaboratory: this.inferServiceFromTypes(place.types, 'laboratory'),
      hasSurgery: this.inferServiceFromTypes(place.types, 'surgery'),
      hasRadiology: this.inferServiceFromTypes(place.types, 'radiology'),
      specialties: this.inferSpecialtiesFromTypes(place.types),
      acceptedPetTypes: [PetType.DOG, PetType.CAT], // Padrão
      services: this.inferServicesFromTypes(place.types, 'veterinary'),
      imageUrl: place.photos?.[0],
      openingHours: this.convertGoogleHoursToOpeningHours(place.openingHours)
    };
  }

  private extractNeighborhood(address: string): string {
    // Lógica simples para extrair bairro do endereço
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
    // Implementar lógica para calcular distância do ponto de origem
    // Exemplo: retornar 0 ou uma distância fixa
    return 0; // Placeholder
  }

  private inferServiceFromTypes(types: string[], service: string): boolean {
    const typeString = types.join(' ').toLowerCase();
    const serviceMap: { [key: string]: string[] } = {
      grooming: ['grooming', 'spa', 'banho', 'tosa'],
      daycare: ['daycare', 'creche', 'cuidado'],
      hotel: ['hotel', 'hospedagem', 'pensao'],
      vaccination: ['vaccination', 'vacina', 'imunizacao'],
      emergency: ['emergency', 'emergencia', '24h', 'urgencia'],
      laboratory: ['laboratory', 'laboratorio', 'exame'],
      surgery: ['surgery', 'cirurgia', 'operacao'],
      radiology: ['radiology', 'radiologia', 'raio-x']
    };

    const keywords = serviceMap[service] || [];
    return keywords.some(keyword => typeString.includes(keyword));
  }

  private inferServicesFromTypes(types: string[], businessType: string): string[] {
    const services: string[] = [];
    
    if (businessType === 'petshop') {
      if (this.inferServiceFromTypes(types, 'grooming')) services.push('grooming');
      if (this.inferServiceFromTypes(types, 'daycare')) services.push('daycare');
      if (this.inferServiceFromTypes(types, 'hotel')) services.push('hotel');
      if (this.inferServiceFromTypes(types, 'vaccination')) services.push('vaccination');
      services.push('food', 'toys'); // Serviços padrão
    } else if (businessType === 'veterinary') {
      services.push('general'); // Sempre tem clínica geral
      if (this.inferServiceFromTypes(types, 'emergency')) services.push('emergency');
      if (this.inferServiceFromTypes(types, 'surgery')) services.push('surgery');
      if (this.inferServiceFromTypes(types, 'laboratory')) services.push('laboratory');
      if (this.inferServiceFromTypes(types, 'radiology')) services.push('radiology');
    }

    return services;
  }

  private inferEmergencyFromName(name: string): boolean {
    const emergencyKeywords = ['24h', '24 horas', 'emergencia', 'urgencia', 'hospital'];
    const nameLower = name.toLowerCase();
    return emergencyKeywords.some(keyword => nameLower.includes(keyword));
  }

  private inferSpecialtiesFromTypes(types: string[]): VeterinarySpecialty[] {
    const specialties: VeterinarySpecialty[] = [VeterinarySpecialty.GENERAL];
    
    // Lógica simples - em uma implementação real, isso seria mais sofisticado
    if (this.inferServiceFromTypes(types, 'cardiology')) {
      specialties.push(VeterinarySpecialty.CARDIOLOGY);
    }
    if (this.inferServiceFromTypes(types, 'dermatology')) {
      specialties.push(VeterinarySpecialty.DERMATOLOGY);
    }

    return specialties;
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

  /**
   * Converte horário de um dia específico do Google Maps
   */
  private parseGoogleDaySchedule(dayText: string): { isOpen: boolean; openTime?: string; closeTime?: string } {
    if (!dayText) {
      return { isOpen: false };
    }

    // Remover o nome do dia (ex: "Monday: ")
    const timeText = dayText.split(': ')[1];
    
    if (!timeText || timeText.toLowerCase().includes('closed') || timeText.toLowerCase().includes('fechado')) {
      return { isOpen: false };
    }

    if (timeText.toLowerCase().includes('24 hours') || timeText.toLowerCase().includes('24 horas')) {
      return { isOpen: true, openTime: '00:00', closeTime: '23:59' };
    }

    // Extrair horários (ex: "9:00 AM – 6:00 PM" ou "09:00 – 18:00")
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

      // Converter para formato 24h se necessário
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

    // Se não conseguiu fazer parse, retorna padrão
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

  // Método para verificar se está aberto agora
  isOpenNow(location: Location): boolean {
    // Usar informação do Google Maps se disponível
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

    // Verifica se o horário de fechamento é no dia seguinte (ex: abre 22:00, fecha 02:00)
    if (closeTime < openTime) {
      return currentTime >= openTime || currentTime <= closeTime;
    }

    return currentTime >= openTime && currentTime <= closeTime;
  }

  /**
   * Retorna o próximo horário de funcionamento
   */
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
          // Hoje - verificar se ainda não passou do horário
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
