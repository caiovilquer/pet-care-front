import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, shareReplay } from 'rxjs/operators';

export interface SearchOptimizationConfig {
  debounceTime: number;
  maxResults: number;
  cacheTimeout: number;
  enableAggression: boolean;
}

export interface SearchMetrics {
  totalSearches: number;
  cacheHits: number;
  apiCalls: number;
  averageResponseTime: number;
  costEstimate: number;
}

@Injectable({
  providedIn: 'root'
})
export class SearchOptimizerService {
  private readonly DEFAULT_CONFIG: SearchOptimizationConfig = {
    debounceTime: 500, // AUMENTADO para reduzir chamadas
    maxResults: 10, // DRASTICAMENTE REDUZIDO de 20 para 10
    cacheTimeout: 4 * 60, // 4 horas
    enableAggression: true // ATIVO por padrão - modo ultra econômico
  };

  private config = new BehaviorSubject<SearchOptimizationConfig>(this.DEFAULT_CONFIG);
  private metrics = new BehaviorSubject<SearchMetrics>({
    totalSearches: 0,
    cacheHits: 0,
    apiCalls: 0,
    averageResponseTime: 0,
    costEstimate: 0
  });

  private searchTimes: number[] = [];
  private readonly MAX_SEARCH_TIMES = 100;

  // Custos estimados por tipo de operação (em centavos de dólar)
  private readonly API_COSTS = {
    geocoding: 0.5,
    places_search: 1.7,
    place_details: 1.7,
    distance_matrix: 1.0,
    photos: 0.7
  };

  constructor() {
    // Carregar configuração salva
    this.loadConfig();
  }

  /**
   * Configurar otimizações
   */
  setConfig(config: Partial<SearchOptimizationConfig>): void {
    const newConfig = { ...this.config.value, ...config };
    this.config.next(newConfig);
    this.saveConfig(newConfig);
  }

  /**
   * Obter configuração atual
   */
  getConfig(): Observable<SearchOptimizationConfig> {
    return this.config.asObservable();
  }

  getCurrentConfig(): SearchOptimizationConfig {
    return this.config.value;
  }

  /**
   * Registrar uma busca realizada
   */
  recordSearch(type: 'api' | 'cache', responseTime: number, apiCall: keyof typeof SearchOptimizerService.prototype.API_COSTS): void {
    const currentMetrics = this.metrics.value;
    
    // Registrar tempo de resposta
    this.searchTimes.push(responseTime);
    if (this.searchTimes.length > this.MAX_SEARCH_TIMES) {
      this.searchTimes.shift();
    }

    const newMetrics: SearchMetrics = {
      totalSearches: currentMetrics.totalSearches + 1,
      cacheHits: type === 'cache' ? currentMetrics.cacheHits + 1 : currentMetrics.cacheHits,
      apiCalls: type === 'api' ? currentMetrics.apiCalls + 1 : currentMetrics.apiCalls,
      averageResponseTime: this.searchTimes.reduce((sum, time) => sum + time, 0) / this.searchTimes.length,
      costEstimate: currentMetrics.costEstimate + (type === 'api' ? this.API_COSTS[apiCall] : 0)
    };

    this.metrics.next(newMetrics);
    this.saveMetrics(newMetrics);
  }

  /**
   * Obter métricas atuais
   */
  getMetrics(): Observable<SearchMetrics> {
    return this.metrics.asObservable();
  }

  /**
   * Resetar métricas
   */
  resetMetrics(): void {
    const resetMetrics: SearchMetrics = {
      totalSearches: 0,
      cacheHits: 0,
      apiCalls: 0,
      averageResponseTime: 0,
      costEstimate: 0
    };
    
    this.metrics.next(resetMetrics);
    this.searchTimes = [];
    this.saveMetrics(resetMetrics);
  }

  /**
   * Calcular taxa de cache hit
   */
  getCacheHitRate(): number {
    const current = this.metrics.value;
    return current.totalSearches > 0 ? (current.cacheHits / current.totalSearches) * 100 : 0;
  }

  /**
   * Obter economia estimada do cache
   */
  getEstimatedSavings(): number {
    const current = this.metrics.value;
    const potentialCost = current.totalSearches * 1.5; // Custo médio por busca
    return Math.max(0, potentialCost - current.costEstimate);
  }

  /**
   * Criar debounce subject personalizado
   */
  createDebouncedSubject<T>(): { subject: Subject<T>; observable: Observable<T> } {
    const subject = new Subject<T>();
    const observable = subject.pipe(
      debounceTime(this.config.value.debounceTime),
      distinctUntilChanged(),
      shareReplay(1)
    );

    return { subject, observable };
  }

  /**
   * Determinar se deve fazer busca agressiva (menos resultados, mais cache)
   */
  shouldUseAggressiveMode(): boolean {
    const current = this.metrics.value;
    const config = this.config.value;
    
    if (!config.enableAggression) return false;
    
    // Ativar modo agressivo se:
    // - Muitas chamadas API foram feitas
    // - Custo está alto
    // - Taxa de cache hit está baixa
    return current.apiCalls > 50 || 
           current.costEstimate > 10 || 
           this.getCacheHitRate() < 30;
  }

  /**
   * Obter número máximo de resultados baseado na situação atual
   */
  getOptimalMaxResults(): number {
    const config = this.config.value;
    
    if (this.shouldUseAggressiveMode()) {
      return Math.min(10, config.maxResults);
    }
    
    return config.maxResults;
  }

  /**
   * Obter timeout de cache otimizado
   */
  getOptimalCacheTimeout(): number {
    const config = this.config.value;
    
    if (this.shouldUseAggressiveMode()) {
      return config.cacheTimeout * 2; // Cache por mais tempo em modo agressivo
    }
    
    return config.cacheTimeout;
  }

  /**
   * Gerar relatório de otimização
   */
  generateOptimizationReport(): {
    summary: string;
    recommendations: string[];
    metrics: SearchMetrics;
    savings: number;
    hitRate: number;
  } {
    const metrics = this.metrics.value;
    const hitRate = this.getCacheHitRate();
    const savings = this.getEstimatedSavings();

    let summary = `${metrics.totalSearches} buscas realizadas, `;
    summary += `${metrics.cacheHits} do cache (${hitRate.toFixed(1)}%), `;
    summary += `economia estimada: $${savings.toFixed(2)}`;

    const recommendations: string[] = [];

    if (hitRate < 40) {
      recommendations.push('Aumentar tempo de cache para melhorar taxa de acerto');
    }

    if (metrics.costEstimate > 20) {
      recommendations.push('Ativar modo agressivo para reduzir custos');
    }

    if (metrics.averageResponseTime > 2000) {
      recommendations.push('Otimizar número máximo de resultados');
    }

    if (metrics.apiCalls > 100) {
      recommendations.push('Implementar cache mais agressivo');
    }

    return {
      summary,
      recommendations,
      metrics,
      savings,
      hitRate
    };
  }

  private saveConfig(config: SearchOptimizationConfig): void {
    try {
      localStorage.setItem('search_optimizer_config', JSON.stringify(config));
    } catch (error) {
      console.warn('Não foi possível salvar configuração:', error);
    }
  }

  private loadConfig(): void {
    try {
      const saved = localStorage.getItem('search_optimizer_config');
      if (saved) {
        const config = JSON.parse(saved);
        this.config.next({ ...this.DEFAULT_CONFIG, ...config });
      }
    } catch (error) {
      console.warn('Não foi possível carregar configuração:', error);
    }
  }

  private saveMetrics(metrics: SearchMetrics): void {
    try {
      localStorage.setItem('search_optimizer_metrics', JSON.stringify(metrics));
    } catch (error) {
      console.warn('Não foi possível salvar métricas:', error);
    }
  }

  private loadMetrics(): void {
    try {
      const saved = localStorage.getItem('search_optimizer_metrics');
      if (saved) {
        const metrics = JSON.parse(saved);
        this.metrics.next(metrics);
      }
    } catch (error) {
      console.warn('Não foi possível carregar métricas:', error);
    }
  }
}
