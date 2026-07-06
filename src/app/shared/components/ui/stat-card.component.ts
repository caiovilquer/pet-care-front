import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

/** Número grande + rótulo + link — dashboard e perfil. */
@Component({
  selector: 'rp-stat-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="rp-stat" [class.accent]="accent">
      <span class="value">{{ value }}</span>
      <span class="label">{{ label }}</span>
      @if (link && linkLabel) {
        <a [routerLink]="link" class="link">{{ linkLabel }}</a>
      }
    </div>
  `,
  styles: [`
    .rp-stat {
      background: var(--q-surface);
      border: 1px solid var(--q-border);
      border-radius: var(--q-radius-md);
      padding: var(--q-space-4) var(--q-space-5);
      display: flex;
      flex-direction: column;
      height: 100%;
      box-shadow: var(--q-shadow-sm);
    }
    .rp-stat.accent { border-top: 3px solid var(--q-ipe-500); }
    .value {
      font-family: var(--q-font-display);
      font-weight: 700;
      font-size: 2rem;
      line-height: 1.1;
      color: var(--q-green-600);
      font-variant-numeric: tabular-nums;
    }
    .label {
      color: var(--q-text-2);
      font-size: 0.8438rem;
      margin-top: 2px;
    }
    .link {
      margin-top: var(--q-space-3);
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--q-green-600);
      text-decoration: none;
    }
    .link:hover { text-decoration: underline; }
  `]
})
export class StatCardComponent {
  @Input({ required: true }) value: string | number = 0;
  @Input({ required: true }) label = '';
  @Input() link?: string;
  @Input() linkLabel?: string;
  /** Destaque com fio de ipê no topo (ex.: cuidados próximos) */
  @Input() accent = false;
}
