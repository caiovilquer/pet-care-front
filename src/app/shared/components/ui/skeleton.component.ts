import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/** Skeleton shimmer nas formas reais do conteúdo — substitui spinner + texto. */
@Component({
  selector: 'rp-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    @switch (variant) {
      @case ('cards') {
        <div class="grid">
          @for (i of items; track i) {
            <div class="card">
              <div class="sk blob"></div>
              <div class="lines">
                <div class="sk line w60"></div>
                <div class="sk line w80"></div>
              </div>
            </div>
          }
        </div>
      }
      @case ('list') {
        <div class="list">
          @for (i of items; track i) {
            <div class="row">
              <div class="sk square"></div>
              <div class="lines">
                <div class="sk line w40"></div>
                <div class="sk line w70"></div>
              </div>
            </div>
          }
        </div>
      }
      @case ('stats') {
        <div class="grid stats">
          @for (i of [1, 2, 3]; track i) {
            <div class="card col">
              <div class="sk line big w30"></div>
              <div class="sk line w70"></div>
            </div>
          }
        </div>
      }
      @case ('detail') {
        <div class="detail">
          <div class="sk blob xl"></div>
          <div class="lines">
            <div class="sk line big w40"></div>
            <div class="sk line w60"></div>
            <div class="sk line w50"></div>
          </div>
        </div>
      }
    }
  `,
  styles: [`
    :host { display: block; }
    .sk {
      background: linear-gradient(90deg,
        var(--q-surface-2) 25%, var(--q-surface-3) 50%, var(--q-surface-2) 75%);
      background-size: 200% 100%;
      animation: rp-shimmer 1.4s infinite;
    }
    @keyframes rp-shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: var(--q-space-4);
    }
    .grid.stats { grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); }
    .card, .row {
      background: var(--q-surface);
      border: 1px solid var(--q-border);
      border-radius: var(--q-radius-md);
      padding: var(--q-space-4);
      display: flex;
      gap: var(--q-space-4);
      align-items: center;
    }
    .card.col { flex-direction: column; align-items: flex-start; gap: var(--q-space-2); }
    .list { display: grid; gap: var(--q-space-3); }
    .detail { display: flex; gap: var(--q-space-5); align-items: center; }
    .lines { flex: 1; display: grid; gap: 10px; }
    .blob { width: 64px; height: 64px; border-radius: var(--q-organic-1); flex-shrink: 0; }
    .blob.xl { width: 112px; height: 112px; }
    .square { width: 40px; height: 40px; border-radius: var(--q-radius-sm); flex-shrink: 0; }
    .line { height: 12px; border-radius: 6px; }
    .line.big { height: 22px; }
    .w30 { width: 30%; } .w40 { width: 40%; } .w50 { width: 50%; }
    .w60 { width: 60%; } .w70 { width: 70%; } .w80 { width: 80%; }
    @media (prefers-reduced-motion: reduce) {
      .sk { animation: none; background: var(--q-surface-2); }
    }
  `]
})
export class SkeletonComponent {
  @Input() variant: 'cards' | 'list' | 'stats' | 'detail' = 'list';
  @Input() count = 4;

  get items(): number[] {
    return Array.from({ length: this.count }, (_, i) => i);
  }
}
