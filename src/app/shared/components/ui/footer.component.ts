import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

/** Rodapé padrão do app: logo, atalho de tema, copyright e créditos — o mesmo usado no fechamento da landing page. */
@Component({
  selector: 'rp-footer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <footer class="rp-footer">
      <div class="rp-footer-main">
        <img class="rp-footer-wordmark"
             [src]="isDark ? 'logo-horizontal-reverso.svg' : 'logo-horizontal.svg'"
             alt="RotinaPet">
        <button class="rp-footer-theme-toggle" type="button" (click)="themeToggle.emit()">
          {{ isDark ? 'Modo claro' : 'Modo escuro' }}
        </button>
      </div>
      <div class="rp-footer-meta">
        <span class="rp-footer-legal">© {{ currentYear }} RotinaPet</span>
        <p class="rp-footer-credits">
          Desenvolvido por
          <a
            class="rp-footer-credit-link"
            href="https://www.linkedin.com/in/caio-vilquer/"
            target="_blank"
            rel="noopener noreferrer"
          >Caio Vilquer Carvalho</a>
          <span class="rp-footer-credits-sep" aria-hidden="true">·</span>
          <a
            class="rp-footer-credit-link"
            href="https://vilquer.dev"
            target="_blank"
            rel="noopener noreferrer"
          >Portfólio</a>
        </p>
      </div>
    </footer>
  `,
  styles: [`
    .rp-footer {
      margin-top: var(--q-space-7);
      padding-top: var(--q-space-5);
      border-top: 1px solid var(--q-border);
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--q-space-4);
    }

    .rp-footer-main {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--q-space-4);
      flex-wrap: wrap;
    }

    .rp-footer-wordmark { height: 20px; width: auto; }

    .rp-footer-theme-toggle {
      background: none;
      border: 1px solid var(--q-border);
      color: var(--q-text-2);
      border-radius: var(--q-radius-pill);
      padding: 6px 16px;
      font-size: 0.8125rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s ease, color 0.15s ease;
    }
    .rp-footer-theme-toggle:hover {
      background: var(--q-surface-2);
      color: var(--q-ink);
    }

    .rp-footer-meta {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      text-align: center;
    }

    .rp-footer-legal {
      font-size: 0.8125rem;
      color: var(--q-text-2);
    }

    .rp-footer-credits {
      margin: 0;
      font-size: 0.75rem;
      color: var(--q-text-3);
    }

    .rp-footer-credit-link {
      color: var(--q-text-2);
      font-weight: 600;
      text-decoration: underline;
      text-decoration-color: var(--q-border);
      text-underline-offset: 3px;
      transition: color 0.15s ease, text-decoration-color 0.15s ease;
    }
    .rp-footer-credit-link:hover {
      color: var(--q-green-600);
      text-decoration-color: var(--q-green-600);
    }
    .rp-footer-credit-link:focus-visible {
      outline: 2px solid var(--q-green-600);
      outline-offset: 2px;
      border-radius: 2px;
    }

    .rp-footer-credits-sep {
      margin: 0 0.35em;
      opacity: 0.5;
    }

    @media (max-width: 640px) {
      .rp-footer-main { justify-content: center; text-align: center; }
    }
  `]
})
export class FooterComponent {
  @Input() isDark = false;
  @Output() themeToggle = new EventEmitter<void>();

  currentYear = new Date().getFullYear();
}
