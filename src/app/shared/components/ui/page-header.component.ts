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
      gap: var(--q-space-4);
      flex-wrap: wrap;
      margin-bottom: var(--q-space-5);
    }
    .q-overline { margin-bottom: var(--q-space-2); }
    h1 { margin: 0; }
    .subtitle {
      margin: var(--q-space-1) 0 0;
      color: var(--q-text-2);
      font-size: 0.9375rem;
      max-width: 60ch;
    }
    .actions {
      display: flex;
      align-items: center;
      gap: var(--q-space-2);
      flex-wrap: wrap;
    }
  `]
})
export class PageHeaderComponent {
  @Input() overline?: string;
  @Input({ required: true }) title = '';
  @Input() subtitle?: string;
}
