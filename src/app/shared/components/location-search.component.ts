import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSliderModule } from '@angular/material/slider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { LocationSearchParams, PetType } from '../../core/models/location.model';
import { LocationService } from '../../core/services/location.service';

@Component({
  selector: 'app-location-search',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatSliderModule,
    MatCheckboxModule,
    MatChipsModule,
    MatIconModule
  ],
  template: `
    <div class="search-container">
      <div class="search-header">
        <h3>{{ getSearchTitle() }}</h3>
        <p class="search-subtitle">{{ getSearchSubtitle() }}</p>
      </div>

      <form [formGroup]="searchForm" (ngSubmit)="onSearch()" class="search-form">
        <div class="main-search">
          <mat-form-field appearance="outline" class="cep-field">
            <mat-label>Digite seu CEP</mat-label>
            <input
              matInput
              formControlName="zipCode"
              placeholder="00000-000"
              (input)="onZipCodeInput($event)"
              (blur)="formatZipCode()"
              maxlength="9">
            <mat-icon matPrefix>location_on</mat-icon>
            <mat-error *ngIf="searchForm.get('zipCode')?.hasError('required')">
              CEP é obrigatório
            </mat-error>
            <mat-error *ngIf="searchForm.get('zipCode')?.hasError('pattern')">
              CEP deve ter 8 dígitos
            </mat-error>
          </mat-form-field>

          <button 
            mat-raised-button 
            color="primary" 
            type="submit"
            [disabled]="searchForm.invalid || isLoading"
            class="search-button">
            <mat-icon *ngIf="!isLoading">search</mat-icon>
            <mat-icon *ngIf="isLoading" class="loading-icon">hourglass_empty</mat-icon>
            {{ isLoading ? 'Buscando...' : 'Buscar' }}
          </button>
        </div>

        <div class="advanced-filters" [class.expanded]="showAdvancedFilters">
          <button 
            type="button"
            mat-button 
            (click)="toggleAdvancedFilters()"
            class="toggle-filters">
            <mat-icon>{{ showAdvancedFilters ? 'expand_less' : 'expand_more' }}</mat-icon>
            {{ showAdvancedFilters ? 'Menos filtros' : 'Mais filtros' }}
          </button>

          <div class="filters-content" *ngIf="showAdvancedFilters">
            <div class="filter-row">
              <mat-form-field appearance="outline" class="radius-field">
                <mat-label>Raio: {{ searchForm.get('radius')?.value }}km</mat-label>
                <mat-slider
                  formControlName="radius"
                  [min]="1"
                  [max]="50"
                  [step]="1">
                  <input matSliderThumb formControlName="radius">
                </mat-slider>
              </mat-form-field>
            </div>

            <div class="filter-row">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Ordenar por</mat-label>
                <mat-select formControlName="sortBy">
                  <mat-option value="distance">Distância</mat-option>
                  <mat-option value="rating">Avaliação</mat-option>
                  <mat-option value="name">Nome</mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            <div class="filter-row">
              <mat-checkbox formControlName="isOpenNow" class="open-now-checkbox">
                Apenas locais abertos agora
              </mat-checkbox>
            </div>

            <div class="filter-row" *ngIf="type === 'petshop'">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Serviços desejados</mat-label>
                <mat-select formControlName="services" multiple>
                  <mat-option value="grooming">Banho e tosa</mat-option>
                  <mat-option value="daycare">Creche</mat-option>
                  <mat-option value="hotel">Hotel</mat-option>
                  <mat-option value="vaccination">Vacinação</mat-option>
                  <mat-option value="food">Ração e produtos</mat-option>
                  <mat-option value="toys">Brinquedos</mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            <div class="filter-row" *ngIf="type === 'veterinary'">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Especialidades</mat-label>
                <mat-select formControlName="services" multiple>
                  <mat-option value="general">Clínica geral</mat-option>
                  <mat-option value="emergency">Emergência 24h</mat-option>
                  <mat-option value="surgery">Cirurgia</mat-option>
                  <mat-option value="laboratory">Laboratório</mat-option>
                  <mat-option value="radiology">Radiologia</mat-option>
                  <mat-option value="cardiology">Cardiologia</mat-option>
                  <mat-option value="dermatology">Dermatologia</mat-option>
                  <mat-option value="orthopedics">Ortopedia</mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            <div class="filter-row">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Tipos de pets</mat-label>
                <mat-select formControlName="petTypes" multiple>
                  <mat-option value="dog">Cachorro</mat-option>
                  <mat-option value="cat">Gato</mat-option>
                  <mat-option value="bird">Pássaro</mat-option>
                  <mat-option value="fish">Peixe</mat-option>
                  <mat-option value="rabbit">Coelho</mat-option>
                  <mat-option value="hamster">Hamster</mat-option>
                  <mat-option value="other">Outros</mat-option>
                </mat-select>
              </mat-form-field>
            </div>
          </div>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .search-container {
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      overflow: hidden;
      margin-bottom: 2rem;
    }

    .search-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 2rem;
      text-align: center;
    }

    .search-header h3 {
      margin: 0 0 0.5rem 0;
      font-size: 1.8rem;
      font-weight: 600;
    }

    .search-subtitle {
      margin: 0;
      opacity: 0.9;
      font-size: 1rem;
    }

    .search-form {
      padding: 2rem;
    }

    .main-search {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
      align-items: flex-start;
    }

    .cep-field {
      flex: 1;
    }

    .search-button {
      height: 56px;
      min-width: 140px;
      font-size: 1rem;
      font-weight: 600;
      border-radius: 12px;
    }

    .loading-icon {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .advanced-filters {
      border-top: 1px solid #eee;
      padding-top: 1rem;
    }

    .toggle-filters {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
      color: #667eea;
      font-weight: 500;
    }

    .filters-content {
      animation: fadeIn 0.3s ease-in-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .filter-row {
      margin-bottom: 1rem;
    }

    .radius-field {
      width: 100%;
    }

    .open-now-checkbox {
      color: #333;
      font-size: 1rem;
    }

    .full-width {
      width: 100%;
    }

    @media (max-width: 768px) {
      .search-header {
        padding: 1.5rem;
      }

      .search-header h3 {
        font-size: 1.5rem;
      }

      .search-form {
        padding: 1.5rem;
      }

      .main-search {
        flex-direction: column;
        gap: 1rem;
      }

      .search-button {
        width: 100%;
        height: 48px;
      }
    }
  `]
})
export class LocationSearchComponent implements OnInit {
  @Input() type: 'petshop' | 'veterinary' = 'petshop';
  @Input() isLoading = false;
  @Output() search = new EventEmitter<LocationSearchParams>();

  searchForm!: FormGroup;
  showAdvancedFilters = false;

  constructor(
    private fb: FormBuilder,
    private locationService: LocationService
  ) {}

  ngOnInit() {
    this.initForm();
  }

  private initForm() {
    this.searchForm = this.fb.group({
      zipCode: ['', [Validators.required, Validators.pattern(/^\d{5}-?\d{3}$/)]],
      radius: [10],
      services: [[]],
      petTypes: [[]],
      isOpenNow: [false],
      sortBy: ['distance']
    });
  }

  getSearchTitle(): string {
    return this.type === 'petshop' ? 'Encontre Petshops' : 'Encontre Veterinários';
  }

  getSearchSubtitle(): string {
    return this.type === 'petshop' 
      ? 'Encontre os melhores petshops próximos a você'
      : 'Encontre clínicas veterinárias de confiança';
  }

  toggleAdvancedFilters(): void {
    this.showAdvancedFilters = !this.showAdvancedFilters;
  }

  onZipCodeInput(event: any): void {
    const value = event.target.value.replace(/\D/g, '');
    if (value.length <= 8) {
      const formatted = value.length > 5 ? `${value.substring(0, 5)}-${value.substring(5)}` : value;
      this.searchForm.get('zipCode')?.setValue(formatted);
    }
  }

  formatZipCode() {
    const zipCodeControl = this.searchForm.get('zipCode');
    if (zipCodeControl?.value) {
      const cleaned = zipCodeControl.value.replace(/\D/g, '');
      if (cleaned.length === 8) {
        const formatted = `${cleaned.substring(0, 5)}-${cleaned.substring(5)}`;
        zipCodeControl.setValue(formatted);
      }
    }
  }

  formatLabel(value: number): string {
    return `${value}km`;
  }

  onSearch() {
    if (this.searchForm.valid) {
      const formValue = this.searchForm.value;
      const searchParams: LocationSearchParams = {
        ...formValue,
        type: this.type
      };
      this.search.emit(searchParams);
    }
  }

  onClear() {
    this.searchForm.reset({
      zipCode: '',
      radius: 10,
      services: [],
      petTypes: [],
      isOpenNow: false,
      sortBy: 'distance'
    });
  }
}
