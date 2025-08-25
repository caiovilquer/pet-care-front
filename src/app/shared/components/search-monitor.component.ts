import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSliderModule } from '@angular/material/slider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { interval, Subscription } from 'rxjs';

import { SearchOptimizerService, SearchMetrics, SearchOptimizationConfig } from '../../core/services/search-optimizer.service';
import { CacheService } from '../../core/services/cache.service';
import { GoogleMapsService } from '../../core/services/google-maps.service';

@Component({
  selector: 'app-search-monitor',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatSliderModule,
    MatSlideToggleModule,
    MatDividerModule,
    MatChipsModule
  ],
  template: `
    <div class="search-monitor">
      <mat-card class="metrics-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>analytics</mat-icon>
            Monitoramento de Busca
          </mat-card-title>
          <mat-card-subtitle>
            Otimização e economia de custos da API do Google Maps
          </mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <!-- Resumo Principal -->
          <div class="summary-section">
            <div class="metric-item">
              <div class="metric-value">{{ metrics.totalSearches }}</div>
              <div class="metric-label">Buscas Totais</div>
            </div>
            
            <div class="metric-item">
              <div class="metric-value cache-hits">{{ metrics.cacheHits }}</div>
              <div class="metric-label">Cache Hits</div>
            </div>
            
            <div class="metric-item">
              <div class="metric-value api-calls">{{ metrics.apiCalls }}</div>
              <div class="metric-label">Chamadas API</div>
            </div>
            
            <div class="metric-item">
              <div class="metric-value savings">\${{ estimatedSavings.toFixed(2) }}</div>
              <div class="metric-label">Economia</div>
            </div>
          </div>

          <mat-divider></mat-divider>

          <!-- Taxa de Cache Hit -->
          <div class="cache-rate-section">
            <h3>Taxa de Cache Hit: {{ cacheHitRate.toFixed(1) }}%</h3>
            <mat-progress-bar 
              mode="determinate" 
              [value]="cacheHitRate"
              [color]="getCacheRateColor()">
            </mat-progress-bar>
            <p class="cache-rate-description">
              {{ getCacheRateDescription() }}
            </p>
          </div>

          <mat-divider></mat-divider>

          <!-- Configurações de Otimização -->
          <div class="optimization-config">
            <h3>Configurações de Otimização</h3>
            
            <div class="config-item">
              <label>Debounce (ms)</label>
              <input 
                type="range" 
                min="100" 
                max="2000" 
                step="100"
                [value]="config.debounceTime"
                (input)="onDebounceChange($event)"
                class="config-slider">
              <span class="config-value">{{ config.debounceTime }}ms</span>
            </div>

            <div class="config-item">
              <label>Máximo de Resultados</label>
              <input 
                type="range" 
                min="5" 
                max="50" 
                step="5"
                [value]="config.maxResults"
                (input)="onMaxResultsChange($event)"
                class="config-slider">
              <span class="config-value">{{ config.maxResults }}</span>
            </div>

            <div class="config-item">
              <label>Timeout Cache (min)</label>
              <input 
                type="range" 
                min="30" 
                max="480" 
                step="30"
                [value]="config.cacheTimeout"
                (input)="onCacheTimeoutChange($event)"
                class="config-slider">
              <span class="config-value">{{ config.cacheTimeout }}min</span>
            </div>

            <div class="config-item">
              <mat-slide-toggle 
                [checked]="config.enableAggression"
                (change)="updateConfig('enableAggression', $event.checked)">
                Modo Agressivo (Auto-otimização)
              </mat-slide-toggle>
            </div>
          </div>

          <mat-divider></mat-divider>

          <!-- Status Atual -->
          <div class="status-section">
            <h3>Status do Sistema</h3>
            <div class="status-info">
              <div class="status-item">
                <strong>Modo:</strong> {{ isAggressiveModeActive ? 'Agressivo' : 'Normal' }}
              </div>
              <div class="status-item">
                <strong>Cache:</strong> {{ cacheStats.totalSize }} entradas
              </div>
              <div class="status-item">
                <strong>Custo:</strong> \${{ metrics.costEstimate.toFixed(2) }}
              </div>
            </div>
          </div>

          <!-- Relatório de Otimização -->
          <div class="report-section" *ngIf="optimizationReport">
            <h3>Relatório de Otimização</h3>
            <p class="report-summary">{{ optimizationReport.summary }}</p>
            
            <div class="recommendations" *ngIf="optimizationReport.recommendations.length > 0">
              <h4>Recomendações:</h4>
              <ul>
                <li *ngFor="let recommendation of optimizationReport.recommendations">
                  {{ recommendation }}
                </li>
              </ul>
            </div>
          </div>
        </mat-card-content>

        <mat-card-actions>
          <button mat-raised-button color="primary" (click)="clearCache()">
            <mat-icon>refresh</mat-icon>
            Limpar Cache
          </button>
          
          <button mat-raised-button color="accent" (click)="resetMetrics()">
            <mat-icon>restore</mat-icon>
            Resetar Métricas
          </button>
          
          <button mat-button (click)="generateReport()">
            <mat-icon>assessment</mat-icon>
            Gerar Relatório
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .search-monitor {
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }

    .metrics-card {
      margin-bottom: 20px;
    }

    .summary-section {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 20px;
      margin-bottom: 20px;
    }

    .metric-item {
      text-align: center;
      padding: 15px;
      border-radius: 8px;
      background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
    }

    .metric-value {
      font-size: 2em;
      font-weight: bold;
      margin-bottom: 5px;
    }

    .metric-value.cache-hits {
      color: var(--success-color);
    }

    .metric-value.api-calls {
      color: var(--warning-color);
    }

    .metric-value.savings {
      color: var(--primary-color);
    }

    .metric-label {
      font-size: 0.9em;
      color: var(--text-secondary);
      font-weight: 500;
    }

    .cache-rate-section {
      margin: 20px 0;
    }

    .cache-rate-section h3 {
      margin-bottom: 10px;
      color: var(--primary-dark);
    }

    .cache-rate-description {
      margin-top: 10px;
      font-size: 0.9em;
      color: var(--text-secondary);
    }

    .optimization-config {
      margin: 20px 0;
    }

    .optimization-config h3 {
      margin-bottom: 20px;
      color: var(--primary-dark);
    }

    .config-item {
      display: flex;
      align-items: center;
      margin-bottom: 15px;
      gap: 15px;
    }

    .config-item label {
      min-width: 150px;
      font-weight: 500;
      color: var(--text-primary);
    }

    .config-item mat-slider {
      flex: 1;
    }

    .config-slider {
      flex: 1;
      margin: 0 10px;
    }

    .status-info {
      display: flex;
      gap: 20px;
      flex-wrap: wrap;
    }

    .status-item {
      padding: 10px 15px;
      background: var(--bg-card);
      border-radius: 6px;
      border-left: 3px solid var(--primary-color);
    }

    .config-value {
      min-width: 60px;
      text-align: right;
      font-weight: 500;
      color: var(--primary-color);
    }

    .status-section {
      margin: 20px 0;
    }

    .status-section h3 {
      margin-bottom: 15px;
      color: var(--primary-dark);
    }

    .status-chips {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .report-section {
      margin: 20px 0;
      padding: 15px;
      background: var(--bg-card);
      border-radius: 8px;
      border-left: 4px solid var(--primary-color);
    }

    .report-section h3 {
      margin-bottom: 10px;
      color: var(--primary-dark);
    }

    .report-summary {
      font-size: 1.1em;
      margin-bottom: 15px;
      color: var(--text-primary);
    }

    .recommendations h4 {
      margin-bottom: 10px;
      color: var(--primary-color);
    }

    .recommendations ul {
      margin: 0;
      padding-left: 20px;
    }

    .recommendations li {
      margin-bottom: 5px;
      color: var(--text-secondary);
    }

    mat-card-actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    @media (max-width: 768px) {
      .search-monitor {
        padding: 10px;
      }

      .summary-section {
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
      }

      .config-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
      }

      .config-item label {
        min-width: auto;
      }
    }
  `]
})
export class SearchMonitorComponent implements OnInit, OnDestroy {
  private searchOptimizer = inject(SearchOptimizerService);
  private cacheService = inject(CacheService);
  private googleMapsService = inject(GoogleMapsService);

  metrics: SearchMetrics = {
    totalSearches: 0,
    cacheHits: 0,
    apiCalls: 0,
    averageResponseTime: 0,
    costEstimate: 0
  };

  config: SearchOptimizationConfig = {
    debounceTime: 500,
    maxResults: 20,
    cacheTimeout: 120,
    enableAggression: true
  };

  cacheHitRate = 0;
  estimatedSavings = 0;
  isAggressiveModeActive = false;
  cacheStats = { totalSize: 0, memorySize: 0, localStorageKeys: 0 };
  optimizationReport: any = null;

  private subscriptions: Subscription[] = [];

  ngOnInit(): void {
    // Atualizar métricas a cada 5 segundos
    const metricsSubscription = interval(5000).subscribe(() => {
      this.updateMetrics();
    });

    // Escutar mudanças na configuração
    const configSubscription = this.searchOptimizer.getConfig().subscribe(config => {
      this.config = config;
      this.isAggressiveModeActive = this.searchOptimizer.shouldUseAggressiveMode();
    });

    // Escutar mudanças nas métricas
    const metricsObservable = this.searchOptimizer.getMetrics().subscribe(metrics => {
      this.metrics = metrics;
      this.cacheHitRate = this.searchOptimizer.getCacheHitRate();
      this.estimatedSavings = this.searchOptimizer.getEstimatedSavings();
    });

    this.subscriptions.push(metricsSubscription, configSubscription, metricsObservable);

    // Carregamento inicial
    this.updateMetrics();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  updateConfig(key: keyof SearchOptimizationConfig, value: any): void {
    this.searchOptimizer.setConfig({ [key]: value });
  }

  onDebounceChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.updateConfig('debounceTime', +target.value);
  }

  onMaxResultsChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.updateConfig('maxResults', +target.value);
  }

  onCacheTimeoutChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.updateConfig('cacheTimeout', +target.value);
  }

  updateMetrics(): void {
    this.cacheStats = this.cacheService.getStats();
    this.isAggressiveModeActive = this.searchOptimizer.shouldUseAggressiveMode();
  }

  getCacheRateColor(): 'primary' | 'accent' | 'warn' {
    if (this.cacheHitRate >= 70) return 'primary';
    if (this.cacheHitRate >= 40) return 'accent';
    return 'warn';
  }

  getCacheRateDescription(): string {
    if (this.cacheHitRate >= 70) {
      return 'Excelente! O cache está funcionando muito bem.';
    } else if (this.cacheHitRate >= 40) {
      return 'Bom. O cache está ajudando a reduzir custos.';
    } else {
      return 'Baixo. Considere ajustar as configurações de cache.';
    }
  }

  getCacheStatusColor(): 'primary' | 'accent' | 'warn' {
    if (this.cacheStats.totalSize > 50) return 'warn';
    if (this.cacheStats.totalSize > 20) return 'accent';
    return 'primary';
  }

  clearCache(): void {
    this.cacheService.clear();
    this.googleMapsService.clearSearchCache();
    this.updateMetrics();
  }

  resetMetrics(): void {
    this.searchOptimizer.resetMetrics();
    this.updateMetrics();
  }

  generateReport(): void {
    this.optimizationReport = this.searchOptimizer.generateOptimizationReport();
  }
}
