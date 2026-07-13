import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/** Cabeçalho padrão de página: overline com traço de ipê, título e ações. */
@Component({
  selector: 'rp-page-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="rp-page-header">
      <div class="titles">
        @if (overline) {
          <p class="q-overline">{{ overline }}</p>
        }
        <h1>{{ title }}</h1>
        @if (subtitle) {
          <p class="subtitle">{{ subtitle }}</p>
        }
      </div>
      <div class="actions">
        <ng-content></ng-content>
      </div>
    </header>
  `,
  styles: [`
    .rp-page-header {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: var(--q-space-5);
      flex-wrap: wrap;
      margin: var(--q-space-2) 0 var(--q-space-6);
    }
    .titles { min-width: 0; }
    .q-overline { margin-bottom: 10px; }
    h1 { margin: 0; font-size: clamp(2.2rem, 5vw, 3.75rem); line-height: 1; letter-spacing: -.04em; }
    .subtitle {
      margin: var(--q-space-3) 0 0;
      color: var(--q-text-2);
      font-size: 0.95rem;
      max-width: 62ch;
    }
    .actions {
      display: flex;
      align-items: center;
      gap: var(--q-space-2);
      flex-wrap: wrap;
    }
    @media (max-width: 600px) {
      .rp-page-header { align-items: flex-start; flex-direction: column; margin-bottom: var(--q-space-5); }
      .actions, .actions > * { width: 100%; }
    }
  `]
})
export class PageHeaderComponent {
  @Input() overline?: string;
  @Input({ required: true }) title = '';
  @Input() subtitle?: string;
}
