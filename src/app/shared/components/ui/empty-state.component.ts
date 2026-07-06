import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

/** Estado vazio com voz da marca: blob orgânico, título e ação projetada. */
@Component({
  selector: 'rp-empty-state',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="rp-empty">
      <div class="blob">
        <mat-icon>{{ icon }}</mat-icon>
      </div>
      <h3>{{ title }}</h3>
      @if (message) {
        <p>{{ message }}</p>
      }
      <div class="actions">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: [`
    .rp-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: var(--q-space-7) var(--q-space-5);
    }
    .blob {
      width: 88px;
      height: 88px;
      display: grid;
      place-items: center;
      background: var(--q-green-50);
      color: var(--q-green-600);
      border-radius: var(--q-organic-1);
      margin-bottom: var(--q-space-4);
    }
    .blob mat-icon { font-size: 36px; width: 36px; height: 36px; }
    h3 { margin: 0 0 var(--q-space-2); }
    p {
      margin: 0;
      color: var(--q-text-2);
      font-size: 0.9063rem;
      max-width: 42ch;
    }
    .actions { margin-top: var(--q-space-5); display: flex; gap: var(--q-space-2); }
    .actions:empty { margin-top: 0; }
  `]
})
export class EmptyStateComponent {
  @Input() icon = 'pets';
  @Input({ required: true }) title = '';
  @Input() message?: string;
}
