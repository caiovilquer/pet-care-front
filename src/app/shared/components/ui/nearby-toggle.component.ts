import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

/** Alternador Petshops ↔ Veterinários das telas "Por perto". */
@Component({
  selector: 'rp-nearby-toggle',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule],
  template: `
    <nav class="rp-toggle" aria-label="Tipo de local">
      <a routerLink="/petshops" [class.on]="active === 'petshops'">
        <mat-icon>storefront</mat-icon>
        Petshops
      </a>
      <a routerLink="/veterinaries" [class.on]="active === 'veterinaries'">
        <mat-icon>medical_services</mat-icon>
        Veterinários
      </a>
    </nav>
  `,
  styles: [`
    .rp-toggle {
      display: inline-flex;
      gap: 4px;
      padding: 4px;
      background: var(--q-surface-2);
      border: 1px solid var(--q-border);
      border-radius: var(--q-radius-pill);
    }
    .rp-toggle a {
      min-height: 44px;
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 0 16px;
      border-radius: var(--q-radius-pill);
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--q-text-2);
      text-decoration: none;
      transition: background 0.15s ease, color 0.15s ease;
    }
    .rp-toggle a mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
    .rp-toggle a:hover:not(.on) { color: var(--q-ink); }
    .rp-toggle a.on {
      background: var(--q-surface);
      color: var(--q-green-600);
      box-shadow: var(--q-shadow-sm);
    }
    @media (max-width: 480px) {
      .rp-toggle { width: 100%; }
      .rp-toggle a { flex: 1; justify-content: center; padding: 0 10px; font-size: 0.8125rem; }
    }
  `]
})
export class NearbyToggleComponent {
  @Input({ required: true }) active: 'petshops' | 'veterinaries' = 'petshops';
}
