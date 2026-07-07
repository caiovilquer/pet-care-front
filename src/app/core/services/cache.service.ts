import { Injectable } from '@angular/core';
import { Observable, shareReplay, tap } from 'rxjs';

interface CacheEntry<T> {
  observable: Observable<T>;
  expiresAt: number;
}

/**
 * Cache genérico em memória para observables (tipicamente respostas HTTP).
 *
 * - `get()` retorna o observable em cache enquanto ele estiver dentro do TTL;
 *   fora do TTL (ou sem entrada), chama `factory()` e cacheia o resultado.
 * - Chamadas concorrentes para a mesma chave compartilham a mesma requisição
 *   em andamento (shareReplay), evitando disparos duplicados.
 * - Em caso de erro, a entrada é removida para que a próxima chamada tente
 *   uma nova requisição em vez de repetir o erro cacheado até o TTL expirar.
 */
@Injectable({
  providedIn: 'root'
})
export class CacheService {
  private readonly entries = new Map<string, CacheEntry<any>>();

  get<T>(key: string, factory: () => Observable<T>, ttlMs: number): Observable<T> {
    const cached = this.entries.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.observable;
    }

    const observable = factory().pipe(
      tap({ error: () => this.entries.delete(key) }),
      shareReplay({ bufferSize: 1, refCount: false })
    );
    this.entries.set(key, { observable, expiresAt: Date.now() + ttlMs });
    return observable;
  }

  invalidate(key: string): void {
    this.entries.delete(key);
  }

  invalidatePrefix(prefix: string): void {
    for (const key of this.entries.keys()) {
      if (key.startsWith(prefix)) {
        this.entries.delete(key);
      }
    }
  }

  invalidateAll(): void {
    this.entries.clear();
  }
}
