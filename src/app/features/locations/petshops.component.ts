import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { finalize } from 'rxjs/operators';

import { LocationSearchComponent } from '../../shared/components/location-search.component';
import { LocationCardComponent } from '../../shared/components/location-card.component';
import { LocationsMapComponent } from '../../shared/components/locations-map.component';
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
    MatSnackBarModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatDialogModule,
    LocationSearchComponent,
    LocationCardComponent,
    LocationsMapComponent
  ],
  template: `
    <div class="petshops-container">
      <div class="header">
        <mat-toolbar color="primary" class="page-toolbar">
          <mat-icon>store</mat-icon>
          <span>Petshops Próximos</span>
          <span class="spacer"></span>
          <span *ngIf="searchResults().total > 0" class="results-count">
            {{ searchResults().total }} petshops encontrados
          </span>
        </mat-toolbar>
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

          <div class="no-results" *ngIf="!isLoading() && hasSearched() && searchResults().locations.length === 0">
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

          <div class="results-grid" *ngIf="!isLoading() && searchResults().locations.length > 0">
            <!-- Mapa das localizações -->
            <div class="map-section">
              <app-locations-map
                [locations]="searchResults().locations"
                [userLocation]="userLocation"
                height="400px">
              </app-locations-map>
            </div>

            <!-- Lista de petshops -->
            <div class="locations-list">
              <app-location-card
                *ngFor="let petshop of searchResults().locations; trackBy: trackByLocationId"
                [location]="petshop"
                (callLocation)="onCallPetshop($event)"
                (getDirections)="onGetDirections($event)"
                (viewDetails)="onViewDetails($event)">
              </app-location-card>
            </div>
          </div>
        </div>

        <div class="welcome-section" *ngIf="!hasSearched() && !isLoading()">
          <div class="welcome-content">
            <mat-icon class="welcome-icon">store</mat-icon>
            <h2>Encontre petshops próximos a você</h2>
            <p>Digite seu CEP acima para descobrir os melhores petshops da sua região.</p>
            <ul class="features-list">
              <li>
                <mat-icon>spa</mat-icon>
                <span>Banho e tosa profissional</span>
              </li>
              <li>
                <mat-icon>pets</mat-icon>
                <span>Creche e hotel para pets</span>
              </li>
              <li>
                <mat-icon>shopping_cart</mat-icon>
                <span>Ração e produtos especializados</span>
              </li>
              <li>
                <mat-icon>medical_services</mat-icon>
                <span>Vacinação e cuidados básicos</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .petshops-container {
      min-height: 100vh;
      background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
    }

    .header {
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: var(--shadow-soft);
    }

    .page-toolbar {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      color: var(--text-primary);
      border-bottom: 1px solid var(--border-light);
    }

    .spacer {
      flex: 1;
    }

    .results-count {
      font-size: 0.9rem;
      opacity: 0.8;
      color: var(--text-secondary);
    }

    .content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }

    .search-section {
      margin-bottom: 2rem;
    }

    .results-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      padding: 1.5rem;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      border-radius: 16px;
      box-shadow: var(--shadow-card);
      border: 1px solid var(--border-light);
    }

    .results-header h2 {
      margin: 0;
      color: var(--text-primary);
      font-weight: 600;
    }

    .search-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--text-secondary);
      font-size: 0.9rem;
    }

    .search-info mat-icon {
      font-size: 18px;
      height: 18px;
      width: 18px;
      color: var(--primary-color);
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 3rem;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      border-radius: 16px;
      box-shadow: var(--shadow-card);
      border: 1px solid var(--border-light);
    }

    .loading-container p {
      margin-top: 1rem;
      color: var(--text-secondary);
    }

    .no-results {
      display: flex;
      justify-content: center;
      padding: 3rem;
    }

    .no-results-content {
      text-align: center;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      padding: 3rem;
      border-radius: 16px;
      box-shadow: var(--shadow-card);
      border: 1px solid var(--border-light);
      max-width: 400px;
    }

    .no-results-icon {
      font-size: 64px;
      height: 64px;
      width: 64px;
      color: var(--text-muted);
      margin-bottom: 1rem;
    }

    .no-results-content h3 {
      margin: 0 0 1rem 0;
      color: var(--text-primary);
    }

    .no-results-content p {
      color: var(--text-secondary);
      margin-bottom: 1rem;
      line-height: 1.5;
    }

    .results-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
      align-items: start;
    }

    .map-section {
      position: sticky;
      top: 1rem;
    }

    .locations-list {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .welcome-section {
      display: flex;
      justify-content: center;
      padding: 3rem;
    }

    .welcome-content {
      text-align: center;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      padding: 3rem;
      border-radius: 16px;
      box-shadow: var(--shadow-card);
      border: 1px solid var(--border-light);
      max-width: 600px;
    }

    .welcome-icon {
      font-size: 80px;
      height: 80px;
      width: 80px;
      color: var(--primary-color);
      margin-bottom: 1.5rem;
    }

    .welcome-content h2 {
      margin: 0 0 1rem 0;
      color: var(--text-primary);
      font-weight: 600;
    }

    .welcome-content p {
      color: var(--text-secondary);
      margin-bottom: 2rem;
      line-height: 1.6;
    }

    .features-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: grid;
      gap: 1rem;
      text-align: left;
    }

    .features-list li {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: var(--bg-surface);
      border-radius: 12px;
      border: 1px solid var(--border-light);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .features-list li:hover {
      background: var(--bg-hover);
      transform: translateY(-2px);
      box-shadow: var(--shadow-hover);
    }

    .features-list mat-icon {
      color: var(--primary-color);
      flex-shrink: 0;
    }

    .features-list span {
      color: var(--text-primary);
      font-weight: 500;
    }

    @media (max-width: 768px) {
      .content {
        padding: 1rem;
      }

      .results-header {
        flex-direction: column;
        gap: 1rem;
        text-align: center;
        padding: 1.25rem;
      }

      .results-grid {
        grid-template-columns: 1fr;
        gap: 1.5rem;
      }

      .map-section {
        position: static;
        order: -1; /* Mapa aparece primeiro no mobile */
      }

      .welcome-content,
      .no-results-content {
        padding: 2rem 1rem;
      }

      .welcome-icon,
      .no-results-icon {
        font-size: 60px;
        height: 60px;
        width: 60px;
      }

      .features-list {
        gap: 0.5rem;
      }

      .features-list li {
        padding: 0.75rem;
      }
    }
  `]
})
export class PetshopsComponent implements OnInit {
  isLoading = signal(false);
  hasSearched = signal(false);
  userLocation?: { lat: number; lng: number };
  searchResults = signal<LocationSearchResponse>({
    locations: [],
    total: 0,
    searchParams: {} as LocationSearchParams
  });

  constructor(
    private locationService: LocationService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    // Pode carregar petshops populares ou próximos se houver localização
  }

  onSearch(params: LocationSearchParams) {
    this.isLoading.set(true);
    this.hasSearched.set(true);
    
    this.locationService.searchPetshops(params)
      .pipe(
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (response) => {
          this.searchResults.set(response);
          if (response.locations.length === 0) {
            this.snackBar.open('Nenhum petshop encontrado na região especificada', 'Fechar', {
              duration: 5000
            });
          }
        },
        error: (error) => {
          
          this.snackBar.open('Erro ao buscar petshops. Tente novamente.', 'Fechar', {
            duration: 5000
          });
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

  onCallPetshop(location: Location) {
    if (location.phone) {
      window.open(`tel:${location.phone}`, '_self');
    }
  }

  onGetDirections(location: Location) {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${location.latitude},${location.longitude}&destination_place_id=${location.name}`;
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
      autoFocus: false,
      restoreFocus: false
    });

    dialogRef.afterClosed().subscribe(result => {
      // Pode realizar ações após fechar o modal se necessário
  
    });
  }

  trackByLocationId(index: number, location: Petshop | Veterinary): string {
    return location.id;
  }
}
