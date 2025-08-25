import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, of, forkJoin, BehaviorSubject, timer } from 'rxjs';
import { map, catchError, switchMap, debounceTime, distinctUntilChanged, shareReplay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { CacheService } from './cache.service';

export interface GoogleMapsConfig {
  apiKey: string;
  language: string;
  region: string;
}

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
}

export interface PlaceResult {
  placeId: string;
  name: string;
  address: string;
  location: {
    lat: number;
    lng: number;
  };
  rating?: number;
  userRatingsTotal?: number;
  businessStatus?: string;
  openingHours?: {
    openNow: boolean;
    weekdayText: string[];
  };
  phoneNumber?: string;
  website?: string;
  photos?: string[];
  types: string[];
  priceLevel?: number;
}

@Injectable({
  providedIn: 'root'
})
export class GoogleMapsService {
  private readonly config: GoogleMapsConfig = {
    apiKey: environment.googleMaps.apiKey,
    language: environment.googleMaps.language,
    region: environment.googleMaps.region
  };

  private isGoogleMapsLoaded = false;
  private searchSubject = new BehaviorSubject<any>(null);
  private ongoingRequests = new Map<string, Observable<any>>();

  // Configurações de cache otimizadas
  private readonly CACHE_CONFIG = {
    GEOCODE: { ttl: 24 * 60, maxSize: 50 }, // 24 horas para geocoding
    PLACES_SEARCH: { ttl: 2 * 60, maxSize: 100 }, // 2 horas para pesquisas de lugares
    PLACE_DETAILS: { ttl: 6 * 60, maxSize: 200 }, // 6 horas para detalhes de lugares
    DISTANCE: { ttl: 4 * 60, maxSize: 100 } // 4 horas para cálculos de distância
  };

  constructor(
    private http: HttpClient,
    private cacheService: CacheService
  ) {
    // Debounce para pesquisas
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe();
  }

  /**
   * Carrega a API do Google Maps dinamicamente
   */
  loadGoogleMaps(): Promise<any> {
    if (this.isGoogleMapsLoaded) {
      return Promise.resolve(window.google);
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${this.config.apiKey}&libraries=places,geometry&language=${this.config.language}&region=${this.config.region}`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        this.isGoogleMapsLoaded = true;
        resolve(window.google);
      };
      
      script.onerror = (error) => {
        reject(error);
      };
      
      document.head.appendChild(script);
    });
  }

  /**
   * Converte CEP em coordenadas usando Google Geocoding API com cache
   */
  geocodeZipCode(zipCode: string): Observable<GeocodeResult> {
    const formattedZipCode = this.formatZipCode(zipCode);
    const cacheKey = this.cacheService.generateKey('geocode', { zipCode: formattedZipCode });
    
    return this.cacheService.getOrSet(
      cacheKey,
      () => this.performGeocode(formattedZipCode),
      this.CACHE_CONFIG.GEOCODE
    );
  }

  private performGeocode(formattedZipCode: string): Observable<GeocodeResult> {
    
    return from(this.loadGoogleMaps()).pipe(
      switchMap(() => {
        const geocoder = new google.maps.Geocoder();
        
        const request: google.maps.GeocoderRequest = {
          address: `${formattedZipCode}, Brazil`,
          region: this.config.region,
          language: this.config.language
        };

        return from(new Promise<GeocodeResult>((resolve, reject) => {
          geocoder.geocode(request, (results, status) => {
            if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
              const result = results[0];
              const location = result.geometry.location;
              
              // Extrair componentes do endereço
              const addressComponents = result.address_components;
              const city = this.getAddressComponent(addressComponents, 'administrative_area_level_2');
              const state = this.getAddressComponent(addressComponents, 'administrative_area_level_1');
              const country = this.getAddressComponent(addressComponents, 'country');
              const postalCode = this.getAddressComponent(addressComponents, 'postal_code');

              resolve({
                latitude: location.lat(),
                longitude: location.lng(),
                address: result.formatted_address,
                city: city || '',
                state: state || '',
                country: country || '',
                zipCode: postalCode || formattedZipCode
              });
            } else {
              reject(new Error(`Erro ao buscar CEP: ${status}`));
            }
          });
        }));
      }),
      catchError(error => {
        console.error('Erro ao buscar coordenadas:', error);
        throw error;
      })
    );
  }

  /**
   * Busca petshops próximos usando Google Places API com cache otimizado
   */
  searchNearbyPetshops(latitude: number, longitude: number, radius: number = 5000): Observable<PlaceResult[]> {
    const cacheKey = this.cacheService.generateKey('petshops', { 
      lat: Math.round(latitude * 1000) / 1000, // Arredondar para reduzir variações de cache
      lng: Math.round(longitude * 1000) / 1000,
      radius: Math.round(radius / 1000) * 1000 // Arredondar raio para múltiplos de 1000
    });

    // Verificar se já existe uma requisição em andamento
    if (this.ongoingRequests.has(cacheKey)) {
      return this.ongoingRequests.get(cacheKey)!;
    }

    const request$ = this.cacheService.getOrSet(
      cacheKey,
      () => this.performPetshopsSearch(latitude, longitude, radius),
      this.CACHE_CONFIG.PLACES_SEARCH
    ).pipe(
      shareReplay(1)
    );

    this.ongoingRequests.set(cacheKey, request$);
    
    // Remover da lista de requisições em andamento após completar
    setTimeout(() => {
      this.ongoingRequests.delete(cacheKey);
    }, 5000);

    return request$;
  }

  private performPetshopsSearch(latitude: number, longitude: number, radius: number): Observable<PlaceResult[]> {
    return from(this.loadGoogleMaps()).pipe(
      switchMap(() => {
        const map = new google.maps.Map(document.createElement('div'));
        const service = new google.maps.places.PlacesService(map);
        
        // Aumentamos o raio em 20% para garantir que encontremos lugares suficientes
        // antes de aplicar o filtro de distância preciso
        const searchRadius = Math.min(radius * 1.2, 50000); // Máximo de 50km
        
        const request: google.maps.places.PlaceSearchRequest = {
          location: new google.maps.LatLng(latitude, longitude),
          radius: searchRadius,
          type: 'pet_store',
          keyword: 'petshop pet shop',
          rankBy: google.maps.places.RankBy.PROMINENCE
        };

        // Função otimizada para obter apenas os resultados necessários
        const getAllResults = (accumulator: google.maps.places.PlaceResult[] = [], maxResults: number = 30): Promise<google.maps.places.PlaceResult[]> => {
          return new Promise((resolve, reject) => {
            service.nearbySearch(request, (results, status, pagination) => {
              if (status === google.maps.places.PlacesServiceStatus.OK && results) {
                const newAccumulator = [...accumulator, ...results];
                
                // Limitar resultados para reduzir chamadas de detalhes
                if (pagination && pagination.hasNextPage && newAccumulator.length < maxResults) {
                  // Aguarda um tempo antes de fazer a próxima chamada (exigência da API)
                  setTimeout(() => {
                    pagination.nextPage();
                    getAllResults(newAccumulator, maxResults)
                      .then(resolve)
                      .catch(reject);
                  }, 2000);
                } else {
                  resolve(newAccumulator.slice(0, maxResults)); // Limitar ao máximo
                }
              } else if (accumulator.length > 0) {
                // Se já temos resultados, retorna mesmo com erro
                resolve(accumulator);
              } else {
                reject(new Error('Erro ao buscar petshops: ' + status));
              }
            });
          });
        };

        return from(getAllResults());
      }),
      switchMap(places => {
        // Buscar detalhes apenas para os primeiros resultados mais relevantes
        const limitedPlaces = places.slice(0, 20); // Reduzir de 60 para 20
        
        // Buscar detalhes com cache
        const detailRequests = limitedPlaces.map(place => 
          this.getPlaceDetailsById(place.place_id || '', latitude, longitude)
        );
        return forkJoin(detailRequests);
      }),
      catchError(error => {
        console.error('Erro ao buscar detalhes dos petshops:', error);
        return of([]);
      })
    );
  }

  /**
   * Busca lugares próximos usando keywords e tipos específicos
   * Método especializado para encontrar estabelecimentos que podem não aparecer nas buscas normais
   */
  searchByKeyword(latitude: number, longitude: number, radius: number, keywords: string[]): Observable<PlaceResult[]> {
    return from(this.loadGoogleMaps()).pipe(
      switchMap(() => {
        const map = new google.maps.Map(document.createElement('div'));
        const service = new google.maps.places.PlacesService(map);
        
        // Usamos um raio menor para garantir estabelecimentos realmente próximos
        const request: google.maps.places.TextSearchRequest = {
          location: new google.maps.LatLng(latitude, longitude),
          radius: radius,
          query: keywords.join(' OR '), // Usa OR para buscar qualquer um dos termos
          type: 'establishment' // Tipo genérico para permitir mais resultados
        };

        return from(new Promise<google.maps.places.PlaceResult[]>((resolve, reject) => {
          service.textSearch(request, (results, status, pagination) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && results) {
              resolve(results);
            } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
              resolve([]); // Retorna array vazio se não encontrou nada
            } else {
              reject(new Error('Erro na busca por texto: ' + status));
            }
          });
        }));
      }),
      switchMap(places => {
        // Se não encontrou nada, retorna array vazio
        if (places.length === 0) {
          return of([]);
        }
        
        // Buscar detalhes completos para cada local (incluindo horários)
        const detailRequests = places.map(place => 
          this.getPlaceDetailsById(place.place_id || '', latitude, longitude)
        );
        return forkJoin(detailRequests);
      }),
      catchError(error => {
        console.error('Erro na busca por texto:', error);
        return of([]);
      })
    );
  }

  /**
   * Busca veterinários próximos usando Google Places API com cache otimizado
   */
  searchNearbyVeterinaries(latitude: number, longitude: number, radius: number = 5000): Observable<PlaceResult[]> {
    const cacheKey = this.cacheService.generateKey('veterinaries', { 
      lat: Math.round(latitude * 1000) / 1000,
      lng: Math.round(longitude * 1000) / 1000,
      radius: Math.round(radius / 1000) * 1000
    });

    // Verificar se já existe uma requisição em andamento
    if (this.ongoingRequests.has(cacheKey)) {
      return this.ongoingRequests.get(cacheKey)!;
    }

    const request$ = this.cacheService.getOrSet(
      cacheKey,
      () => this.performVeterinariesSearch(latitude, longitude, radius),
      this.CACHE_CONFIG.PLACES_SEARCH
    ).pipe(
      shareReplay(1)
    );

    this.ongoingRequests.set(cacheKey, request$);
    
    setTimeout(() => {
      this.ongoingRequests.delete(cacheKey);
    }, 5000);

    return request$;
  }

  private performVeterinariesSearch(latitude: number, longitude: number, radius: number): Observable<PlaceResult[]> {
    return from(this.loadGoogleMaps()).pipe(
      switchMap(() => {
        const map = new google.maps.Map(document.createElement('div'));
        const service = new google.maps.places.PlacesService(map);
        
        // Aumentamos o raio em 20% para garantir que encontremos lugares suficientes
        // antes de aplicar o filtro de distância preciso
        const searchRadius = Math.min(radius * 1.2, 50000); // Máximo de 50km
        
        const request: google.maps.places.PlaceSearchRequest = {
          location: new google.maps.LatLng(latitude, longitude),
          radius: searchRadius,
          type: 'veterinary_care',
          keyword: 'veterinario clinica veterinaria',
          rankBy: google.maps.places.RankBy.PROMINENCE
        };

        // Função otimizada para obter apenas os resultados necessários
        const getAllResults = (accumulator: google.maps.places.PlaceResult[] = [], maxResults: number = 30): Promise<google.maps.places.PlaceResult[]> => {
          return new Promise((resolve, reject) => {
            service.nearbySearch(request, (results, status, pagination) => {
              if (status === google.maps.places.PlacesServiceStatus.OK && results) {
                const newAccumulator = [...accumulator, ...results];
                
                // Limitar resultados para reduzir chamadas de detalhes
                if (pagination && pagination.hasNextPage && newAccumulator.length < maxResults) {
                  // Aguarda um tempo antes de fazer a próxima chamada (exigência da API)
                  setTimeout(() => {
                    pagination.nextPage();
                    getAllResults(newAccumulator, maxResults)
                      .then(resolve)
                      .catch(reject);
                  }, 2000);
                } else {
                  resolve(newAccumulator.slice(0, maxResults));
                }
              } else if (accumulator.length > 0) {
                // Se já temos resultados, retorna mesmo com erro
                resolve(accumulator);
              } else {
                reject(new Error('Erro ao buscar veterinários: ' + status));
              }
            });
          });
        };

        return from(getAllResults());
      }),
      switchMap(places => {
        // Buscar detalhes apenas para os primeiros resultados mais relevantes
        const limitedPlaces = places.slice(0, 20); // Reduzir de 60 para 20
        
        const detailRequests = limitedPlaces.map(place => 
          this.getPlaceDetailsById(place.place_id || '', latitude, longitude)
        );
        return forkJoin(detailRequests);
      }),
      catchError(error => {
        console.error('Erro ao buscar detalhes dos veterinários:', error);
        return of([]);
      })
    );
  }

  /**
   * Busca detalhes de um local específico com coordenadas de origem - versão otimizada com cache
   */
  getPlaceDetailsById(placeId: string, originLat: number, originLng: number): Observable<PlaceResult> {
    const cacheKey = this.cacheService.generateKey('place_details', { 
      placeId,
      originLat: Math.round(originLat * 1000) / 1000,
      originLng: Math.round(originLng * 1000) / 1000
    });

    return this.cacheService.getOrSet(
      cacheKey,
      () => this.performPlaceDetailsSearch(placeId, originLat, originLng),
      this.CACHE_CONFIG.PLACE_DETAILS
    );
  }

  private performPlaceDetailsSearch(placeId: string, originLat: number, originLng: number): Observable<PlaceResult> {
    return from(this.loadGoogleMaps()).pipe(
      switchMap(() => {
        const map = new google.maps.Map(document.createElement('div'));
        const service = new google.maps.places.PlacesService(map);
        
        const request: google.maps.places.PlaceDetailsRequest = {
          placeId: placeId,
          fields: [
            'place_id', 'name', 'formatted_address', 'geometry',
            'rating', 'user_ratings_total', 'business_status',
            'opening_hours', 'formatted_phone_number', 'types' // Reduzir campos para economizar
          ]
        };

        return from(new Promise<google.maps.places.PlaceResult>((resolve, reject) => {
          service.getDetails(request, (place, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && place) {
              resolve(place);
            } else {
              reject(new Error('Erro ao buscar detalhes: ' + status));
            }
          });
        }));
      }),
      map(place => this.mapPlaceToResult(place, originLat, originLng)),
      catchError(error => {
        console.error('Erro ao buscar detalhes do local:', error);
        // Retorna um resultado vazio em caso de erro
        return of({
          placeId: placeId,
          name: 'Local não encontrado',
          address: '',
          location: { lat: 0, lng: 0 },
          rating: 0,
          userRatingsTotal: 0,
          businessStatus: 'CLOSED_PERMANENTLY',
          openingHours: undefined,
          phoneNumber: '',
          website: '',
          photos: [],
          types: [],
          priceLevel: 0
        } as PlaceResult);
      })
    );
  }

  /**
   * Calcula a distância entre dois pontos usando Google Maps com cache
   */
  calculateDistance(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
  ): Observable<{ distance: string; duration: string; distanceValue: number }> {
    const cacheKey = this.cacheService.generateKey('distance', {
      originLat: Math.round(origin.lat * 1000) / 1000,
      originLng: Math.round(origin.lng * 1000) / 1000,
      destLat: Math.round(destination.lat * 1000) / 1000,
      destLng: Math.round(destination.lng * 1000) / 1000
    });

    return this.cacheService.getOrSet(
      cacheKey,
      () => this.performDistanceCalculation(origin, destination),
      this.CACHE_CONFIG.DISTANCE
    );
  }

  private performDistanceCalculation(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
  ): Observable<{ distance: string; duration: string; distanceValue: number }> {
    return from(this.loadGoogleMaps()).pipe(
      switchMap(() => {
        const service = new google.maps.DistanceMatrixService();
        
        return from(new Promise<google.maps.DistanceMatrixResponse>((resolve, reject) => {
          service.getDistanceMatrix({
            origins: [new google.maps.LatLng(origin.lat, origin.lng)],
            destinations: [new google.maps.LatLng(destination.lat, destination.lng)],
            travelMode: google.maps.TravelMode.DRIVING,
            unitSystem: google.maps.UnitSystem.METRIC,
            avoidHighways: false,
            avoidTolls: false
          }, (response, status) => {
            if (status === google.maps.DistanceMatrixStatus.OK && response) {
              resolve(response);
            } else {
              reject(new Error('Erro ao calcular distância: ' + status));
            }
          });
        }));
      }),
      map(response => {
        const element = response.rows[0].elements[0];
        if (element.status === 'OK') {
          return {
            distance: element.distance.text,
            duration: element.duration.text,
            distanceValue: element.distance.value / 1000 // em km
          };
        }
        throw new Error('Não foi possível calcular a distância');
      })
    );
  }

  /**
   * Gera URL para direções no Google Maps
   */
  getDirectionsUrl(destination: { lat: number; lng: number }, destinationName?: string): string {
    const destParam = destinationName 
      ? encodeURIComponent(destinationName)
      : `${destination.lat},${destination.lng}`;
    
    return `https://www.google.com/maps/dir/?api=1&destination=${destParam}`;
  }

  private formatZipCode(zipCode: string): string {
    const cleanZipCode = zipCode.replace(/\D/g, '');
    if (cleanZipCode.length === 8) {
      return `${cleanZipCode.substring(0, 5)}-${cleanZipCode.substring(5)}`;
    }
    return zipCode;
  }

  private getAddressComponent(components: google.maps.GeocoderAddressComponent[], type: string): string {
    const component = components.find(c => c.types.includes(type));
    return component ? component.long_name : '';
  }

  private mapPlaceToResult(place: google.maps.places.PlaceResult, userLat: number, userLng: number): PlaceResult {
    const location = place.geometry?.location;
    const latValue: number = typeof location?.lat === 'function' ? location.lat() : Number(location?.lat ?? 0);
    const lngValue: number = typeof location?.lng === 'function' ? location.lng() : Number(location?.lng ?? 0);

    return {
      placeId: place.place_id || '',
      name: place.name || '',
      address: place.formatted_address || place.vicinity || '',
      location: { lat: latValue, lng: lngValue },
      rating: place.rating,
      userRatingsTotal: place.user_ratings_total,
      businessStatus: place.business_status,
      openingHours: place.opening_hours ? {
        openNow: place.opening_hours.open_now || false,
        weekdayText: place.opening_hours.weekday_text || []
      } : undefined,
      phoneNumber: place.formatted_phone_number,
      website: place.website,
      photos: place.photos?.map(photo => 
        photo.getUrl({ maxWidth: 400, maxHeight: 300 })
      ) || [],
      types: place.types || [],
      priceLevel: place.price_level
    };
  }

  /**
   * Busca detalhes completos de um lugar específico (sobrescreve o método anterior)
   */
  getPlaceDetails(placeId: string): Observable<any> {
    return from(this.loadGoogleMaps()).pipe(
      switchMap(() => {
        const service = new google.maps.places.PlacesService(
          document.createElement('div')
        );

        const request = {
          placeId: placeId,
          fields: [
            'place_id', 'name', 'formatted_address', 'geometry',
            'rating', 'user_ratings_total', 'business_status',
            'opening_hours', 'formatted_phone_number', 'website',
            'photos', 'types', 'price_level', 'reviews',
            'vicinity', 'url', 'editorial_summary'
          ]
        };

        return new Promise((resolve, reject) => {
          service.getDetails(request, (place, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && place) {
              const details = {
                description: (place as any).editorial_summary?.overview || '',
                priceLevel: place.price_level,
                accessibility: this.extractAccessibilityFeatures(place),
                paymentMethods: this.extractPaymentMethods(place),
                googleMapsUrl: (place as any).url,
                photos: place.photos?.map(photo => 
                  photo.getUrl({ maxWidth: 800, maxHeight: 600 })
                ) || []
              };
              resolve(details);
            } else {
              reject(new Error(`Places service failed: ${status}`));
            }
          });
        });
      }),
      catchError(error => {
        console.error('Erro ao buscar detalhes do local:', error);
        return of(null);
      })
    );
  }

  /**
   * Busca avaliações de um lugar
   */
  getPlaceReviews(placeId: string): Observable<any[]> {
    return from(this.loadGoogleMaps()).pipe(
      switchMap(() => {
        const service = new google.maps.places.PlacesService(
          document.createElement('div')
        );

        const request = {
          placeId: placeId,
          fields: ['reviews']
        };

        return new Promise<any[]>((resolve, reject) => {
          service.getDetails(request, (place, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && place?.reviews) {
              const reviews = place.reviews.map((review: any) => ({
                authorName: review.author_name,
                rating: review.rating,
                text: review.text,
                time: review.time,
                relativeTime: review.relative_time_description,
                profilePhotoUrl: review.profile_photo_url
              }));
              resolve(reviews);
            } else {
              resolve([]);
            }
          });
        });
      }),
      catchError(error => {
        console.error('Erro ao buscar avaliações:', error);
        return of([]);
      })
    );
  }

  /**
   * Extrai recursos de acessibilidade de um lugar
   */
  private extractAccessibilityFeatures(place: any): string[] {
    const features: string[] = [];
    
    // Verificar se tem informações de acessibilidade
    if (place.wheelchair_accessible_entrance) {
      features.push('wheelchair_accessible');
    }
    
    // Adicionar outras verificações baseadas nos tipos do lugar
    const types = place.types || [];
    if (types.includes('parking')) {
      features.push('parking');
    }
    
    return features;
  }

  /**
   * Extrai métodos de pagamento de um lugar
   */
  private extractPaymentMethods(place: any): string[] {
    const methods: string[] = ['cash']; // Assume que aceita dinheiro por padrão
    
    // Verificar informações de pagamento (limitado na API gratuita)
    const types = place.types || [];
    
    // A maioria dos estabelecimentos aceita cartão
    if (!types.includes('atm')) {
      methods.push('credit_card', 'debit_card');
    }
    
    // PIX é comum no Brasil
    methods.push('pix');
    
    return methods;
  }

  /**
   * Limpa o cache de pesquisas antigas
   */
  clearSearchCache(): void {
    this.cacheService.clear();
    this.ongoingRequests.clear();
  }

  /**
   * Obtém estatísticas do cache
   */
  getCacheStats() {
    return this.cacheService.getStats();
  }

  /**
   * Método otimizado para pesquisas por keyword com cache
   */
  searchByKeywordOptimized(latitude: number, longitude: number, radius: number, keywords: string[]): Observable<PlaceResult[]> {
    const cacheKey = this.cacheService.generateKey('keyword_search', {
      lat: Math.round(latitude * 1000) / 1000,
      lng: Math.round(longitude * 1000) / 1000,
      radius: Math.round(radius / 1000) * 1000,
      keywords: keywords.sort().join('_')
    });

    return this.cacheService.getOrSet(
      cacheKey,
      () => this.searchByKeyword(latitude, longitude, radius, keywords),
      { ttl: 120, maxSize: 50 } // Cache por 2 horas
    );
  }

  /**
   * Versão simplificada para obter apenas informações básicas (economiza API calls)
   */
  getBasicPlaceInfo(placeId: string): Observable<{ name: string; address: string; rating?: number }> {
    const cacheKey = this.cacheService.generateKey('basic_place', { placeId });

    return this.cacheService.getOrSet(
      cacheKey,
      () => this.performBasicPlaceSearch(placeId),
      { ttl: 480, maxSize: 100 } // Cache por 8 horas
    );
  }

  private performBasicPlaceSearch(placeId: string): Observable<{ name: string; address: string; rating?: number }> {
    return from(this.loadGoogleMaps()).pipe(
      switchMap(() => {
        const map = new google.maps.Map(document.createElement('div'));
        const service = new google.maps.places.PlacesService(map);
        
        const request: google.maps.places.PlaceDetailsRequest = {
          placeId: placeId,
          fields: ['name', 'formatted_address', 'rating'] // Apenas campos essenciais
        };

        return from(new Promise<google.maps.places.PlaceResult>((resolve, reject) => {
          service.getDetails(request, (place, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && place) {
              resolve(place);
            } else {
              reject(new Error('Erro ao buscar informações básicas: ' + status));
            }
          });
        }));
      }),
      map(place => ({
        name: place.name || '',
        address: place.formatted_address || '',
        rating: place.rating
      })),
      catchError(error => {
        console.error('Erro ao buscar informações básicas:', error);
        return of({ name: 'Local não encontrado', address: '', rating: undefined });
      })
    );
  }
}

// Estender a interface Window para incluir google
declare global {
  interface Window {
    google: any;
  }
}
