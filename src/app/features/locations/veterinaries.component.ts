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
import { LocationsMapComponent } from '../../shared/components/locations-map.component';
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
    LocationCardComponent
  ],
  template: `
    <div class="veterinaries-container">
      <div class="header">
        <mat-toolbar color="primary" class="page-toolbar">
          <mat-icon>local_hospital</mat-icon>
          <span>Veterinários Próximos</span>
          <span class="spacer"></span>
          <span *ngIf="searchResults().total > 0" class="results-count">
            {{ searchResults().total }} veterinários encontrados
          </span>
          <button 
            mat-icon-button 
            *ngIf="emergencyCount() > 0"
            matBadge="{{ emergencyCount() }}"
            matBadgeColor="warn"
            matTooltip="Emergência 24h disponível">
            <mat-icon>emergency</mat-icon>
          </button>
        </mat-toolbar>
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

          <div class="results-grid" *ngIf="!isLoading() && searchResults().locations.length > 0">
            <app-location-card
              *ngFor="let veterinary of searchResults().locations; trackBy: trackByLocationId"
              [location]="veterinary"
              (callLocation)="onCallVeterinary($event)"
              (getDirections)="onGetDirections($event)"
              (viewWebsite)="onViewWebsite($event)"
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
    .veterinaries-container {
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

    .emergency-banner {
      background: linear-gradient(135deg, #ff5722 0%, #d32f2f 100%);
      color: white;
      border-radius: 12px;
      margin-bottom: 2rem;
      padding: 1.5rem;
      box-shadow: 0 4px 12px rgba(255, 87, 34, 0.3);
    }

    .emergency-content {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .emergency-content mat-icon {
      font-size: 48px;
      height: 48px;
      width: 48px;
      flex-shrink: 0;
    }

    .emergency-content div {
      flex: 1;
    }

    .emergency-content h3 {
      margin: 0 0 0.5rem 0;
      font-size: 1.1rem;
    }

    .emergency-content p {
      margin: 0;
      opacity: 0.9;
      font-size: 0.9rem;
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
      max-width: 800px;
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

    .welcome-content > p {
      color: var(--text-secondary);
      margin-bottom: 2rem;
      line-height: 1.6;
    }

    .info-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .info-card {
      padding: 1.5rem;
      border-radius: 12px;
      text-align: center;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      background: var(--bg-surface);
      border: 1px solid var(--border-light);
    }

    .info-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-hover);
    }

    .info-card.emergency {
      background: linear-gradient(135deg, var(--bg-surface) 0%, rgba(255, 235, 238, 0.8) 100%);
      border: 1px solid var(--accent-color);
    }

    .info-card.surgery {
      background: linear-gradient(135deg, var(--bg-surface) 0%, rgba(232, 245, 233, 0.8) 100%);
      border: 1px solid var(--primary-color);
    }

    .info-card.laboratory {
      background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
      border: 1px solid #2196f3;
    }

    .info-card.laboratory {
      background: linear-gradient(135deg, var(--bg-surface) 0%, rgba(227, 242, 253, 0.8) 100%);
      border: 1px solid var(--secondary-color);
    }

    .info-card.specialty {
      background: linear-gradient(135deg, var(--bg-surface) 0%, rgba(243, 229, 245, 0.8) 100%);
      border: 1px solid var(--accent-dark);
    }

    .info-card mat-icon {
      font-size: 48px;
      height: 48px;
      width: 48px;
      margin-bottom: 1rem;
    }

    .info-card.emergency mat-icon { color: var(--accent-color); }
    .info-card.surgery mat-icon { color: var(--primary-color); }
    .info-card.laboratory mat-icon { color: var(--secondary-color); }
    .info-card.specialty mat-icon { color: var(--accent-dark); }

    .info-card h4 {
      margin: 0 0 0.5rem 0;
      color: var(--text-primary);
      font-weight: 600;
    }

    .info-card p {
      margin: 0;
      color: var(--text-secondary);
      font-size: 0.9rem;
      line-height: 1.4;
    }

    .emergency-notice {
      display: flex;
      gap: 1rem;
      padding: 1.5rem;
      background: rgba(255, 249, 196, 0.8);
      border: 1px solid var(--warning-color);
      border-radius: 12px;
      text-align: left;
      backdrop-filter: blur(10px);
    }

    .emergency-notice mat-icon {
      color: var(--warning-color);
      flex-shrink: 0;
      margin-top: 0.25rem;
    }

    .emergency-notice strong {
      color: var(--warning-dark);
    }

    .emergency-notice p {
      margin: 0.5rem 0 0 0;
      color: var(--text-secondary);
      font-size: 0.9rem;
      line-height: 1.4;
    }

    @media (max-width: 768px) {
      .content {
        padding: 1rem;
      }

      .emergency-content {
        flex-direction: column;
        text-align: center;
      }

      .emergency-content button {
        align-self: center;
      }

      .results-header {
        flex-direction: column;
        gap: 1rem;
        text-align: center;
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

      .info-cards {
        grid-template-columns: 1fr;
        gap: 0.75rem;
      }

      .info-card {
        padding: 1rem;
      }

      .emergency-notice {
        flex-direction: column;
        text-align: center;
      }
    }
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

  onViewWebsite(location: Location) {
    if (location.website) {
      window.open(location.website, '_blank');
    }
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
