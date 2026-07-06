import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material/snack-bar';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastData {
  message: string;
  type: ToastType;
}

const TOAST_ICONS: Record<ToastType, string> = {
  success: 'check_circle',
  error: 'error_outline',
  warning: 'warning_amber',
  info: 'info_outline'
};

@Component({
  selector: 'rp-toast',
  standalone: true,
  imports: [MatIconModule, MatButtonModule],
  template: `
    <div class="rp-toast" [class]="'rp-toast--' + data.type" role="status">
      <div class="rp-toast__icon" aria-hidden="true">
        <mat-icon>{{ icon }}</mat-icon>
      </div>
      <p class="rp-toast__message">{{ data.message }}</p>
      <button
        type="button"
        class="rp-toast__close"
        (click)="dismiss()"
        aria-label="Fechar notificação">
        <mat-icon>close</mat-icon>
      </button>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      background: transparent;
    }

    .rp-toast {
      display: flex;
      align-items: flex-start;
      gap: var(--q-space-3);
      padding: var(--q-space-3) var(--q-space-3) var(--q-space-3) var(--q-space-4);
      min-width: min(360px, calc(100vw - 32px));
      max-width: 420px;
      background: var(--q-surface);
      border: 1px solid var(--q-border);
      border-radius: var(--q-radius-md);
      box-shadow: var(--q-shadow-lg);
    }

    .rp-toast__icon {
      flex-shrink: 0;
      width: 32px;
      height: 32px;
      display: grid;
      place-items: center;
      border-radius: var(--q-radius-sm);
    }
    .rp-toast__icon mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .rp-toast--success .rp-toast__icon {
      background: var(--q-success-bg);
      color: var(--q-success);
    }
    .rp-toast--error .rp-toast__icon {
      background: var(--q-error-bg);
      color: var(--q-error);
    }
    .rp-toast--warning .rp-toast__icon {
      background: var(--q-warning-bg);
      color: var(--q-warning);
    }
    .rp-toast--info .rp-toast__icon {
      background: var(--q-info-bg);
      color: var(--q-info);
    }

    .rp-toast__message {
      flex: 1;
      margin: 6px 0 0;
      font-family: var(--q-font-body);
      font-size: 0.875rem;
      font-weight: 500;
      line-height: 1.45;
      color: var(--q-ink);
    }

    .rp-toast__close {
      flex-shrink: 0;
      display: grid;
      place-items: center;
      width: 32px;
      height: 32px;
      margin: 0;
      padding: 0;
      border: none;
      border-radius: var(--q-radius-sm);
      background: transparent;
      color: var(--q-text-3);
      cursor: pointer;
      transition: color 0.15s ease, background 0.15s ease;
    }
    .rp-toast__close:hover {
      color: var(--q-ink);
      background: var(--q-surface-2);
    }
    .rp-toast__close mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
  `]
})
export class ToastComponent {
  readonly icon: string;

  constructor(
    public snackBarRef: MatSnackBarRef<ToastComponent>,
    @Inject(MAT_SNACK_BAR_DATA) public data: ToastData
  ) {
    this.icon = TOAST_ICONS[data.type];
  }

  dismiss(): void {
    this.snackBarRef.dismiss();
  }
}
