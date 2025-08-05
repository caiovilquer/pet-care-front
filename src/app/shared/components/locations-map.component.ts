import { Component, Input, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GoogleMapsModule } from '@angular/google-maps';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { GoogleMapsService } from '../../core/services/google-maps.service';
import { Location, Petshop, Veterinary } from '../../core/models/location.model';

@Component({
  selector: 'app-locations-map',
  standalone: true,
  imports: [
    CommonModule,
    GoogleMapsModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule
  ],
  template: `
    <div class="map-container" *ngIf="isGoogleMapsLoaded">
      <div class="map-controls">
        <button 
          mat-mini-fab 
          color="primary" 
          (click)="centerMap()"
          matTooltip="Centralizar mapa">
          <mat-icon>my_location</mat-icon>
        </button>
        
        <button 
          mat-mini-fab 
          color="accent" 
          (click)="toggleTraffic()"
          matTooltip="Trânsito"
          [class.active]="showTraffic">
          <mat-icon>traffic</mat-icon>
        </button>
      </div>

      <google-map
        #map
        [height]="height"
        [width]="width"
        [center]="mapCenter"
        [zoom]="mapZoom"
        [options]="mapOptions">
        
        <!-- Marcador da localização do usuário -->
        <map-marker
          *ngIf="userLocation"
          [position]="userLocation"
          [options]="userMarkerOptions"
          (mapClick)="onUserMarkerClick()">
        </map-marker>

        <!-- Marcadores das localidades -->
        <map-marker
          *ngFor="let location of locations; trackBy: trackByLocationId"
          [position]="{lat: location.latitude, lng: location.longitude}"
          [options]="getLocationMarkerOptions(location)"
          (mapClick)="onLocationMarkerClick(location, $event)">
        </map-marker>

        <!-- Info Window -->
        <map-info-window #infoWindow>
          <div class="info-window-content" *ngIf="selectedLocation">
            <div class="info-header">
              <h4>{{ selectedLocation.name }}</h4>
              <div class="rating" *ngIf="selectedLocation.rating > 0">
                <mat-icon class="star">star</mat-icon>
                <span>{{ selectedLocation.rating.toFixed(1) }}</span>
              </div>
            </div>
            
            <p class="address">{{ selectedLocation.address }}</p>
            
            <div class="info-actions">
              <button 
                mat-button 
                color="primary" 
                (click)="openDirections(selectedLocation)">
                <mat-icon>directions</mat-icon>
                Direções
              </button>
              
              <button 
                mat-button 
                *ngIf="selectedLocation.phone"
                (click)="callLocation(selectedLocation)">
                <mat-icon>phone</mat-icon>
                Ligar
              </button>
            </div>
          </div>
        </map-info-window>
      </google-map>
    </div>

    <div class="map-loading" *ngIf="!isGoogleMapsLoaded">
      <mat-icon>map</mat-icon>
      <p>Carregando mapa...</p>
    </div>
  `,
  styles: [`
    .map-container {
      position: relative;
      width: 100%;
      height: 100%;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .map-controls {
      position: absolute;
      top: 1rem;
      right: 1rem;
      z-index: 1000;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .map-controls button {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      transition: all 0.3s ease;
    }

    .map-controls button:hover {
      transform: scale(1.1);
    }

    .map-controls button.active {
      background-color: #ff9800;
      color: white;
    }

    .map-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 300px;
      background: #f5f5f5;
      border-radius: 12px;
      color: #666;
    }

    .map-loading mat-icon {
      font-size: 48px;
      height: 48px;
      width: 48px;
      margin-bottom: 1rem;
      color: #2196f3;
    }

    .info-window-content {
      max-width: 250px;
      padding: 0.5rem;
    }

    .info-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.5rem;
    }

    .info-header h4 {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
      color: #333;
      flex: 1;
    }

    .rating {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      color: #ff9800;
      font-size: 0.9rem;
    }

    .rating .star {
      font-size: 16px;
      height: 16px;
      width: 16px;
    }

    .address {
      margin: 0 0 1rem 0;
      font-size: 0.9rem;
      color: #666;
      line-height: 1.4;
    }

    .info-actions {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .info-actions button {
      font-size: 0.8rem;
      padding: 0.25rem 0.75rem;
    }

    google-map {
      border-radius: 12px;
    }

    @media (max-width: 768px) {
      .map-controls {
        top: 0.5rem;
        right: 0.5rem;
      }

      .info-actions {
        flex-direction: column;
      }

      .info-actions button {
        width: 100%;
      }
    }
  `]
})
export class LocationsMapComponent implements OnInit, OnDestroy {
  @Input() locations: (Petshop | Veterinary)[] = [];
  @Input() userLocation?: { lat: number; lng: number };
  @Input() height = '400px';
  @Input() width = '100%';

  @ViewChild('map') mapElement!: ElementRef;
  @ViewChild('infoWindow') infoWindow!: any;

  isGoogleMapsLoaded = false;
  showTraffic = false;
  selectedLocation?: Location;

  mapCenter: google.maps.LatLngLiteral = { lat: -23.5505, lng: -46.6333 }; // São Paulo padrão
  mapZoom = 13;
  
  mapOptions: google.maps.MapOptions = {
    disableDefaultUI: false,
    clickableIcons: false,
    styles: [
      {
        featureType: 'poi.business',
        stylers: [{ visibility: 'off' }]
      }
    ]
  };

  userMarkerOptions: google.maps.MarkerOptions = {
    icon: {
      url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
      scaledSize: new google.maps.Size(40, 40)
    },
    title: 'Sua localização'
  };

  constructor(private googleMapsService: GoogleMapsService) {}

  async ngOnInit() {
    try {
      await this.googleMapsService.loadGoogleMaps();
      this.isGoogleMapsLoaded = true;
      this.setupMap();
    } catch (error) {
      console.error('Erro ao carregar Google Maps:', error);
    }
  }

  ngOnDestroy() {
    // Cleanup se necessário
  }

  private setupMap() {
    // Definir centro do mapa baseado nas localizações ou localização do usuário
    if (this.userLocation) {
      this.mapCenter = this.userLocation;
    } else if (this.locations.length > 0) {
      this.mapCenter = {
        lat: this.locations[0].latitude,
        lng: this.locations[0].longitude
      };
    }

    // Ajustar zoom baseado na dispersão das localizações
    if (this.locations.length > 1) {
      this.adjustMapBounds();
    }
  }

  private adjustMapBounds() {
    if (!this.isGoogleMapsLoaded || this.locations.length === 0) return;

    const bounds = new google.maps.LatLngBounds();
    
    if (this.userLocation) {
      bounds.extend(this.userLocation);
    }
    
    this.locations.forEach(location => {
      bounds.extend({ lat: location.latitude, lng: location.longitude });
    });

    // Ajustar zoom e centro para incluir todos os pontos
    this.mapCenter = bounds.getCenter().toJSON();
    
    // Calcular zoom apropriado baseado nos bounds
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    const latDiff = ne.lat() - sw.lat();
    const lngDiff = ne.lng() - sw.lng();
    const maxDiff = Math.max(latDiff, lngDiff);
    
    if (maxDiff < 0.01) this.mapZoom = 16;
    else if (maxDiff < 0.05) this.mapZoom = 14;
    else if (maxDiff < 0.1) this.mapZoom = 13;
    else if (maxDiff < 0.5) this.mapZoom = 11;
    else this.mapZoom = 10;
  }

  getLocationMarkerOptions(location: Location): google.maps.MarkerOptions {
    const isPetshop = location.type === 'petshop';
    const iconColor = isPetshop ? 'blue' : 'red';
    const iconUrl = `https://maps.google.com/mapfiles/ms/icons/${iconColor}-dot.png`;

    return {
      icon: {
        url: iconUrl,
        scaledSize: new google.maps.Size(32, 32)
      },
      title: location.name,
      // Remover animação para evitar poping
      animation: undefined
    };
  }

  centerMap() {
    if (this.userLocation) {
      this.mapCenter = this.userLocation;
      this.mapZoom = 15;
    } else {
      this.adjustMapBounds();
    }
  }

  toggleTraffic() {
    this.showTraffic = !this.showTraffic;
    // Implementar lógica para mostrar/esconder camada de trânsito
    console.log('Traffic layer:', this.showTraffic ? 'enabled' : 'disabled');
  }

  onUserMarkerClick() {
    // Abrir info window da localização do usuário
    console.log('User location clicked');
  }

  onLocationMarkerClick(location: Location, event?: any) {
    this.selectedLocation = location;
    // O info window será aberto automaticamente pelo Angular Google Maps
  }

  openDirections(location: Location) {
    const url = this.googleMapsService.getDirectionsUrl(
      { lat: location.latitude, lng: location.longitude },
      location.name
    );
    window.open(url, '_blank');
  }

  callLocation(location: Location) {
    if (location.phone) {
      window.open(`tel:${location.phone}`, '_self');
    }
  }

  trackByLocationId(index: number, location: Location): string {
    return location.id;
  }
}
