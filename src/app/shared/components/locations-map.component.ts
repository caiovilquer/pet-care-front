import { Component, Input, OnInit, OnDestroy, ViewChild, ElementRef, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
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
    MatButtonModule,
    MatIconModule,
    MatTooltipModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
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

      <div #mapElement 
           class="google-map"
           [style.height]="height"
           [style.width]="width">
      </div>
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

    .google-map {
      border-radius: 12px;
      width: 100%;
      height: 100%;
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

  @ViewChild('mapElement') mapElement!: ElementRef;

  isGoogleMapsLoaded = false;
  showTraffic = false;
  selectedLocation?: Location;
  googleMap: any;
  mapMarkers: any[] = [];
  infoWindow: any;

  mapCenter = { lat: -23.5505, lng: -46.6333 }; // São Paulo padrão
  mapZoom = 13;

  constructor(private googleMapsService: GoogleMapsService) {}

  async ngOnInit() {
    try {
      await this.googleMapsService.loadGoogleMaps();
      this.isGoogleMapsLoaded = true;
      this.initializeMap();
    } catch (error) {
      console.error('Erro ao carregar Google Maps:', error);
    }
  }

  ngOnDestroy() {
    // Cleanup se necessário
    this.clearMarkers();
  }

  private initializeMap() {
    if (!this.isGoogleMapsLoaded || !this.mapElement) return;

    // Definir centro do mapa baseado nas localizações ou localização do usuário
    if (this.userLocation) {
      this.mapCenter = this.userLocation;
    } else if (this.locations.length > 0) {
      this.mapCenter = {
        lat: this.locations[0].latitude,
        lng: this.locations[0].longitude
      };
    }

    // Inicializar o mapa
    this.googleMap = new (window as any).google.maps.Map(this.mapElement.nativeElement, {
      center: this.mapCenter,
      zoom: this.mapZoom,
      disableDefaultUI: false,
      clickableIcons: false,
      styles: [
        {
          featureType: 'poi.business',
          stylers: [{ visibility: 'off' }]
        }
      ]
    });

    // Inicializar InfoWindow
    this.infoWindow = new (window as any).google.maps.InfoWindow();

    // Adicionar marcadores
    this.addMarkers();

    // Ajustar bounds se necessário
    if (this.locations.length > 1) {
      this.adjustMapBounds();
    }
  }

  private addMarkers() {
    this.clearMarkers();

    // Adicionar marcador do usuário se disponível
    if (this.userLocation) {
      const userMarker = new (window as any).google.maps.Marker({
        position: this.userLocation,
        map: this.googleMap,
        icon: {
          url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
          scaledSize: new (window as any).google.maps.Size(40, 40)
        },
        title: 'Sua localização'
      });
      
      this.mapMarkers.push(userMarker);
    }

    // Adicionar marcadores das localizações
    this.locations.forEach(location => {
      const isPetshop = location.type === 'petshop';
      const iconColor = isPetshop ? 'green' : 'red';
      
      const marker = new (window as any).google.maps.Marker({
        position: { lat: location.latitude, lng: location.longitude },
        map: this.googleMap,
        icon: {
          url: `https://maps.google.com/mapfiles/ms/icons/${iconColor}-dot.png`,
          scaledSize: new (window as any).google.maps.Size(32, 32)
        },
        title: location.name
      });

      // Adicionar listener de click
      marker.addListener('click', () => {
        this.onLocationMarkerClick(location, marker);
      });

      this.mapMarkers.push(marker);
    });
  }

  private clearMarkers() {
    this.mapMarkers.forEach(marker => {
      marker.setMap(null);
    });
    this.mapMarkers = [];
  }

  private adjustMapBounds() {
    if (!this.isGoogleMapsLoaded || this.locations.length === 0 || !this.googleMap) return;

    const bounds = new (window as any).google.maps.LatLngBounds();
    
    if (this.userLocation) {
      bounds.extend(this.userLocation);
    }
    
    this.locations.forEach(location => {
      bounds.extend({ lat: location.latitude, lng: location.longitude });
    });

    this.googleMap.fitBounds(bounds);
  }

  centerMap() {
    if (!this.googleMap) return;
    
    if (this.userLocation) {
      this.googleMap.setCenter(this.userLocation);
      this.googleMap.setZoom(15);
    } else {
      this.adjustMapBounds();
    }
  }

  toggleTraffic() {
    if (!this.googleMap) return;
    
    this.showTraffic = !this.showTraffic;
    
    // Implementar camada de trânsito
    if (this.showTraffic) {
      const trafficLayer = new (window as any).google.maps.TrafficLayer();
      trafficLayer.setMap(this.googleMap);
    } else {
      // Remover camada de trânsito (seria necessário manter referência)
      console.log('Traffic layer disabled');
    }
  }

  onUserMarkerClick() {
    console.log('User location clicked');
  }

  onLocationMarkerClick(location: Location, marker: any) {
    this.selectedLocation = location;
    
    // Criar conteúdo do InfoWindow
    const content = `
      <div class="info-window-content">
        <div class="info-header">
          <h4>${location.name}</h4>
          ${location.rating > 0 ? `
            <div class="rating">
              <span>★ ${location.rating.toFixed(1)}</span>
            </div>
          ` : ''}
        </div>
        <p class="address">${location.address}</p>
        <div class="info-actions">
          <button onclick="window.open('https://www.google.com/maps/dir/?api=1&destination=${location.latitude},${location.longitude}', '_blank')">
            Direções
          </button>
          ${location.phone ? `
            <button onclick="window.open('tel:${location.phone}', '_self')">
              Ligar
            </button>
          ` : ''}
        </div>
      </div>
    `;

    this.infoWindow.setContent(content);
    this.infoWindow.open(this.googleMap, marker);
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
