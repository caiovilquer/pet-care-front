import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, of, forkJoin } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

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

  constructor(private http: HttpClient) {}

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
   * Converte CEP em coordenadas usando Google Geocoding API
   */
  geocodeZipCode(zipCode: string): Observable<GeocodeResult> {
    const formattedZipCode = this.formatZipCode(zipCode);
    
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
   * Busca petshops próximos usando Google Places API
   */
  searchNearbyPetshops(latitude: number, longitude: number, radius: number = 5000): Observable<PlaceResult[]> {
    return from(this.loadGoogleMaps()).pipe(
      switchMap(() => {
        const map = new google.maps.Map(document.createElement('div'));
        const service = new google.maps.places.PlacesService(map);
        
        const request: google.maps.places.PlaceSearchRequest = {
          location: new google.maps.LatLng(latitude, longitude),
          radius: radius,
          type: 'pet_store',
          keyword: 'petshop pet shop animais'
        };

        return from(new Promise<google.maps.places.PlaceResult[]>((resolve, reject) => {
          service.nearbySearch(request, (results, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && results) {
              resolve(results);
            } else {
              reject(new Error('Erro ao buscar petshops: ' + status));
            }
          });
        }));
      }),
      switchMap(places => {
        // Buscar detalhes completos para cada local (incluindo horários)
        const detailRequests = places.map(place => 
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
   * Busca veterinários próximos usando Google Places API
   */
  searchNearbyVeterinaries(latitude: number, longitude: number, radius: number = 5000): Observable<PlaceResult[]> {
    return from(this.loadGoogleMaps()).pipe(
      switchMap(() => {
        const map = new google.maps.Map(document.createElement('div'));
        const service = new google.maps.places.PlacesService(map);
        
        const request: google.maps.places.PlaceSearchRequest = {
          location: new google.maps.LatLng(latitude, longitude),
          radius: radius,
          type: 'veterinary_care',
          keyword: 'veterinario clinica veterinaria hospital veterinario'
        };

        return from(new Promise<google.maps.places.PlaceResult[]>((resolve, reject) => {
          service.nearbySearch(request, (results, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && results) {
              resolve(results);
            } else {
              reject(new Error('Erro ao buscar veterinários: ' + status));
            }
          });
        }));
      }),
      switchMap(places => {
        // Buscar detalhes completos para cada local (incluindo horários)
        const detailRequests = places.map(place => 
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
   * Busca detalhes de um local específico com coordenadas de origem
   */
  getPlaceDetailsById(placeId: string, originLat: number, originLng: number): Observable<PlaceResult> {
    return from(this.loadGoogleMaps()).pipe(
      switchMap(() => {
        const map = new google.maps.Map(document.createElement('div'));
        const service = new google.maps.places.PlacesService(map);
        
        const request: google.maps.places.PlaceDetailsRequest = {
          placeId: placeId,
          fields: [
            'place_id', 'name', 'formatted_address', 'geometry',
            'rating', 'user_ratings_total', 'business_status',
            'opening_hours', 'formatted_phone_number', 'website',
            'photos', 'types', 'price_level'
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
   * Calcula a distância entre dois pontos usando Google Maps
   */
  calculateDistance(
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
}

// Estender a interface Window para incluir google
declare global {
  interface Window {
    google: any;
  }
}
