import { Component, Input, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/**
 * Dica contextual dispensável — ensina um conceito da página na primeira visita.
 * Ao tocar em "Entendi", some e não volta (persistido por chave em localStorage).
 */
@Component({
  selector: 'rp-hint',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  template: `
    @if (visible) {
      <aside class="rp-hint" role="note">
        <span class="hint-icon"><mat-icon>{{ icon }}</mat-icon></span>
        <div class="hint-body"><ng-content></ng-content></div>
        <button mat-button type="button" (click)="dismiss()">Entendi</button>
      </aside>
    }
  `,
  styles: [`
    :host { display: block; }
    .rp-hint {
      display: flex;
      align-items: flex-start;
      gap: var(--q-space-3);
      padding: var(--q-space-3) var(--q-space-4);
      margin-bottom: var(--q-space-5);
      border: 1px solid color-mix(in srgb, var(--q-green-500) 28%, var(--q-border));
      border-radius: var(--q-radius-md);
      background: var(--q-green-50);
    }
    .hint-icon {
      width: 34px;
      height: 34px;
      flex: none;
      display: grid;
      place-items: center;
      border-radius: var(--q-organic-2);
      background: var(--q-green-100);
      color: var(--q-green-700);
    }
    .hint-icon mat-icon { font-size: 19px; width: 19px; height: 19px; }
    .hint-body {
      flex: 1;
      min-width: 0;
      align-self: center;
      color: var(--q-text-2);
      font-size: .85rem;
      line-height: 1.5;
    }
    .hint-body strong { color: var(--q-ink); }
    button { flex: none; align-self: center; }
    @media (max-width: 560px) {
      .rp-hint { flex-wrap: wrap; }
      button { margin-left: auto; }
    }
  `]
})
export class HintComponent implements OnInit {
  /** Identificador único da dica, ex.: "agenda-planos". */
  @Input({ required: true }) storageKey = '';
  @Input() icon = 'lightbulb';
  visible = false;

  ngOnInit(): void {
    try {
      this.visible = !localStorage.getItem(this.key);
    } catch {
      this.visible = true;
    }
  }

  dismiss(): void {
    this.visible = false;
    try {
      localStorage.setItem(this.key, '1');
    } catch { /* sem localStorage, a dica volta na próxima visita */ }
  }

  private get key(): string { return `rp.hint.${this.storageKey}`; }
}
