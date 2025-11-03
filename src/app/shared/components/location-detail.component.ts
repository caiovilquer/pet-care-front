import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Inject } from '@angular/core';
import { Location, Petshop, Veterinary } from '../../core/models/location.model';
import { LocationService } from '../../core/services/location.service';
import { GoogleMapsService } from '../../core/services/google-maps.service';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil, catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-location-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTabsModule,
    MatCardModule,
    MatDividerModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="location-detail-container">
      <!-- Header com informações básicas -->
      <div class="detail-header">
        <div class="header-content">
          <div class="location-image-large">
            <div class="image-container">
              @if (location.photos && location.photos.length > 0) {
                <img [src]="location.photos[0]" 
                     [alt]="location.name"
                     class="location-photo"
                     (error)="onImageError($event)">
              } @else {
                <div class="placeholder-image">
                  <mat-icon>{{ getTypeIcon() }}</mat-icon>
                  <span class="placeholder-text">{{ getTypeLabel() }}</span>
                </div>
              }
            </div>
            <div class="image-overlay">
              <div class="status-badge" [class.open]="isOpen" [class.closed]="!isOpen">
                <mat-icon>{{ isOpen ? 'schedule' : 'schedule_off' }}</mat-icon>
                {{ isOpen ? 'Aberto agora' : 'Fechado' }}
              </div>
              <div class="rating-badge">
                <mat-icon class="star">star</mat-icon>
                <span>{{ location.rating.toFixed(1) }}</span>
              </div>
            </div>
          </div>
          
          <div class="header-info">
            <h1 class="location-name">{{ location.name }}</h1>
            <div class="location-type">
              <mat-icon>{{ getTypeIcon() }}</mat-icon>
              {{ getTypeLabel() }}
            </div>
            
            <div class="location-meta">
              <div class="distance">
                <mat-icon>near_me</mat-icon>
                <span>{{ location.distanceText || (location.distance.toFixed(1) + 'km') }}</span>
                <span *ngIf="location.durationText" class="duration"> • {{ location.durationText }}</span>
              </div>
              <div class="reviews">
                <mat-icon>star_rate</mat-icon>
                <span>{{ location.rating.toFixed(1) }} • {{ location.reviewCount }} avaliações</span>
              </div>
            </div>

            <div class="quick-actions">
              <button mat-raised-button color="primary" (click)="onCall()" *ngIf="location.phone">
                <mat-icon>phone</mat-icon>
                Ligar
              </button>
              
              <button mat-raised-button (click)="onDirections()">
                <mat-icon>directions</mat-icon>
                Como chegar
              </button>
              
              <button mat-raised-button (click)="onShare()">
                <mat-icon>share</mat-icon>
                Compartilhar
              </button>
            </div>
          </div>
        </div>
        
        <button mat-icon-button class="close-button" (click)="onClose()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Conteúdo em abas -->
      <mat-tab-group class="detail-tabs" animationDuration="300ms">
        <!-- Aba: Informações Gerais -->
        <mat-tab label="Informações">
          <div class="tab-content">
            <mat-card class="info-card">
              <mat-card-header>
                <mat-icon mat-card-avatar>info</mat-icon>
                <mat-card-title>Informações de Contato</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="contact-grid">
                  <div class="contact-item">
                    <mat-icon>location_on</mat-icon>
                    <div>
                      <strong>Endereço</strong>
                      <p>{{ location.address }}, {{ location.neighborhood }}</p>
                      <p *ngIf="location.city">{{ location.city }} - {{ location.state }}</p>
                      <p *ngIf="location.zipCode">CEP: {{ location.zipCode }}</p>
                    </div>
                  </div>

                  <div class="contact-item" *ngIf="location.phone">
                    <mat-icon>phone</mat-icon>
                    <div>
                      <strong>Telefone</strong>
                      <p><a [href]="'tel:' + location.phone">{{ location.phone }}</a></p>
                    </div>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>

            <!-- Detalhes específicos -->
            @if (loadingDetails) {
              <mat-card class="details-card">
                <mat-card-content>
                  <div class="loading-container">
                    <mat-spinner diameter="30"></mat-spinner>
                    <p>Carregando detalhes...</p>
                  </div>
                </mat-card-content>
              </mat-card>
            } @else if (detailedInfo) {
              <mat-card class="details-card">
                <mat-card-header>
                  <mat-icon mat-card-avatar>business</mat-icon>
                  <mat-card-title>Detalhes do Estabelecimento</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="details-grid">
                    <div class="detail-item" *ngIf="detailedInfo.description">
                      <strong>Descrição</strong>
                      <p>{{ detailedInfo.description }}</p>
                    </div>

                    <div class="detail-item" *ngIf="detailedInfo.phone">
                      <strong>Telefone</strong>
                      <p><a [href]="'tel:' + detailedInfo.phone">{{ detailedInfo.phone }}</a></p>
                    </div>

                    <div class="detail-item" *ngIf="detailedInfo.website">
                      <strong>Website</strong>
                      <p><a [href]="detailedInfo.website" target="_blank" rel="noopener">{{ detailedInfo.website }}</a></p>
                    </div>

                    <div class="detail-item" *ngIf="detailedInfo.googleMapsUrl">
                      <strong>Ver no Google Maps</strong>
                      <p><a [href]="detailedInfo.googleMapsUrl" target="_blank" rel="noopener">Abrir no Google Maps</a></p>
                    </div>

                    <div class="detail-item" *ngIf="detailedInfo.priceLevel && detailedInfo.priceLevel > 0">
                      <strong>Nível de preços</strong>
                      <p>{{ getPriceLevelText(detailedInfo.priceLevel) }}</p>
                    </div>

                    <div class="detail-item" *ngIf="detailedInfo.accessibility?.length > 0">
                      <strong>Acessibilidade</strong>
                      <mat-chip-set>
                        <mat-chip *ngFor="let feature of detailedInfo.accessibility">
                          {{ getAccessibilityLabel(feature) }}
                        </mat-chip>
                      </mat-chip-set>
                    </div>

                    <div class="detail-item" *ngIf="detailedInfo.paymentMethods?.length > 0">
                      <strong>Formas de pagamento</strong>
                      <mat-chip-set>
                        <mat-chip *ngFor="let method of detailedInfo.paymentMethods">
                          {{ getPaymentMethodLabel(method) }}
                        </mat-chip>
                      </mat-chip-set>
                    </div>

                    <!-- Mensagem quando não houver detalhes adicionais -->
                    <div class="no-additional-details" *ngIf="!hasAdditionalDetails()">
                      <mat-icon>info_outline</mat-icon>
                      <p>Este estabelecimento não possui informações detalhadas adicionais no momento.</p>
                      <p class="small-text">As informações básicas de contato e localização estão disponíveis na aba "Informações".</p>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>
            } @else {
              <mat-card class="details-card">
                <mat-card-header>
                  <mat-icon mat-card-avatar>business</mat-icon>
                  <mat-card-title>Detalhes do Estabelecimento</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="load-details">
                    <button mat-raised-button color="primary" (click)="loadDetailedInfo()">
                      <mat-icon>info</mat-icon>
                      Carregar Detalhes
                    </button>
                    <p class="load-info">Clique para buscar informações detalhadas do Google</p>
                  </div>
                </mat-card-content>
              </mat-card>
            }
          </div>
        </mat-tab>

        <!-- Aba: Horários -->
        <mat-tab label="Horários">
          <div class="tab-content">
            <mat-card class="hours-card">
              <mat-card-header>
                <mat-icon mat-card-avatar>schedule</mat-icon>
                <mat-card-title>Horário de Funcionamento</mat-card-title>
                <mat-card-subtitle>{{ getStatusText() }}</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <div class="hours-list">
                  <div 
                    class="day-hours" 
                    *ngFor="let day of weekDays; let i = index"
                    [class.today]="isToday(i)"
                    [class.open]="isDayOpen(day.key)"
                    [class.closed]="!isDayOpen(day.key)">
                    
                    <div class="day-name">
                      <span>{{ day.label }}</span>
                      <span *ngIf="isToday(i)" class="today-badge">Hoje</span>
                    </div>
                    
                    <div class="day-time">
                      <span *ngIf="isDayOpen(day.key) && getDayHours(day.key) !== 'Horário não informado'; else closedOrUnknown">
                        {{ getDayHours(day.key) }}
                      </span>
                      <ng-template #closedOrUnknown>
                        <span class="closed-text">{{ getDayHours(day.key) }}</span>
                      </ng-template>
                    </div>
                  </div>
                  
                  <!-- Mensagem quando não há horários disponíveis -->
                  <div class="no-hours-info" *ngIf="!hasOpeningHoursData()">
                    <mat-icon>info_outline</mat-icon>
                    <p>Horários de funcionamento não disponíveis no Google Maps.</p>
                    <p class="small-text">Entre em contato diretamente com o estabelecimento para confirmar os horários.</p>
                  </div>
                </div>

                <div class="next-open" *ngIf="!isOpen && getNextOpenTime()">
                  <mat-icon>schedule</mat-icon>
                  <span>{{ getNextOpenTime() }}</span>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <!-- Aba: Serviços -->
        <mat-tab label="Serviços">
          <div class="tab-content">
            <mat-card class="services-card">
              <mat-card-header>
                <mat-icon mat-card-avatar>{{ getTypeIcon() }}</mat-icon>
                <mat-card-title>Serviços Oferecidos</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="services-grid">
                  <mat-chip-set>
                    <mat-chip *ngFor="let service of getDisplayServices()" class="service-chip">
                      <mat-icon>{{ getServiceIcon(service) }}</mat-icon>
                      {{ getServiceLabel(service) }}
                    </mat-chip>
                  </mat-chip-set>
                </div>

                <!-- Recursos específicos para Petshop -->
                <div class="features-section" *ngIf="isPetshop(location)">
                  <h3>Recursos Disponíveis</h3>
                  <div class="features-grid">
                    <div class="feature-item" *ngIf="location.hasGrooming">
                      <mat-icon>spa</mat-icon>
                      <div>
                        <strong>Banho e Tosa</strong>
                        <p>Serviços completos de higiene e estética</p>
                      </div>
                    </div>
                    
                    <div class="feature-item" *ngIf="location.hasDaycare">
                      <mat-icon>pets</mat-icon>
                      <div>
                        <strong>Creche / Day Care</strong>
                        <p>Cuidados durante o dia para seu pet</p>
                      </div>
                    </div>
                    
                    <div class="feature-item" *ngIf="location.hasHotel">
                      <mat-icon>hotel</mat-icon>
                      <div>
                        <strong>Hotel para Pets</strong>
                        <p>Hospedagem com cuidados especiais</p>
                      </div>
                    </div>
                    
                    <div class="feature-item" *ngIf="location.hasVaccination">
                      <mat-icon>medical_services</mat-icon>
                      <div>
                        <strong>Vacinação</strong>
                        <p>Imunização e cuidados preventivos</p>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Recursos específicos para Veterinário -->
                <div class="features-section" *ngIf="isVeterinary(location)">
                  <h3>Especialidades e Recursos</h3>
                  <div class="features-grid">
                    <div class="feature-item" *ngIf="location.hasEmergency">
                      <mat-icon>emergency</mat-icon>
                      <div>
                        <strong>Emergência 24h</strong>
                        <p>Atendimento de urgência disponível 24 horas</p>
                      </div>
                    </div>
                    
                    <div class="feature-item" *ngIf="location.hasLaboratory">
                      <mat-icon>science</mat-icon>
                      <div>
                        <strong>Laboratório</strong>
                        <p>Exames laboratoriais e diagnósticos</p>
                      </div>
                    </div>
                    
                    <div class="feature-item" *ngIf="location.hasSurgery">
                      <mat-icon>local_hospital</mat-icon>
                      <div>
                        <strong>Centro Cirúrgico</strong>
                        <p>Cirurgias especializadas</p>
                      </div>
                    </div>
                    
                    <div class="feature-item" *ngIf="location.hasRadiology">
                      <mat-icon>medical_information</mat-icon>
                      <div>
                        <strong>Radiologia</strong>
                        <p>Exames de imagem e diagnóstico</p>
                      </div>
                    </div>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <!-- Aba: Avaliações -->
        <mat-tab label="Avaliações">
          <div class="tab-content">
            <mat-card class="reviews-card">
              <mat-card-header>
                <mat-icon mat-card-avatar>star_rate</mat-icon>
                <mat-card-title>Avaliações</mat-card-title>
                <mat-card-subtitle>{{ location.reviewCount }} avaliações</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <div class="rating-summary">
                  <div class="rating-display">
                    <span class="rating-number">{{ location.rating.toFixed(1) }}</span>
                    <div class="stars">
                      <mat-icon 
                        *ngFor="let star of [1,2,3,4,5]" 
                        [class.filled]="star <= location.rating">
                        star
                      </mat-icon>
                    </div>
                    <span class="review-count">{{ location.reviewCount }} avaliações</span>
                  </div>
                </div>

                <mat-divider></mat-divider>

                @if (loadingReviews) {
                  <div class="loading-container">
                    <mat-spinner diameter="30"></mat-spinner>
                    <p>Carregando avaliações...</p>
                  </div>
                } @else if (reviewsLoaded && reviews && reviews.length > 0) {
                  <div class="reviews-list">
                    <div class="review-item" *ngFor="let review of reviews">
                      <div class="review-header">
                        <div class="reviewer-info">
                          <strong>{{ review.authorName }}</strong>
                          <div class="review-stars">
                            <mat-icon 
                              *ngFor="let star of [1,2,3,4,5]" 
                              [class.filled]="star <= review.rating">
                              star
                            </mat-icon>
                          </div>
                        </div>
                        <span class="review-date">{{ review.relativeTime }}</span>
                      </div>
                      <p class="review-text">{{ review.text }}</p>
                    </div>
                  </div>
                } @else if (reviewsLoaded) {
                  <div class="no-reviews">
                    <mat-icon>rate_review</mat-icon>
                    <p>Nenhuma avaliação disponível ainda</p>
                  </div>
                } @else {
                  <div class="load-reviews">
                    <button mat-raised-button color="primary" (click)="loadReviews()">
                      <mat-icon>star</mat-icon>
                      Carregar Avaliações
                    </button>
                    <p class="load-info">Clique para buscar avaliações detalhadas do Google</p>
                  </div>
                }

                <div class="google-reviews-link" *ngIf="detailedInfo?.googleMapsUrl">
                  <button mat-stroked-button (click)="openGoogleReviews()">
                    <mat-icon>open_in_new</mat-icon>
                    Ver todas as avaliações no Google
                  </button>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .location-detail-container {
      max-width: 900px;
      width: 100vw;
      max-height: 90vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .detail-header {
      position: relative;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 2rem;
    }

    .close-button {
      position: absolute;
      top: 1rem;
      right: 1rem;
      color: white;
      z-index: 10;
    }

    .header-content {
      display: flex;
      gap: 2rem;
      align-items: flex-start;
    }

    .location-image-large {
      position: relative;
      width: 200px;
      height: 150px;
      border-radius: 12px;
      overflow: hidden;
      flex-shrink: 0;
    }

    .image-container {
      width: 100%;
      height: 100%;
      position: relative;
    }

    .location-photo {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .location-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .placeholder-image {
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(240,240,240,0.9) 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: rgba(255,255,255,0.9);
      border: 2px dashed rgba(255,255,255,0.5);
    }

    .placeholder-image mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 12px;
      opacity: 0.8;
    }

    .placeholder-text {
      font-size: 0.85rem;
      font-weight: 600;
      text-align: center;
      opacity: 0.9;
      text-shadow: 0 1px 2px rgba(0,0,0,0.3);
    }

    .image-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(transparent, rgba(0,0,0,0.3));
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding: 0.75rem;
    }

    .status-badge {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      background: rgba(0,0,0,0.7);
      color: white;
      padding: 0.25rem 0.5rem;
      border-radius: 6px;
      font-size: 0.75rem;
    }

    .status-badge.open {
      background: rgba(76, 175, 80, 0.9);
    }

    .status-badge.closed {
      background: rgba(244, 67, 54, 0.9);
    }

    .rating-badge {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      background: rgba(255, 193, 7, 0.9);
      color: white;
      padding: 0.25rem 0.5rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .header-info {
      flex: 1;
    }

    .location-name {
      margin: 0 0 0.5rem 0;
      font-size: 2rem;
      font-weight: 700;
      line-height: 1.2;
    }

    .location-type {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
      opacity: 0.9;
      font-size: 1.1rem;
    }

    .location-meta {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
      opacity: 0.9;
    }

    .location-meta > div {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .quick-actions {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .quick-actions button {
      background: rgba(255,255,255,0.15);
      color: white;
      border: 1px solid rgba(255,255,255,0.3);
    }

    .quick-actions button:hover {
      background: rgba(255,255,255,0.25);
    }

    .detail-tabs {
      flex: 1;
      overflow: hidden;
    }

    .tab-content {
      padding: 1.5rem;
      height: 400px;
      overflow-y: auto;
    }

    .info-card, .hours-card, .services-card, .reviews-card, .details-card {
      margin-bottom: 1.5rem;
    }

    .contact-grid, .details-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1.5rem;
      margin-top: 1rem;
    }

    .contact-item, .detail-item {
      display: flex;
      gap: 1rem;
      align-items: flex-start;
    }

    .detail-item strong {
      display: block;
      margin-bottom: 0.25rem;
      color: #333;
      font-size: 0.95rem;
    }

    .detail-item p {
      margin: 0;
      color: #555;
      line-height: 1.6;
    }

    .detail-item a {
      color: #1976d2;
      text-decoration: none;
      font-weight: 500;
    }

    .detail-item a:hover {
      text-decoration: underline;
      color: #1565c0;
    }

    .contact-item mat-icon {
      color: #666;
      margin-top: 0.25rem;
    }

    .contact-item strong {
      display: block;
      margin-bottom: 0.25rem;
      color: #333;
    }

    .contact-item p {
      margin: 0;
      color: #666;
    }

    .contact-item a {
      color: #1976d2;
      text-decoration: none;
    }

    .contact-item a:hover {
      text-decoration: underline;
    }

    .hours-list {
      margin-top: 1rem;
    }

    .day-hours {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 0;
      border-bottom: 1px solid #eee;
    }

    .day-hours.today {
      background: #f3f4f6;
      padding: 0.75rem;
      border-radius: 8px;
      border-bottom: none;
      margin-bottom: 0.5rem;
      font-weight: 600;
    }

    .day-name {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .today-badge {
      background: #1976d2;
      color: white;
      padding: 0.125rem 0.5rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .day-time {
      font-weight: 500;
    }

    .day-hours.open .day-time {
      color: var(--success-color);
    }

    .day-hours.closed .day-time {
      color: #d32f2f;
    }

    .closed-text {
      font-style: italic;
      color: #999;
    }

    .no-hours-info {
      text-align: center;
      padding: 2rem 1rem;
      margin-top: 1rem;
      background: #fff3e0;
      border-radius: 8px;
      border: 1px dashed #ff9800;
    }

    .no-hours-info mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: #ff9800;
      margin-bottom: 0.5rem;
    }

    .no-hours-info p {
      margin: 0.5rem 0;
      color: #666;
    }

    .no-hours-info .small-text {
      font-size: 0.85rem;
      color: #888;
    }

    .next-open {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 1rem;
      padding: 1rem;
      background: #e3f2fd;
      border-radius: 8px;
      color: #1976d2;
      font-weight: 500;
    }

    .services-grid {
      margin-top: 1rem;
    }

    .service-chip {
      margin: 0.25rem;
    }

    .service-chip mat-icon {
      margin-right: 0.5rem;
    }

    .features-section {
      margin-top: 2rem;
    }

    .features-section h3 {
      margin: 0 0 1rem 0;
      color: #333;
      font-size: 1.25rem;
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
    }

    .feature-item {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 8px;
      align-items: flex-start;
    }

    .feature-item mat-icon {
      color: #1976d2;
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .feature-item strong {
      display: block;
      margin-bottom: 0.25rem;
      color: #333;
    }

    .feature-item p {
      margin: 0;
      color: #666;
      font-size: 0.9rem;
    }

    .rating-summary {
      margin-bottom: 1.5rem;
    }

    .rating-display {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      text-align: center;
    }

    .rating-number {
      font-size: 3rem;
      font-weight: 700;
      color: #1976d2;
    }

    .stars {
      display: flex;
      gap: 0.25rem;
    }

    .stars mat-icon {
      color: #ddd;
      font-size: 24px;
    }

    .stars mat-icon.filled {
      color: #ffc107;
    }

    .review-count {
      color: #666;
      font-size: 0.9rem;
    }

    .reviews-list {
      margin-top: 1.5rem;
    }

    .review-item {
      padding: 1rem 0;
      border-bottom: 1px solid #eee;
    }

    .review-item:last-child {
      border-bottom: none;
    }

    .review-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.5rem;
    }

    .reviewer-info strong {
      display: block;
      margin-bottom: 0.25rem;
    }

    .review-stars {
      display: flex;
      gap: 0.125rem;
    }

    .review-stars mat-icon {
      color: #ddd;
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .review-stars mat-icon.filled {
      color: #ffc107;
    }

    .review-date {
      color: #666;
      font-size: 0.85rem;
    }

    .review-text {
      margin: 0;
      color: #333;
      line-height: 1.5;
    }

    .no-reviews {
      text-align: center;
      padding: 2rem;
      color: #666;
    }

    .no-reviews mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 1rem;
      opacity: 0.5;
    }

    .google-reviews-link {
      margin-top: 1.5rem;
      text-align: center;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      padding: 2rem;
      color: #666;
    }

    .no-additional-details {
      text-align: center;
      padding: 2rem;
      color: #666;
      background: #f8f9fa;
      border-radius: 8px;
      margin-top: 1rem;
    }

    .no-additional-details mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 1rem;
      opacity: 0.5;
      color: #999;
    }

    .no-additional-details p {
      margin: 0.5rem 0;
    }

    .no-additional-details .small-text {
      font-size: 0.85rem;
      color: #888;
      margin-top: 0.5rem;
    }

    .load-details {
      text-align: center;
      padding: 2rem;
    }

    .load-details button {
      margin-bottom: 1rem;
    }

    .load-info {
      color: #666;
      font-size: 0.9rem;
      margin: 0;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .location-detail-container {
        width: 100vw;
        max-width: none;
        height: 100vh;
        max-height: none;
        border-radius: 0;
      }

      .header-content {
        flex-direction: column;
        gap: 1rem;
      }

      .location-image-large {
        width: 100%;
        height: 120px;
      }

      .location-name {
        font-size: 1.5rem;
      }

      .quick-actions {
        justify-content: center;
      }

      .quick-actions button {
        flex: 1;
        min-width: 0;
      }

      .features-grid {
        grid-template-columns: 1fr;
      }

      .contact-grid {
        gap: 1rem;
      }

      .tab-content {
        padding: 1rem;
        height: 350px;
      }
    }
  `]
})
export class LocationDetailComponent implements OnInit, OnDestroy {
  @Input() location!: Location;
  
  isOpen = false;
  detailedInfo: any = null;
  reviews: any[] = [];
  loadingDetails = false;
  loadingReviews = false;
  reviewsLoaded = false;
  
  private destroy$ = new Subject<void>();

  weekDays = [
    { key: 'sunday', label: 'Domingo' },
    { key: 'monday', label: 'Segunda-feira' },
    { key: 'tuesday', label: 'Terça-feira' },
    { key: 'wednesday', label: 'Quarta-feira' },
    { key: 'thursday', label: 'Quinta-feira' },
    { key: 'friday', label: 'Sexta-feira' },
    { key: 'saturday', label: 'Sábado' }
  ];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { location: Location },
    private dialogRef: MatDialogRef<LocationDetailComponent>,
    private locationService: LocationService,
    private googleMapsService: GoogleMapsService,
    private snackBar: MatSnackBar
  ) {
    this.location = data.location;
  }

  ngOnInit() {
    this.checkIfOpen();
    // Detalhes agora são carregados sob demanda
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private checkIfOpen() {
    this.isOpen = this.locationService.isOpenNow(this.location);
  }

  loadDetailedInfo() {
    this.loadingDetails = true;
    
    // ULTRA ECONÔMICO: Carregar apenas detalhes essenciais, sem reviews
    this.googleMapsService.getPlaceDetails(this.location.id).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.loadingDetails = false)
    ).subscribe({
      next: (details) => {
        console.log('Detalhes carregados:', details);
        if (details) {
          this.detailedInfo = details;
        } else {
          // Se não houver detalhes, criar objeto vazio mas válido
          this.detailedInfo = {
            description: '',
            priceLevel: 0,
            photos: [],
            phone: this.location.phone || '',
            website: this.location.website || '',
            googleMapsUrl: '',
            types: [],
            vicinity: '',
            addressComponents: [],
            accessibility: [],
            paymentMethods: [],
            businessStatus: '',
            openingHours: null
          };
          this.snackBar.open('Algumas informações não estão disponíveis', 'Fechar', {
            duration: 3000
          });
        }
      },
      error: (error) => {
        console.error('Erro ao carregar detalhes:', error);
        // Mesmo em caso de erro, criar estrutura básica
        this.detailedInfo = {
          description: '',
          priceLevel: 0,
          photos: [],
          phone: this.location.phone || '',
          website: this.location.website || '',
          googleMapsUrl: '',
          types: [],
          vicinity: '',
          addressComponents: [],
          accessibility: [],
          paymentMethods: [],
          businessStatus: '',
          openingHours: null
        };
        this.snackBar.open('Erro ao carregar detalhes do estabelecimento', 'Fechar', {
          duration: 3000
        });
      }
    });
  }

  loadReviews() {
    if (this.reviewsLoaded) return; // Já carregou ou está carregando
    
    this.loadingReviews = true;
    this.googleMapsService.getPlaceReviews(this.location.id).pipe(
      catchError(() => of([])),
      takeUntil(this.destroy$),
      finalize(() => {
        this.loadingReviews = false;
        this.reviewsLoaded = true;
      })
    ).subscribe({
      next: (reviews) => {
        this.reviews = reviews || [];
      },
      error: (error) => {
        console.error('Erro ao carregar reviews:', error);
        this.snackBar.open('Erro ao carregar avaliações', 'Fechar', {
          duration: 3000
        });
      }
    });
  }

  getTypeIcon(): string {
    return this.location.type === 'petshop' ? 'pets' : 'local_hospital';
  }

  getTypeLabel(): string {
    return this.location.type === 'petshop' ? 'Petshop' : 'Clínica Veterinária';
  }

  getServiceIcon(service: string): string {
    const icons: { [key: string]: string } = {
      petshop: 'store',
      veterinary: 'local_hospital',
      grooming: 'spa',
      daycare: 'pets',
      hotel: 'hotel',
      vaccination: 'medical_services',
      food: 'restaurant',
      toys: 'toys',
      general: 'local_hospital',
      emergency: 'emergency',
      surgery: 'healing',
      laboratory: 'biotech',
      radiology: 'medical_information',
      cardiology: 'favorite',
      dermatology: 'face',
      orthopedics: 'accessibility'
    };
    return icons[service] || 'check_circle';
  }

  getServiceLabel(service: string): string {
    const labels: { [key: string]: string } = {
      // Traduzir tipos genéricos
      petshop: 'Petshop',
      veterinary: 'Clínica Veterinária',
      grooming: 'Banho e tosa',
      daycare: 'Creche',
      hotel: 'Hotel',
      vaccination: 'Vacinação',
      food: 'Ração',
      toys: 'Brinquedos',
      general: 'Clínica geral',
      emergency: 'Emergência',
      surgery: 'Cirurgia',
      laboratory: 'Laboratório',
      radiology: 'Radiologia',
      cardiology: 'Cardiologia',
      dermatology: 'Dermatologia',
      orthopedics: 'Ortopedia'
      
    };
    return labels[service] || service;
  }

  // Retornar todos os serviços (com tradução)
  getDisplayServices(): string[] {
    return this.location.services;
  }

  isPetshop(location: Location): location is Petshop {
    return location.type === 'petshop';
  }

  isVeterinary(location: Location): location is Veterinary {
    return location.type === 'veterinary';
  }

  hasAdditionalDetails(): boolean {
    if (!this.detailedInfo) return false;
    
    return !!(
      this.detailedInfo.description ||
      this.detailedInfo.phone ||
      this.detailedInfo.website ||
      this.detailedInfo.googleMapsUrl ||
      (this.detailedInfo.priceLevel && this.detailedInfo.priceLevel > 0) ||
      (this.detailedInfo.accessibility && this.detailedInfo.accessibility.length > 0) ||
      (this.detailedInfo.paymentMethods && this.detailedInfo.paymentMethods.length > 0)
    );
  }

  hasOpeningHoursData(): boolean {
    // Verifica se há pelo menos um dia com horário definido
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    return days.some(day => {
      const schedule = this.location.openingHours[day as keyof typeof this.location.openingHours];
      return schedule && (schedule.openTime !== undefined || schedule.closeTime !== undefined);
    });
  }

  isToday(dayIndex: number): boolean {
    return new Date().getDay() === dayIndex;
  }

  isDayOpen(dayKey: string): boolean {
    const schedule = this.location.openingHours[dayKey as keyof typeof this.location.openingHours];
    return schedule?.isOpen || false;
  }

  getDayHours(dayKey: string): string {
    const schedule = this.location.openingHours[dayKey as keyof typeof this.location.openingHours];
    
    if (!schedule?.isOpen) {
      return 'Fechado';
    }
    
    if (schedule.openTime && schedule.closeTime) {
      if (schedule.openTime === '00:00' && schedule.closeTime === '23:59') {
        return '24 horas';
      }
      return `${schedule.openTime} às ${schedule.closeTime}`;
    }
    
    return 'Horário não informado';
  }

  getStatusText(): string {
    return this.isOpen ? 'Aberto agora' : 'Fechado';
  }

  getNextOpenTime(): string | null {
    return this.locationService.getNextOpenTime(this.location);
  }

  getPriceLevelText(level: number): string {
    const levels = ['Muito barato', 'Barato', 'Moderado', 'Caro', 'Muito caro'];
    return levels[level - 1] || 'Não informado';
  }

  getAccessibilityLabel(feature: string): string {
    const labels: { [key: string]: string } = {
      wheelchair_accessible: 'Acessível para cadeirantes',
      parking: 'Estacionamento acessível',
      entrance: 'Entrada acessível',
      restroom: 'Banheiro acessível'
    };
    return labels[feature] || feature;
  }

  getPaymentMethodLabel(method: string): string {
    const labels: { [key: string]: string } = {
      cash: 'Dinheiro',
      credit_card: 'Cartão de crédito',
      debit_card: 'Cartão de débito',
      pix: 'PIX',
      check: 'Cheque'
    };
    return labels[method] || method;
  }

  onCall() {
    if (this.location.phone) {
      window.open(`tel:${this.location.phone}`, '_self');
    }
  }

  onImageError(event: any) {
    // Se a imagem falhar ao carregar, esconder e mostrar placeholder
    event.target.style.display = 'none';
  }

  onDirections() {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${this.location.latitude},${this.location.longitude}&destination_place_id=${this.location.name}`;
    window.open(url, '_blank');
  }

  onShare() {
    if (navigator.share) {
      navigator.share({
        title: this.location.name,
        text: `Confira ${this.location.name} - ${this.getTypeLabel()}`,
        url: window.location.href
      }).catch(console.error);
    } else {
      // Fallback: copiar para área de transferência
      const shareText = `${this.location.name}\n${this.location.address}\n${window.location.href}`;
      navigator.clipboard.writeText(shareText).then(() => {
        this.snackBar.open('Informações copiadas para área de transferência', 'Fechar', {
          duration: 3000
        });
      });
    }
  }

  openGoogleReviews() {
    if (this.detailedInfo?.googleMapsUrl) {
      window.open(this.detailedInfo.googleMapsUrl, '_blank');
    }
  }

  onClose() {
    this.dialogRef.close();
  }
}
