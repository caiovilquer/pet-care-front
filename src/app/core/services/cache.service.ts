import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export interface CacheConfig {
  ttl: number; // Time to live em minutos
  maxSize: number; // Máximo de entradas no cache
}

@Injectable({
  providedIn: 'root'
})
export class CacheService {
  private memoryCache = new Map<string, CacheEntry<any>>();
  
  private readonly DEFAULT_CONFIG: CacheConfig = {
    ttl: 60, // 1 hora por padrão
    maxSize: 100
  };

  constructor() {
    // Limpar cache expirado a cada 10 minutos
    setInterval(() => {
      this.cleanExpiredEntries();
    }, 10 * 60 * 1000);
  }

  /**
   * Armazena dados no cache em memória
   */
  setMemoryCache<T>(key: string, data: T, config: Partial<CacheConfig> = {}): void {
    const fullConfig = { ...this.DEFAULT_CONFIG, ...config };
    const now = Date.now();
    
    // Verificar se o cache está cheio
    if (this.memoryCache.size >= fullConfig.maxSize) {
      this.removeOldestEntry();
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt: now + (fullConfig.ttl * 60 * 1000)
    };

    this.memoryCache.set(key, entry);
  }

  /**
   * Recupera dados do cache em memória
   */
  getMemoryCache<T>(key: string): T | null {
    const entry = this.memoryCache.get(key);
    
    if (!entry) {
      return null;
    }

    // Verificar se expirou
    if (Date.now() > entry.expiresAt) {
      this.memoryCache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Armazena dados no localStorage com expiração
   */
  setLocalStorage<T>(key: string, data: T, config: Partial<CacheConfig> = {}): void {
    const fullConfig = { ...this.DEFAULT_CONFIG, ...config };
    const now = Date.now();
    
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt: now + (fullConfig.ttl * 60 * 1000)
    };

    try {
      localStorage.setItem(`cache_${key}`, JSON.stringify(entry));
    } catch (error) {
      console.warn('Erro ao salvar no localStorage:', error);
      // Se não conseguir salvar no localStorage, salva na memória
      this.setMemoryCache(key, data, config);
    }
  }

  /**
   * Recupera dados do localStorage
   */
  getLocalStorage<T>(key: string): T | null {
    try {
      const stored = localStorage.getItem(`cache_${key}`);
      
      if (!stored) {
        return null;
      }

      const entry: CacheEntry<T> = JSON.parse(stored);
      
      // Verificar se expirou
      if (Date.now() > entry.expiresAt) {
        localStorage.removeItem(`cache_${key}`);
        return null;
      }

      return entry.data;
    } catch (error) {
      console.warn('Erro ao recuperar do localStorage:', error);
      return null;
    }
  }

  /**
   * Remove entrada específica do cache
   */
  remove(key: string): void {
    this.memoryCache.delete(key);
    localStorage.removeItem(`cache_${key}`);
  }

  /**
   * Limpa todo o cache
   */
  clear(): void {
    this.memoryCache.clear();
    
    // Remover entradas do localStorage que começam com 'cache_'
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('cache_')) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  /**
   * Gera uma chave de cache baseada em parâmetros
   */
  generateKey(prefix: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        result[key] = params[key];
        return result;
      }, {} as Record<string, any>);

    const paramString = JSON.stringify(sortedParams);
    return `${prefix}_${this.hashCode(paramString)}`;
  }

  /**
   * Verifica se os dados estão em cache (memória ou localStorage)
   */
  getFromCache<T>(key: string): T | null {
    // Primeiro tenta memória (mais rápido)
    let data = this.getMemoryCache<T>(key);
    
    if (data !== null) {
      return data;
    }

    // Se não encontrou na memória, tenta localStorage
    data = this.getLocalStorage<T>(key);
    
    if (data !== null) {
      // Se encontrou no localStorage, coloca na memória para próximas consultas
      this.setMemoryCache(key, data, { ttl: 30 }); // 30 minutos na memória
      return data;
    }

    return null;
  }

  /**
   * Armazena dados preferencialmente no localStorage, com fallback para memória
   */
  setCache<T>(key: string, data: T, config: Partial<CacheConfig> = {}): void {
    this.setLocalStorage(key, data, config);
    this.setMemoryCache(key, data, { ...config, ttl: Math.min(config.ttl || 60, 30) });
  }

  /**
   * Wrapper para operações com cache
   */
  getOrSet<T>(
    key: string,
    dataProvider: () => Observable<T>,
    config: Partial<CacheConfig> = {}
  ): Observable<T> {
    const cached = this.getFromCache<T>(key);
    
    if (cached !== null) {
      return of(cached);
    }

    return new Observable<T>(observer => {
      dataProvider().subscribe({
        next: (data) => {
          this.setCache(key, data, config);
          observer.next(data);
        },
        error: (error) => observer.error(error),
        complete: () => observer.complete()
      });
    });
  }

  private cleanExpiredEntries(): void {
    const now = Date.now();
    
    // Limpar cache em memória
    for (const [key, entry] of this.memoryCache.entries()) {
      if (now > entry.expiresAt) {
        this.memoryCache.delete(key);
      }
    }

    // Limpar localStorage
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('cache_')) {
        try {
          const stored = localStorage.getItem(key);
          if (stored) {
            const entry: CacheEntry<any> = JSON.parse(stored);
            if (now > entry.expiresAt) {
              keysToRemove.push(key);
            }
          }
        } catch {
          // Se não conseguir parsear, remove
          keysToRemove.push(key);
        }
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  private removeOldestEntry(): void {
    let oldestKey = '';
    let oldestTimestamp = Date.now();

    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.memoryCache.delete(oldestKey);
    }
  }

  private hashCode(str: string): string {
    let hash = 0;
    if (str.length === 0) return hash.toString();
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
  }

  /**
   * Obtém estatísticas do cache
   */
  getStats(): {
    memorySize: number;
    localStorageKeys: number;
    totalSize: number;
  } {
    let localStorageKeys = 0;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('cache_')) {
        localStorageKeys++;
      }
    }

    return {
      memorySize: this.memoryCache.size,
      localStorageKeys,
      totalSize: this.memoryCache.size + localStorageKeys
    };
  }
}
