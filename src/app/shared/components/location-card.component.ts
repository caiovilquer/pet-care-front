import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { Petshop, Veterinary, Location } from '../../core/models/location.model';
import { LocationService } from '../../core/services/location.service';

@Component({
  selector: 'app-location-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatBadgeModule
  ],
  template: `
    <mat-card class="location-card" [class.open]="isOpen" [class.closed]="!isOpen">
      <div class="card-header">
        <div class="location-image">
          <img 
            [src]="location.imageUrl || getDefaultImage()" 
            [alt]="location.name"
            (error)="onImageError($event)">
          <div class="status-badge" [class.open]="isOpen" [class.closed]="!isOpen">
            <mat-icon>{{ isOpen ? 'schedule' : 'schedule_off' }}</mat-icon>
            {{ isOpen ? 'Aberto' : 'Fechado' }}
          </div>
        </div>
        
        <div class="location-info">
          <h3 class="location-name">{{ location.name }}</h3>
          <div class="location-type">
            <mat-icon>{{ getTypeIcon() }}</mat-icon>
            {{ getTypeLabel() }}
          </div>
          
          <div class="rating-distance">
            <div class="rating">
              <mat-icon class="star">star</mat-icon>
              <span>{{ location.rating.toFixed(1) }}</span>
              <span class="review-count">({{ location.reviewCount }})</span>
            </div>
            <div class="distance">
              <mat-icon>near_me</mat-icon>
              <span>{{ location.distanceText || (location.distance.toFixed(1) + 'km') }}</span>
              <span *ngIf="location.durationText" class="duration"> • {{ location.durationText }}</span>
            </div>
          </div>
        </div>
      </div>

      <mat-card-content>
        <div class="address">
          <mat-icon>location_on</mat-icon>
          <span>{{ location.address }}, {{ location.neighborhood }}</span>
        </div>

        <div class="contact-info" *ngIf="location.phone || location.email">
          <div class="phone" *ngIf="location.phone">
            <mat-icon>phone</mat-icon>
            <a [href]="'tel:' + location.phone">{{ location.phone }}</a>
          </div>
          <div class="email" *ngIf="location.email">
            <mat-icon>email</mat-icon>
            <a [href]="'mailto:' + location.email">{{ location.email }}</a>
          </div>
        </div>

        <div class="services" *ngIf="location.services.length > 0">
          <h4>Serviços:</h4>
          <mat-chip-set>
            <mat-chip *ngFor="let service of location.services.slice(0, 3)">
              {{ getServiceLabel(service) }}
            </mat-chip>
            <mat-chip *ngIf="location.services.length > 3" class="more-services">
              +{{ location.services.length - 3 }} mais
            </mat-chip>
          </mat-chip-set>
        </div>

        <!-- Serviços específicos para Petshop -->
        <div class="features" *ngIf="isPetshop(location)">
          <h4>Recursos:</h4>
          <div class="feature-list">
            <span class="feature" *ngIf="location.hasGrooming">
              <mat-icon>spa</mat-icon> Banho e tosa
            </span>
            <span class="feature" *ngIf="location.hasDaycare">
              <mat-icon>pets</mat-icon> Creche
            </span>
            <span class="feature" *ngIf="location.hasHotel">
              <mat-icon>hotel</mat-icon> Hotel
            </span>
            <span class="feature" *ngIf="location.hasVaccination">
              <mat-icon>medical_services</mat-icon> Vacinação
            </span>
          </div>
        </div>

        <!-- Serviços específicos para Veterinário -->
        <div class="features" *ngIf="isVeterinary(location)">
          <h4>Recursos:</h4>
          <div class="feature-list">
            <span class="feature" *ngIf="location.hasEmergency">
              <mat-icon>emergency</mat-icon> Emergência 24h
            </span>
            <span class="feature" *ngIf="location.hasLaboratory">
              <mat-icon>science</mat-icon> Laboratório
            </span>
            <span class="feature" *ngIf="location.hasSurgery">
              <mat-icon>local_hospital</mat-icon> Cirurgia
            </span>
            <span class="feature" *ngIf="location.hasRadiology">
              <mat-icon>X-ray</mat-icon> Radiologia
            </span>
          </div>
        </div>

        <div class="opening-hours">
          <h4>Horário de funcionamento:</h4>
          <div class="today-hours" [class.open]="isOpen" [class.closed]="!isOpen">
            <mat-icon>access_time</mat-icon>
            <div class="hours-info">
              <span class="status">{{ getStatusText() }}</span>
              <span class="hours">{{ getTodayHours() }}</span>
              <span *ngIf="!isOpen && getNextOpenTime()" class="next-open">{{ getNextOpenTime() }}</span>
            </div>
          </div>
        </div>
      </mat-card-content>

      <mat-card-actions>
        <button mat-button (click)="onCall()" *ngIf="location.phone">
          <mat-icon>phone</mat-icon>
          Ligar
        </button>
        
        <button mat-button (click)="onDirections()">
          <mat-icon>directions</mat-icon>
          Como chegar
        </button>
        
        <button mat-button (click)="onWebsite()" *ngIf="location.website">
          <mat-icon>language</mat-icon>
          Site
        </button>
        
        <button mat-raised-button color="primary" (click)="onViewDetails()">
          <mat-icon>info</mat-icon>
          Detalhes
        </button>
      </mat-card-actions>
    </mat-card>
  `,
  styles: [`
    .location-card {
      margin-bottom: 1.5rem;
      transition: all 0.3s ease;
      border-radius: 12px;
      overflow: hidden;
    }

    .location-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    }

    .location-card.open {
      border-left: 4px solid #4caf50;
    }

    .location-card.closed {
      border-left: 4px solid #f44336;
    }

    .card-header {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      background: #f8f9fa;
    }

    .location-image {
      position: relative;
      width: 120px;
      height: 120px;
      border-radius: 8px;
      overflow: hidden;
      flex-shrink: 0;
    }

    .location-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .status-badge {
      position: absolute;
      top: 8px;
      right: 8px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 0.75rem;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .status-badge.open {
      background: rgba(76, 175, 80, 0.9);
    }

    .status-badge.closed {
      background: rgba(244, 67, 54, 0.9);
    }

    .status-badge mat-icon {
      font-size: 14px;
      height: 14px;
      width: 14px;
    }

    .location-info {
      flex: 1;
    }

    .location-name {
      margin: 0 0 0.5rem 0;
      color: #1a1a1a;
      font-size: 1.25rem;
      font-weight: 600;
    }

    .location-type {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      color: #666;
      font-size: 0.9rem;
      margin-bottom: 0.5rem;
    }

    .location-type mat-icon {
      font-size: 18px;
      height: 18px;
      width: 18px;
    }

    .rating-distance {
      display: flex;
      gap: 1rem;
      align-items: center;
    }

    .rating {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      color: #ff9800;
    }

    .rating .star {
      color: #ff9800;
      font-size: 18px;
      height: 18px;
      width: 18px;
    }

    .review-count {
      color: #666;
      font-size: 0.85rem;
    }

    .distance {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      color: #666;
      font-size: 0.9rem;
    }

    .distance mat-icon {
      font-size: 16px;
      height: 16px;
      width: 16px;
    }

    .duration {
      color: #888;
      font-size: 0.85rem;
    }

    .address {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      margin-bottom: 1rem;
      color: #666;
    }

    .address mat-icon {
      margin-top: 2px;
      color: #1976d2;
    }

    .contact-info {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
      flex-wrap: wrap;
    }

    .phone, .email {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .phone a, .email a {
      color: #1976d2;
      text-decoration: none;
    }

    .phone a:hover, .email a:hover {
      text-decoration: underline;
    }

    .services, .features, .opening-hours {
      margin-bottom: 1rem;
    }

    .services h4, .features h4, .opening-hours h4 {
      margin: 0 0 0.5rem 0;
      font-size: 0.95rem;
      font-weight: 600;
      color: #333;
    }

    .feature-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .feature {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      background: #e3f2fd;
      color: #1976d2;
      padding: 0.25rem 0.5rem;
      border-radius: 6px;
      font-size: 0.8rem;
    }

    .feature mat-icon {
      font-size: 16px;
      height: 16px;
      width: 16px;
    }

    .today-hours {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      color: #666;
      padding: 0.75rem;
      background: #f9f9f9;
      border-radius: 8px;
      border-left: 4px solid #ddd;
    }

    .today-hours.open {
      background: #e8f5e8;
      border-left-color: #4caf50;
      color: #2e7d32;
    }

    .today-hours.closed {
      background: #fce4ec;
      border-left-color: #f44336;
      color: #c62828;
    }

    .hours-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .status {
      font-weight: 600;
      font-size: 0.9rem;
    }

    .hours {
      font-size: 0.85rem;
      opacity: 0.8;
    }

    .next-open {
      font-size: 0.8rem;
      opacity: 0.7;
      font-style: italic;
    }

    .opening-hours h4 {
      margin: 0 0 0.5rem 0;
      font-size: 0.9rem;
      color: #666;
    }

    .more-services {
      background-color: #f5f5f5 !important;
      color: #666 !important;
    }

    mat-card-actions {
      padding: 1rem;
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      justify-content: space-between;
    }

    mat-card-actions button {
      flex: 1;
      min-width: fit-content;
    }

    @media (max-width: 768px) {
      .card-header {
        flex-direction: column;
        text-align: center;
      }

      .location-image {
        width: 100%;
        height: 200px;
        align-self: center;
      }

      .rating-distance {
        justify-content: center;
      }

      .contact-info {
        justify-content: center;
      }

      mat-card-actions {
        flex-direction: column;
      }

      mat-card-actions button {
        width: 100%;
      }
    }
  `]
})
export class LocationCardComponent {
  @Input() location!: Petshop | Veterinary;
  @Output() callLocation = new EventEmitter<Location>();
  @Output() getDirections = new EventEmitter<Location>();
  @Output() viewWebsite = new EventEmitter<Location>();
  @Output() viewDetails = new EventEmitter<Location>();

  constructor(private locationService: LocationService) {}

  get isOpen(): boolean {
    return this.locationService.isOpenNow(this.location);
  }

  isPetshop(location: Location): location is Petshop {
    return location.type === 'petshop';
  }

  isVeterinary(location: Location): location is Veterinary {
    return location.type === 'veterinary';
  }

  getTypeIcon(): string {
    return this.location.type === 'petshop' ? 'store' : 'local_hospital';
  }

  getTypeLabel(): string {
    return this.location.type === 'petshop' ? 'Petshop' : 'Veterinário';
  }

  getDefaultImage(): string {
    return this.location.type === 'petshop' 
      ? 'assets/images/default-petshop.jpg'
      : 'assets/images/default-veterinary.jpg';
  }

  onImageError(event: any) {
    event.target.src = 'assets/images/placeholder.jpg';
  }

  getServiceLabel(service: string): string {
    const serviceLabels: { [key: string]: string } = {
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
    return serviceLabels[service] || service;
  }

  getTodayHours(): string {
    const now = new Date();
    const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()] as keyof typeof this.location.openingHours;
    const todaySchedule = this.location.openingHours[dayOfWeek];
    
    if (!todaySchedule?.isOpen) {
      return 'Fechado hoje';
    }
    
    if (todaySchedule.openTime && todaySchedule.closeTime) {
      // Verificar se é 24h
      if (todaySchedule.openTime === '00:00' && todaySchedule.closeTime === '23:59') {
        return '24 horas';
      }
      return `${todaySchedule.openTime} às ${todaySchedule.closeTime}`;
    }
    
    return 'Horário não informado';
  }

  getStatusText(): string {
    return this.isOpen ? 'Aberto agora' : 'Fechado';
  }

  getNextOpenTime(): string | null {
    if (this.isOpen) return null;
    
    const now = new Date();
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(now);
      checkDate.setDate(now.getDate() + i);
      const dayOfWeek = days[checkDate.getDay()] as keyof typeof this.location.openingHours;
      const schedule = this.location.openingHours[dayOfWeek];
      
      if (schedule?.isOpen && schedule.openTime) {
        if (i === 0) {
          // Hoje - verificar se ainda não passou do horário
          const currentTime = now.getHours() * 60 + now.getMinutes();
          const [openHour, openMin] = schedule.openTime.split(':').map(Number);
          const openTime = openHour * 60 + openMin;
          
          if (currentTime < openTime) {
            return `Abre hoje às ${schedule.openTime}`;
          }
        } else {
          const dayName = i === 1 ? 'amanhã' : 
                        ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'][checkDate.getDay()];
          return `Abre ${dayName} às ${schedule.openTime}`;
        }
      }
    }
    
    return null;
  }

  onCall() {
    if (this.location.phone) {
      this.callLocation.emit(this.location);
    }
  }

  onDirections() {
    this.getDirections.emit(this.location);
  }

  onWebsite() {
    if (this.location.website) {
      this.viewWebsite.emit(this.location);
    }
  }

  onViewDetails() {
    this.viewDetails.emit(this.location);
  }
}
