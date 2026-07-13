import { Component, Input, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/**
 * Dica contextual — ensina um conceito da página na primeira visita.
 * "Entendi" não apaga a dica: ela recolhe para uma pílula ("Como funciona?")
 * que a reabre a qualquer momento. O estado persiste em localStorage.
 */
@Component({
  selector: 'rp-hint',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  template: `
    @if (!collapsed) {
      <aside class="rp-hint" role="note">
        <span class="hint-icon"><mat-icon>{{ icon }}</mat-icon></span>
        <div class="hint-body"><ng-content></ng-content></div>
        <button mat-button type="button" (click)="dismiss()">Entendi</button>
      </aside>
    } @else {
      <button type="button" class="rp-hint-pill" (click)="expand()">
        <mat-icon>help_outline</mat-icon>{{ collapsedLabel }}
      </button>
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
    .rp-hint button { flex: none; align-self: center; }
    .rp-hint-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin-bottom: var(--q-space-4);
      padding: 6px 14px 6px 10px;
      border: 1px solid var(--q-border);
      border-radius: var(--q-radius-pill);
      background: var(--q-surface);
      color: var(--q-text-2);
      font: 650 .8rem var(--q-font-body);
      cursor: pointer;
      transition: color .15s ease, border-color .15s ease;
    }
    .rp-hint-pill:hover {
      color: var(--q-green-700);
      border-color: var(--q-border-2);
    }
    .rp-hint-pill mat-icon {
      width: 17px;
      height: 17px;
      font-size: 17px;
      color: var(--q-green-600);
    }
    @media (max-width: 560px) {
      .rp-hint { flex-wrap: wrap; }
      .rp-hint button { margin-left: auto; }
    }
  `]
})
export class HintComponent implements OnInit {
  /** Identificador único da dica, ex.: "agenda-planos". */
  @Input({ required: true }) storageKey = '';
  @Input() icon = 'lightbulb';
  /** Texto da pílula que reabre a dica depois de recolhida. */
  @Input() collapsedLabel = 'Como funciona?';
  collapsed = false;

  ngOnInit(): void {
    try {
      this.collapsed = !!localStorage.getItem(this.key);
    } catch {
      this.collapsed = false;
    }
  }

  dismiss(): void {
    this.collapsed = true;
    try {
      localStorage.setItem(this.key, '1');
    } catch { /* sem localStorage, a dica volta expandida na próxima visita */ }
  }

  expand(): void {
    this.collapsed = false;
    try {
      localStorage.removeItem(this.key);
    } catch { /* sem localStorage, nada a limpar */ }
  }

  private get key(): string { return `rp.hint.${this.storageKey}`; }
}
