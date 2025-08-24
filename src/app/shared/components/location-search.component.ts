import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
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
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LocationSearchParams, PetType } from '../../core/models/location.model';
import { LocationService } from '../../core/services/location.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

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
    MatIconModule,
    MatBadgeModule,
    MatTooltipModule
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

          <div class="buttons-container">
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
            
            <button
              *ngIf="hasActiveFilters"
              mat-stroked-button
              color="warn"
              type="button"
              (click)="clearAllFilters()"
              matTooltip="Limpar todos os filtros"
              class="clear-button">
              <mat-icon>clear</mat-icon>
              Limpar
            </button>
          </div>
        </div>

        <!-- Exibição de filtros ativos -->
        <div class="active-filters-container" *ngIf="activeFilters.length > 0">
          <div class="active-filters-header">
            <span class="active-filters-label">
              <mat-icon>filter_list</mat-icon>
              {{ activeFilters.length }} {{ activeFilters.length === 1 ? 'filtro ativo' : 'filtros ativos' }}
            </span>
          </div>
          <div class="active-filters-chips">
            <mat-chip-set>
              <mat-chip 
                *ngFor="let filter of activeFilters"
                [removable]="true"
                (removed)="removeFilter(filter.key)"
                class="filter-chip">
                <span>{{ filter.label }}</span>
                <mat-icon matChipRemove>cancel</mat-icon>
              </mat-chip>
            </mat-chip-set>
          </div>
        </div>

        <div class="advanced-filters" [class.expanded]="showAdvancedFilters">
          <button 
            type="button"
            mat-button 
            (click)="toggleAdvancedFilters()"
            [matBadge]="activeFilters.length || null"
            matBadgeColor="accent"
            matBadgeSize="small"
            class="toggle-filters">
            <mat-icon>{{ showAdvancedFilters ? 'expand_less' : 'expand_more' }}</mat-icon>
            {{ showAdvancedFilters ? 'Menos filtros' : 'Mais filtros' }}
          </button>

          <div class="filters-content" *ngIf="showAdvancedFilters">
            <div class="filter-row">
              <label class="filter-label">Raio de busca: {{ searchForm.get('radius')?.value }}km</label>
              <mat-slider
                class="radius-slider"
                [min]="1"
                [max]="50"
                [step]="1"
                [displayWith]="formatLabel">
                <input matSliderThumb formControlName="radius">
              </mat-slider>
            </div>

            <div class="filter-row">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Ordenar por</mat-label>
                <mat-select formControlName="sortBy">
                  <mat-option value="distance">Distância</mat-option>
                  <mat-option value="rating">Melhor avaliação</mat-option>
                  <mat-option value="name">Nome (A-Z)</mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            <div class="filter-row open-now-container">
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
                <mat-hint>Selecione um ou mais serviços</mat-hint>
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
                <mat-hint>Selecione uma ou mais especialidades</mat-hint>
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
                <mat-hint>Selecione um ou mais tipos de pet</mat-hint>
              </mat-form-field>
            </div>
            
            <div class="filter-actions">
              <button 
                mat-stroked-button 
                color="warn" 
                type="button" 
                (click)="clearAllFilters()" 
                class="clear-filters-button">
                <mat-icon>clear_all</mat-icon>
                Limpar todos os filtros
              </button>
              <button 
                mat-raised-button 
                color="primary" 
                type="submit" 
                [disabled]="searchForm.invalid || isLoading"
                class="apply-filters-button">
                <mat-icon>check</mat-icon>
                Aplicar filtros
              </button>
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
      transition: all 0.3s ease;
    }

    .search-header {
      background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
      color: white;
      padding: 1.5rem 2rem;
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
      padding: 1.5rem;
    }

    .main-search {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
      align-items: flex-start;
      flex-wrap: wrap;
    }

    .cep-field {
      flex: 1;
      min-width: 200px;
    }
    
    .buttons-container {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .search-button {
      height: 56px;
      min-width: 120px;
      font-size: 1rem;
      font-weight: 500;
      border-radius: 8px;
    }
    
    .clear-button {
      height: 56px;
      min-width: 100px;
    }

    .loading-icon {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    
    /* Estilização dos filtros ativos */
    .active-filters-container {
      background-color: var(--bg-surface);
      border-radius: 8px;
      padding: 0.75rem 1rem;
      margin-bottom: 1rem;
      animation: fadeIn 0.3s ease;
      border: 1px solid var(--border-light);
    }
    
    .active-filters-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }
    
    .active-filters-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
      color: var(--text-secondary);
      font-weight: 500;
    }
    
    .active-filters-label mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: var(--primary-color);
    }
    
    .active-filters-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    
    .filter-chip {
      font-size: 0.85rem;
      background-color: var(--bg-hover) !important;
      color: var(--primary-dark) !important;
      border: 1px solid var(--border-light) !important;
    }

    .advanced-filters {
      border-top: 1px solid var(--border-light);
      padding-top: 1rem;
    }

    .toggle-filters {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
      color: var(--primary-color);
      font-weight: 500;
    }

    .filters-content {
      background-color: var(--bg-surface);
      border-radius: 8px;
      padding: 1rem;
      animation: fadeIn 0.3s ease-in-out;
      border: 1px solid var(--border-light);
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .filter-row {
      margin-bottom: 1.25rem;
    }
    
    .filter-label {
      display: block;
      font-size: 0.9rem;
      font-weight: 500;
      margin-bottom: 0.5rem;
      color: var(--text-primary);
    }
    
    .radius-slider {
      width: 100%;
    }

    .open-now-container {
      margin: 1rem 0;
    }
    
    .open-now-checkbox {
      color: var(--text-primary);
      font-size: 1rem;
    }

    .full-width {
      width: 100%;
    }
    
    .filter-actions {
      display: flex;
      gap: 1rem;
      margin-top: 1.5rem;
      justify-content: space-between;
    }
    
    .clear-filters-button, .apply-filters-button {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    @media (max-width: 768px) {
      .search-header {
        padding: 1.25rem;
      }

      .search-header h3 {
        font-size: 1.5rem;
      }

      .search-form {
        padding: 1.25rem;
      }

      .main-search {
        flex-direction: column;
        gap: 1rem;
      }

      .buttons-container {
        width: 100%;
        display: flex;
        gap: 8px;
      }
      
      .search-button, .clear-button {
        flex: 1;
        height: 48px;
      }
      
      .filter-actions {
        flex-direction: column;
      }
    }

    /* Remove all focus outlines */
    ::ng-deep .mat-mdc-form-field .mdc-text-field:focus-within {
      outline: none !important;
      box-shadow: none !important;
    }

    ::ng-deep .mat-mdc-form-field input:focus {
      outline: none !important;
      box-shadow: none !important;
    }

    ::ng-deep .mat-mdc-form-field.mat-focused .mdc-text-field {
      box-shadow: none !important;
    }
  `]
})
export class LocationSearchComponent implements OnInit, OnDestroy {
  @Input() type: 'petshop' | 'veterinary' = 'petshop';
  @Input() isLoading = false;
  @Output() search = new EventEmitter<LocationSearchParams>();

  searchForm!: FormGroup;
  showAdvancedFilters = false;
  activeFilters: Array<{ key: string; label: string; value: any }> = [];
  hasActiveFilters = false;

  // Mapeamento de serviços para exibição legível
  private serviceLabels: { [key: string]: string } = {
    grooming: 'Banho e tosa',
    daycare: 'Creche',
    hotel: 'Hotel',
    vaccination: 'Vacinação',
    food: 'Ração e produtos',
    toys: 'Brinquedos',
    general: 'Clínica geral',
    emergency: 'Emergência 24h',
    surgery: 'Cirurgia',
    laboratory: 'Laboratório',
    radiology: 'Radiologia',
    cardiology: 'Cardiologia',
    dermatology: 'Dermatologia',
    orthopedics: 'Ortopedia'
  };

  // Mapeamento de tipos de pet para exibição legível
  private petTypeLabels: { [key: string]: string } = {
    dog: 'Cachorro',
    cat: 'Gato',
    bird: 'Pássaro',
    fish: 'Peixe',
    rabbit: 'Coelho',
    hamster: 'Hamster',
    other: 'Outros'
  };

  // Para unsubscribe em ngOnDestroy
  private destroy$ = new Subject<void>();

  // Valores padrão para o formulário
  private defaultValues = {
    zipCode: '',
    radius: 10,
    services: [],
    petTypes: [],
    isOpenNow: false,
    sortBy: 'distance'
  };

  constructor(
    private fb: FormBuilder,
    private locationService: LocationService
  ) {}

  ngOnInit() {
    this.initForm();
    this.setupFormListeners();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
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

  private setupFormListeners() {
    // Monitora alterações no formulário com debounce
    this.searchForm.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.updateActiveFilters();
        
        // Aplicação automática de filtros apenas se o CEP estiver preenchido e válido
        if (this.searchForm.get('zipCode')?.valid && this.searchForm.get('zipCode')?.value) {
          this.autoSearch();
        }
      });
  }

  // Busca automática com debounce para evitar excesso de chamadas
  private autoSearch() {
    // Não emite eventos se o formulário estiver inválido
    if (this.searchForm.invalid) return;
    
    const formValue = this.searchForm.value;
    const searchParams: LocationSearchParams = {
      ...formValue,
      type: this.type
    };
    this.search.emit(searchParams);
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
      this.searchForm.get('zipCode')?.setValue(formatted, { emitEvent: false });
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

  // Atualiza a lista de filtros ativos
  updateActiveFilters() {
    const filters: Array<{ key: string; label: string; value: any }> = [];
    const formValue = this.searchForm.value;
    
    // Raio (apenas se for diferente do padrão)
    if (formValue.radius && formValue.radius !== 10) {
      filters.push({
        key: 'radius',
        label: `Raio: ${formValue.radius}km`,
        value: formValue.radius
      });
    }
    
    // Ordenação (apenas se for diferente do padrão)
    if (formValue.sortBy && formValue.sortBy !== 'distance') {
      let sortLabel = 'Ordem: ';
      switch (formValue.sortBy) {
        case 'rating': sortLabel += 'Melhor avaliação'; break;
        case 'name': sortLabel += 'Alfabética (A-Z)'; break;
        default: sortLabel += 'Distância';
      }
      filters.push({
        key: 'sortBy',
        label: sortLabel,
        value: formValue.sortBy
      });
    }
    
    // Filtro "Abertos agora"
    if (formValue.isOpenNow) {
      filters.push({
        key: 'isOpenNow',
        label: 'Apenas abertos agora',
        value: true
      });
    }
    
    // Serviços
    if (formValue.services && formValue.services.length > 0) {
      const serviceNames = formValue.services.map((service: string) => 
        this.serviceLabels[service] || service
      );
      
      filters.push({
        key: 'services',
        label: `Serviços: ${serviceNames.join(', ')}`,
        value: formValue.services
      });
    }
    
    // Tipos de pet
    if (formValue.petTypes && formValue.petTypes.length > 0) {
      const petNames = formValue.petTypes.map((type: string) => 
        this.petTypeLabels[type] || type
      );
      
      filters.push({
        key: 'petTypes',
        label: `Pets: ${petNames.join(', ')}`,
        value: formValue.petTypes
      });
    }
    
    this.activeFilters = filters;
    this.hasActiveFilters = filters.length > 0;
  }

  // Remove um filtro específico
  removeFilter(key: string) {
    switch(key) {
      case 'radius':
        this.searchForm.patchValue({ radius: 10 });
        break;
      case 'sortBy':
        this.searchForm.patchValue({ sortBy: 'distance' });
        break;
      case 'isOpenNow':
        this.searchForm.patchValue({ isOpenNow: false });
        break;
      case 'services':
        this.searchForm.patchValue({ services: [] });
        break;
      case 'petTypes':
        this.searchForm.patchValue({ petTypes: [] });
        break;
    }
  }

  // Limpa todos os filtros, mantendo apenas o CEP
  clearAllFilters() {
    const currentZipCode = this.searchForm.get('zipCode')?.value;
    this.searchForm.patchValue({
      ...this.defaultValues,
      zipCode: currentZipCode
    });
    this.updateActiveFilters();
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
}
