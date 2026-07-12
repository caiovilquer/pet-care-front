import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ToastService } from '../../core/services/toast.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { finalize } from 'rxjs/operators';

import { LocationSearchComponent } from '../../shared/components/location-search.component';
import { LocationCardComponent } from '../../shared/components/location-card.component';
import { NearbyToggleComponent } from '../../shared/components/ui/nearby-toggle.component';
import { LocationDetailComponent } from '../../shared/components/location-detail.component';
import { LocationService } from '../../core/services/location.service';
import { 
  LocationSearchParams, 
  LocationSearchResponse, 
  Petshop, 
  Veterinary,
  Location 
} from '../../core/models/location.model';

@Component({
  selector: 'app-petshops',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatDialogModule,
    LocationSearchComponent,
    LocationCardComponent,
    NearbyToggleComponent
  ],
  template: `
    <div class="petshops-container">
      <div class="petshops-header">
        <div class="header-titles">
          <p class="q-overline">Por perto</p>
          <h1>Petshops</h1>
        </div>
        <div class="header-actions">
          <rp-nearby-toggle active="petshops"></rp-nearby-toggle>
          <span *ngIf="searchResults().total > 0" class="results-count">
            {{ searchResults().total }} petshops encontrados
          </span>
        </div>
      </div>

      <div class="content">
        <div class="search-section">
          <app-location-search
            type="petshop"
            [isLoading]="isLoading()"
            (search)="onSearch($event)">
          </app-location-search>
        </div>

        <div class="results-section" *ngIf="searchResults().locations.length > 0 || hasSearched()">
          <div class="results-header" *ngIf="searchResults().locations.length > 0">
            <h2>Petshops encontrados</h2>
            <div class="search-info">
              <span>
                <mat-icon>location_on</mat-icon>
                CEP: {{ searchResults().searchParams.zipCode }} 
                - Raio: {{ searchResults().searchParams.radius }}km
              </span>
            </div>
          </div>

          <div class="loading-container" *ngIf="isLoading()">
            <mat-spinner></mat-spinner>
            <p>Buscando petshops próximos...</p>
          </div>

          <div class="no-results" *ngIf="!isLoading() && searchError()">
            <div class="no-results-content" role="alert">
              <mat-icon class="no-results-icon">cloud_off</mat-icon>
              <h3>Não foi possível buscar agora</h3>
              <p>{{ searchError() }}</p>
              <button mat-raised-button color="primary" (click)="retrySearch()">
                <mat-icon>refresh</mat-icon> Tentar novamente
              </button>
            </div>
          </div>

          <div class="no-results" *ngIf="!isLoading() && !searchError() && hasSearched() && searchResults().locations.length === 0">
            <div class="no-results-content">
              <mat-icon class="no-results-icon">store_off</mat-icon>
              <h3>Nenhum petshop encontrado</h3>
              <p>Não encontramos petshops na região especificada.</p>
              <p>Tente aumentar o raio de busca ou verificar o CEP informado.</p>
              <button mat-raised-button color="primary" (click)="onExpandSearch()">
                <mat-icon>search</mat-icon>
                Ampliar busca
              </button>
            </div>
          </div>

          <div class="results-list" *ngIf="!isLoading() && searchResults().locations.length > 0">            
            <!-- Lista de petshops -->
            <app-location-card
              *ngFor="let petshop of searchResults().locations; trackBy: trackByLocationId"
              [location]="petshop"
              (callLocation)="onCallPetshop($event)"
              (getDirections)="onGetDirections($event)"
              (viewDetails)="onViewDetails($event)">
            </app-location-card>
          </div>
        </div>

        <div class="welcome-section" *ngIf="!hasSearched() && !isLoading()">
          <div class="welcome-content">
            <mat-icon class="welcome-icon">store</mat-icon>
            <h2>Encontre petshops próximos a você</h2>
            <p>Digite seu CEP para consultar estabelecimentos próximos, com distância e avaliação pública.</p>
            <p class="data-notice">Confirme horários e serviços diretamente com o estabelecimento antes de se deslocar.</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .petshops-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: var(--q-space-4);
      flex-wrap: wrap;
      margin-bottom: var(--q-space-5);
    }

    .header-titles .q-overline { margin-bottom: var(--q-space-2); }
    .petshops-header h1 { margin: 0; }

    .header-actions {
      display: flex;
      align-items: center;
      gap: var(--q-space-3);
      flex-wrap: wrap;
    }

    .results-count {
      font-size: 0.8438rem;
      color: var(--q-text-2);
      font-weight: 500;
    }

    .content { display: grid; gap: var(--q-space-5); }

    .results-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: var(--q-space-3);
      flex-wrap: wrap;
    }

    .results-header h2 { margin: 0; font-size: 1.2rem; }

    .search-info {
      display: flex;
      align-items: center;
      gap: 6px;
      color: var(--q-text-2);
      font-size: 0.8438rem;
    }

    .search-info mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: var(--q-green-600);
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--q-space-3);
      padding: var(--q-space-7);
      background: var(--q-surface);
      border: 1px solid var(--q-border);
      border-radius: var(--q-radius-lg);
      box-shadow: var(--q-shadow-sm);
      color: var(--q-text-2);
    }

    .no-results,
    .welcome-section {
      background: var(--q-surface);
      border: 1px solid var(--q-border);
      border-radius: var(--q-radius-lg);
      box-shadow: var(--q-shadow-sm);
      padding: var(--q-space-7) var(--q-space-5);
    }

    .no-results-content,
    .welcome-content {
      max-width: 480px;
      margin: 0 auto;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--q-space-2);
    }

    .no-results-icon,
    .welcome-icon {
      width: 88px;
      height: 88px;
      font-size: 36px;
      display: grid;
      place-items: center;
      background: var(--q-green-50);
      color: var(--q-green-600);
      border-radius: var(--q-organic-1);
      margin-bottom: var(--q-space-2);
    }

    .no-results-content h3,
    .welcome-content h2 { margin: 0; }

    .no-results-content p,
    .welcome-content p {
      margin: 0;
      color: var(--q-text-2);
      font-size: 0.9063rem;
    }

    .no-results-content button { margin-top: var(--q-space-3); }

    .features-list {
      list-style: none;
      padding: 0;
      margin: var(--q-space-4) 0 0;
      display: grid;
      gap: var(--q-space-2);
      text-align: left;
    }

    .features-list li {
      display: flex;
      align-items: center;
      gap: var(--q-space-3);
      color: var(--q-text-2);
      font-size: 0.9063rem;
    }

    .features-list li mat-icon {
      color: var(--q-green-600);
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .results-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: var(--q-space-4);
      align-items: stretch;
    }
  `]
})
export class PetshopsComponent implements OnInit {
  isLoading = signal(false);
  hasSearched = signal(false);
  searchError = signal<string | null>(null);
  userLocation?: { lat: number; lng: number };
  searchResults = signal<LocationSearchResponse>({
    locations: [],
    total: 0,
    searchParams: {} as LocationSearchParams
  });

  constructor(
    private locationService: LocationService,
    private toast: ToastService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    // Pode carregar petshops populares ou próximos se houver localização
  }

  onSearch(params: LocationSearchParams) {
    this.isLoading.set(true);
    this.hasSearched.set(true);
    this.searchError.set(null);
    
    this.locationService.searchPetshops(params)
      .pipe(
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (response) => {
          this.searchResults.set(response);
          if (response.locations.length === 0) {
            this.toast.info('Nenhum petshop encontrado na região especificada', 5000);
          }
        },
        error: (error) => {
          this.searchError.set('Verifique sua conexão e tente novamente em instantes.');
          this.toast.error('Erro ao buscar petshops. Tente novamente.', 5000);
        }
      });
  }

  onExpandSearch() {
    // Aumenta o raio de busca automaticamente
    const currentParams = this.searchResults().searchParams;
    const expandedParams = {
      ...currentParams,
      radius: Math.min(currentParams.radius * 2, 50)
    };
    this.onSearch(expandedParams);
  }

  retrySearch(): void {
    const params = this.searchResults().searchParams;
    if (params?.zipCode) this.onSearch(params);
  }

  onCallPetshop(location: Location) {
    if (location.phone) {
      window.open(`tel:${location.phone}`, '_self');
    }
  }

  onGetDirections(location: Location) {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${location.latitude},${location.longitude}&destination_place_id=${encodeURIComponent(location.id)}`;
    window.open(url, '_blank');
  }

  onViewDetails(location: Location) {
    const dialogRef = this.dialog.open(LocationDetailComponent, {
      data: { location },
      width: '90vw',
      maxWidth: '900px',
      height: '90vh',
      maxHeight: '800px',
      panelClass: 'location-detail-dialog',
      autoFocus: 'first-tabbable',
      restoreFocus: true
    });

    dialogRef.afterClosed().subscribe(result => {
      // Pode realizar ações após fechar o modal se necessário
  
    });
  }

  trackByLocationId(index: number, location: Petshop | Veterinary): string {
    return location.id;
  }
}
