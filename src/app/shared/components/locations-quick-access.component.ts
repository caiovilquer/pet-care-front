import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-locations-quick-access',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="locations-section">
      <h3 class="section-title">Encontre localidades próximas</h3>
      <div class="locations-grid">
        <mat-card class="location-quick-card petshop-card">
          <mat-card-header>
            <div mat-card-avatar class="card-avatar petshop-avatar">
              <mat-icon>store</mat-icon>
            </div>
            <mat-card-title>Petshops</mat-card-title>
            <mat-card-subtitle>Encontre os melhores petshops da sua região</mat-card-subtitle>
          </mat-card-header>
          
          <mat-card-content>
            <div class="features">
              <div class="feature">
                <mat-icon>spa</mat-icon>
                <span>Banho e tosa</span>
              </div>
              <div class="feature">
                <mat-icon>pets</mat-icon>
                <span>Creche para pets</span>
              </div>
              <div class="feature">
                <mat-icon>hotel</mat-icon>
                <span>Hotel para pets</span>
              </div>
              <div class="feature">
                <mat-icon>shopping_cart</mat-icon>
                <span>Produtos e ração</span>
              </div>
            </div>
          </mat-card-content>
          
          <mat-card-actions>
            <button mat-raised-button color="primary" routerLink="/petshops">
              <mat-icon>search</mat-icon>
              Buscar Petshops
            </button>
          </mat-card-actions>
        </mat-card>

        <mat-card class="location-quick-card veterinary-card">
          <mat-card-header>
            <div mat-card-avatar class="card-avatar veterinary-avatar">
              <mat-icon>local_hospital</mat-icon>
            </div>
            <mat-card-title>Veterinários</mat-card-title>
            <mat-card-subtitle>Encontre cuidado médico para seus pets</mat-card-subtitle>
          </mat-card-header>
          
          <mat-card-content>
            <div class="features">
              <div class="feature emergency">
                <mat-icon>emergency</mat-icon>
                <span>Emergência 24h</span>
              </div>
              <div class="feature">
                <mat-icon>local_hospital</mat-icon>
                <span>Cirurgias</span>
              </div>
              <div class="feature">
                <mat-icon>science</mat-icon>
                <span>Laboratório</span>
              </div>
              <div class="feature">
                <mat-icon>healing</mat-icon>
                <span>Especialidades</span>
              </div>
            </div>
          </mat-card-content>
          
          <mat-card-actions>
            <button mat-raised-button color="accent" routerLink="/veterinaries">
              <mat-icon>search</mat-icon>
              Buscar Veterinários
            </button>
          </mat-card-actions>
        </mat-card>
      </div>
      
      <div class="info-banner">
        <mat-icon>info</mat-icon>
        <div>
          <strong>Nova funcionalidade!</strong>
          <p>Agora você pode encontrar petshops e veterinários próximos ao seu CEP, ver avaliações, horários de funcionamento e entrar em contato diretamente.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .locations-section {
      margin: 2rem 0;
    }

    .section-title {
      margin: 0 0 1.5rem 0;
      color: #333;
      font-size: 1.5rem;
      font-weight: 600;
    }

    .locations-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .location-quick-card {
      transition: all 0.3s ease;
      border-radius: 16px;
      overflow: hidden;
    }

    .location-quick-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    }

    .petshop-card {
      border-left: 4px solid #2196f3;
    }

    .veterinary-card {
      border-left: 4px solid var(--success-color);
    }

    .card-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }

    .petshop-avatar {
      background: linear-gradient(135deg, var(--secondary-color) 0%, var(--secondary-dark) 100%);
    }

    .veterinary-avatar {
      background: linear-gradient(135deg, var(--success-color) 0%, var(--primary-dark) 100%);
    }

    .card-avatar mat-icon {
      font-size: 24px;
    }

    .features {
      display: grid;
      gap: 1rem;
      margin: 1rem 0;
    }

    .feature {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem;
      background: #f8f9fa;
      border-radius: 8px;
      transition: all 0.3s ease;
    }

    .feature:hover {
      background: #e9ecef;
      transform: translateX(4px);
    }

    .feature mat-icon {
      color: #666;
      font-size: 20px;
    }

    .feature.emergency mat-icon {
      color: #f44336;
      animation: pulse 2s infinite;
    }

    .feature span {
      font-size: 0.9rem;
      color: #333;
      font-weight: 500;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }

    mat-card-actions {
      padding: 1rem 1.5rem;
    }

    mat-card-actions button {
      width: 100%;
      border-radius: 8px;
      font-weight: 600;
    }

    .info-banner {
      display: flex;
      gap: 1rem;
      padding: 1.5rem;
      background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
      border: 1px solid #2196f3;
      border-radius: 12px;
      align-items: flex-start;
    }

    .info-banner mat-icon {
      color: #1976d2;
      flex-shrink: 0;
      margin-top: 0.25rem;
    }

    .info-banner strong {
      color: #1976d2;
      font-size: 1rem;
    }

    .info-banner p {
      margin: 0.5rem 0 0 0;
      color: #333;
      font-size: 0.9rem;
      line-height: 1.4;
    }

    @media (max-width: 768px) {
      .locations-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
      }

      .location-quick-card {
        margin: 0;
      }

      .info-banner {
        flex-direction: column;
        text-align: center;
      }
    }
  `]
})
export class LocationsQuickAccessComponent {}
