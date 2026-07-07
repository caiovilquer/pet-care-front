import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  LocationSearchParams,
  LocationSearchResponse,
  Petshop,
  Veterinary,
  Location,
  PlaceDetailsInfo,
  PlaceReviewInfo
} from '../models/location.model';

interface BackendLocationSearchResult {
  locations: (Petshop | Veterinary)[];
  total: number;
}

interface BackendPlaceDetails extends Omit<PlaceDetailsInfo, 'photos'> {
  photoReferences: string[];
}

/**
 * Cliente HTTP fino do backend — toda a lógica de geocoding, busca no Google
 * Places, distância, dedup, ordenação e categorização foi migrada para
 * `pet-care-schedule` (ver LocationAppService). O ganho principal da
 * migração é o cache compartilhado ENTRE usuários no backend: a primeira
 * busca de um CEP paga o custo do Google, todas as seguintes (de qualquer
 * usuário) reaproveitam — algo impossível com cache só no navegador.
 */
@Injectable({
  providedIn: 'root'
})
export class LocationService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/locations`;

  searchPetshops(params: LocationSearchParams): Observable<LocationSearchResponse> {
    return this.search('petshops', params);
  }

  searchVeterinaries(params: LocationSearchParams): Observable<LocationSearchResponse> {
    return this.search('veterinaries', params);
  }

  private search(path: 'petshops' | 'veterinaries', params: LocationSearchParams): Observable<LocationSearchResponse> {
    const httpParams = new HttpParams()
      .set('zipCode', params.zipCode)
      .set('radius', params.radius.toString())
      .set('isOpenNow', String(params.isOpenNow ?? false))
      .set('sortBy', params.sortBy || 'distance');

    return this.http.get<BackendLocationSearchResult>(`${this.apiUrl}/${path}`, { params: httpParams }).pipe(
      map(result => ({
        locations: result.locations.map(location => this.withPhotoUrls(location)),
        total: result.total,
        searchParams: params
      }))
    );
  }

  /**
   * O backend devolve `photos` como referências do Google (photo_reference),
   * não URLs prontas — evita pagar a Photos API em toda busca, só quando a
   * foto é de fato exibida (via proxy do backend, que esconde a chave).
   */
  private withPhotoUrls<T extends Petshop | Veterinary>(location: T): T {
    return {
      ...location,
      photos: (location.photos || []).map(ref => this.buildPhotoUrl(ref))
    };
  }

  buildPhotoUrl(photoReference: string, maxWidth = 400): string {
    return `${this.apiUrl}/photo?ref=${encodeURIComponent(photoReference)}&maxWidth=${maxWidth}`;
  }

  /**
   * Detalhes completos (telefone, site, grade semanal de horários, até 5
   * fotos) — chamado sob demanda quando o usuário abre a tela de detalhe,
   * nunca durante a busca (evitaria pagar 1 Place Details por resultado).
   */
  getPlaceDetails(placeId: string): Observable<PlaceDetailsInfo> {
    return this.http.get<BackendPlaceDetails>(`${this.apiUrl}/${placeId}/details`).pipe(
      map(details => ({
        ...details,
        photos: (details.photoReferences || []).map(ref => this.buildPhotoUrl(ref, 800))
      }))
    );
  }

  getPlaceReviews(placeId: string): Observable<PlaceReviewInfo[]> {
    return this.http.get<PlaceReviewInfo[]>(`${this.apiUrl}/${placeId}/reviews`);
  }

  formatZipCode(zipCode: string): string {
    const cleanZipCode = zipCode.replace(/\D/g, '');
    if (cleanZipCode.length === 8) {
      return `${cleanZipCode.substring(0, 5)}-${cleanZipCode.substring(5)}`;
    }
    return zipCode;
  }

  /**
   * A busca/listagem só traz "aberto agora" (booleano em tempo real); a
   * grade semanal completa (`openingHours`) só é preenchida de fato depois
   * que a tela de detalhe busca os horários sob demanda. Até lá, todo
   * `openingHours` vem como um placeholder "fechado o dia inteiro" — usar
   * esse método antes de exibir textos como "Fechado hoje"/horário
   * específico, para não contradizer o status real (`isOpen`).
   */
  hasKnownOpeningHours(location: Location): boolean {
    return Object.values(location.openingHours).some(
      day => day.isOpen || day.openTime || day.closeTime
    );
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
