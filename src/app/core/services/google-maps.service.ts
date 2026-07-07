import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface GoogleMapsConfig {
  apiKey: string;
  language: string;
  region: string;
}

/**
 * Responsável apenas por carregar a biblioteca Maps JavaScript (renderização
 * do mapa em `locations-map.component`) e gerar links de direção — tudo o
 * mais (geocoding, Places, distância, cache) foi migrado para o backend
 * (`pet-care-schedule`), que tem cache compartilhado entre usuários e mantém
 * a chave de Web Services fora do navegador.
 *
 * A chave usada aqui (Maps JavaScript) é necessariamente pública no browser;
 * a proteção real dela é a restrição por HTTP referrer no Google Cloud
 * Console, não o código.
 */
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
  private googleMapsPromise: Promise<any> | null = null;

  /**
   * Carrega a API do Google Maps dinamicamente (uma única vez).
   */
  loadGoogleMaps(): Promise<any> {
    if (this.isGoogleMapsLoaded) {
      return Promise.resolve(window.google);
    }

    if (this.googleMapsPromise) {
      return this.googleMapsPromise;
    }

    this.googleMapsPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${this.config.apiKey}&libraries=places&language=${this.config.language}&region=${this.config.region}`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        this.isGoogleMapsLoaded = true;
        resolve(window.google);
      };

      script.onerror = (error) => {
        this.googleMapsPromise = null;
        reject(error);
      };

      document.head.appendChild(script);
    });

    return this.googleMapsPromise;
  }

  /**
   * Gera URL para direções no Google Maps (link externo, sem custo de API).
   */
  getDirectionsUrl(destination: { lat: number; lng: number }, destinationName?: string): string {
    const destParam = destinationName
      ? encodeURIComponent(destinationName)
      : `${destination.lat},${destination.lng}`;

    return `https://www.google.com/maps/dir/?api=1&destination=${destParam}`;
  }
}

// Estender a interface Window para incluir google
declare global {
  interface Window {
    google: any;
  }
}
