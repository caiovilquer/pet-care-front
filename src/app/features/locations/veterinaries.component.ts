import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatBadgeModule } from '@angular/material/badge';
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
  Veterinary, 
  Petshop,
  Location 
} from '../../core/models/location.model';

@Component({
  selector: 'app-veterinaries',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatBadgeModule,
    MatDialogModule,
    LocationSearchComponent,
    LocationCardComponent,
    NearbyToggleComponent
  ],
  template: `
    <div class="veterinaries-container">
      <div class="veterinaries-header">
        <div class="header-titles">
          <p class="q-overline">Por perto</p>
          <h1>Veterinários</h1>
        </div>
        <div class="header-actions">
          <rp-nearby-toggle active="veterinaries"></rp-nearby-toggle>
          <span *ngIf="searchResults().total > 0" class="results-count">
            {{ searchResults().total }} veterinários encontrados
          </span>
          <button 
            mat-raised-button
            color="accent"
            *ngIf="emergencyCount() > 0"
            matBadge="{{ emergencyCount() }}"
            matBadgeColor="warn"
            matTooltip="Emergência 24h disponível"
            (click)="filterEmergencyOnly()">
            <mat-icon>emergency</mat-icon>
            Emergência 24h
          </button>
        </div>
      </div>

      <div class="content">
        <div class="search-section">
          <app-location-search
            type="veterinary"
            [isLoading]="isLoading()"
            (search)="onSearch($event)">
          </app-location-search>
        </div>

        <div class="emergency-banner" *ngIf="emergencyCount() > 0">
          <div class="emergency-content">
            <mat-icon>emergency</mat-icon>
            <div>
              <h3>{{ emergencyCount() }} veterinários com atendimento de emergência 24h disponíveis!</h3>
              <p>Para emergências, dê preferência aos veterinários com o ícone de emergência.</p>
            </div>
            <button mat-raised-button color="warn" (click)="filterEmergencyOnly()">
              Ver apenas emergência
            </button>
          </div>
        </div>

        <div class="results-section" *ngIf="searchResults().locations.length > 0 || hasSearched()">
          <div class="results-header" *ngIf="searchResults().locations.length > 0">
            <h2>Veterinários encontrados</h2>
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
            <p>Buscando veterinários próximos...</p>
          </div>

          <div class="no-results" *ngIf="!isLoading() && hasSearched() && searchResults().locations.length === 0">
            <div class="no-results-content">
              <mat-icon class="no-results-icon">local_hospital_off</mat-icon>
              <h3>Nenhum veterinário encontrado</h3>
              <p>Não encontramos veterinários na região especificada.</p>
              <p>Tente aumentar o raio de busca ou verificar o CEP informado.</p>
              <button mat-raised-button color="primary" (click)="onExpandSearch()">
                <mat-icon>search</mat-icon>
                Ampliar busca
              </button>
            </div>
          </div>

          <div class="results-list" *ngIf="!isLoading() && searchResults().locations.length > 0">
            <app-location-card
              *ngFor="let veterinary of searchResults().locations; trackBy: trackByLocationId"
              [location]="veterinary"
              (callLocation)="onCallVeterinary($event)"
              (getDirections)="onGetDirections($event)"
              (viewDetails)="onViewDetails($event)">
            </app-location-card>
          </div>
        </div>

        <div class="welcome-section" *ngIf="!hasSearched() && !isLoading()">
          <div class="welcome-content">
            <mat-icon class="welcome-icon">local_hospital</mat-icon>
            <h2>Encontre veterinários próximos a você</h2>
            <p>Digite seu CEP acima para descobrir os melhores veterinários da sua região.</p>
            
            <div class="info-cards">
              <div class="info-card emergency">
                <mat-icon>emergency</mat-icon>
                <h4>Emergência 24h</h4>
                <p>Atendimento de urgência disponível a qualquer hora</p>
              </div>
              
              <div class="info-card surgery">
                <mat-icon>local_hospital</mat-icon>
                <h4>Cirurgias</h4>
                <p>Procedimentos cirúrgicos com equipamentos modernos</p>
              </div>
              
              <div class="info-card laboratory">
                <mat-icon>science</mat-icon>
                <h4>Laboratório</h4>
                <p>Exames e diagnósticos precisos</p>
              </div>
              
              <div class="info-card specialty">
                <mat-icon>healing</mat-icon>
                <h4>Especialidades</h4>
                <p>Cardiologia, dermatologia, ortopedia e mais</p>
              </div>
            </div>

            <div class="emergency-notice">
              <mat-icon>warning</mat-icon>
              <div>
                <strong>Em caso de emergência:</strong>
                <p>Para situações de risco de vida, procure imediatamente um veterinário com atendimento 24h ou entre em contato direto.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .veterinaries-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: var(--q-space-4);
      flex-wrap: wrap;
      margin-bottom: var(--q-space-5);
    }

    .header-titles .q-overline { margin-bottom: var(--q-space-2); }
    .veterinaries-header h1 { margin: 0; }

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

    .emergency-banner {
      background: var(--q-error-bg);
      border: 1px solid color-mix(in srgb, var(--q-error) 30%, transparent);
      border-radius: var(--q-radius-md);
      padding: var(--q-space-3) var(--q-space-4);
    }

    .emergency-content {
      display: flex;
      align-items: center;
      gap: var(--q-space-3);
    }

    .emergency-content mat-icon { color: var(--q-error); flex-shrink: 0; }
    .emergency-content h3 { margin: 0; font-size: 0.9375rem; color: var(--q-error); }
    .emergency-content p { margin: 2px 0 0; font-size: 0.8125rem; color: var(--q-text-2); }

    .info-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
      gap: var(--q-space-3);
      margin-top: var(--q-space-4);
      width: 100%;
    }

    .info-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--q-space-1);
      padding: var(--q-space-4);
      text-align: center;
      background: var(--q-surface-2);
      border: 1px solid var(--q-border);
      border-radius: var(--q-radius-md);
      font-size: 0.8125rem;
      color: var(--q-text-2);
    }

    .info-card h4 { margin: 0; font-size: 0.875rem; color: var(--q-ink); }
    .info-card p { margin: 0; }
    .info-card mat-icon { color: var(--q-green-600); }
    .info-card.emergency mat-icon { color: var(--q-error); }
    .info-card.laboratory mat-icon { color: var(--q-info); }
    .info-card.surgery mat-icon { color: var(--q-ev-breed); }
    .info-card.specialty mat-icon { color: var(--q-ipe-600); }

    .emergency-notice {
      margin-top: var(--q-space-4);
      display: flex;
      align-items: center;
      gap: var(--q-space-2);
      font-size: 0.8125rem;
      color: var(--q-warning);
      background: var(--q-warning-bg);
      border-radius: var(--q-radius-sm);
      padding: var(--q-space-2) var(--q-space-3);
    }

    .emergency-notice mat-icon { font-size: 18px; width: 18px; height: 18px; }
  `]
})
export class VeterinariesComponent implements OnInit {
  isLoading = signal(false);
  hasSearched = signal(false);
  emergencyCount = signal(0);
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
    // Pode carregar veterinários populares ou próximos se houver localização
  }

  private updateEmergencyCount() {
    const count = this.searchResults().locations.filter(location => 
      (location as Veterinary).hasEmergency
    ).length;
    this.emergencyCount.set(count);
  }

  onSearch(params: LocationSearchParams) {
    this.isLoading.set(true);
    this.hasSearched.set(true);
    
    this.locationService.searchVeterinaries(params)
      .pipe(
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (response: LocationSearchResponse) => {
          this.searchResults.set(response);
          this.updateEmergencyCount();
          if (response.locations.length === 0) {
            this.snackBar.open('Nenhum veterinário encontrado na região especificada', 'Fechar', {
              duration: 5000
            });
          } else {
            const emergencyCount = this.emergencyCount();
            if (emergencyCount > 0) {
              this.snackBar.open(`${emergencyCount} veterinários com emergência 24h encontrados`, 'Fechar', {
                duration: 5000
              });
            }
          }
        },
        error: (error: any) => {
          
          this.snackBar.open('Erro ao buscar veterinários. Tente novamente.', 'Fechar', {
            duration: 5000
          });
        }
      });
  }

  filterEmergencyOnly() {
    const currentResults = this.searchResults();
    const emergencyOnly = currentResults.locations.filter(location => 
      (location as Veterinary).hasEmergency
    );
    
    this.searchResults.set({
      ...currentResults,
      locations: emergencyOnly,
      total: emergencyOnly.length
    });

    this.snackBar.open('Mostrando apenas veterinários com emergência 24h', 'Fechar', {
      duration: 3000
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

  onCallVeterinary(location: Location) {
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
