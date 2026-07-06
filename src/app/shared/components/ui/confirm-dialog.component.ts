import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

/** Confirmação com tom de voz da marca — substitui confirm() nativo. */
@Component({
  selector: 'rp-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule, MatIconModule],
  template: `
    <div class="rp-confirm">
      <div class="blob" [class.danger]="data.danger">
        <mat-icon>{{ data.danger ? 'delete_outline' : 'help_outline' }}</mat-icon>
      </div>
      <h2 mat-dialog-title>{{ data.title }}</h2>
      <p>{{ data.message }}</p>
      <div class="actions">
        <button mat-button (click)="dialogRef.close(false)">
          {{ data.cancelLabel || 'Cancelar' }}
        </button>
        <button mat-flat-button [class.danger-btn]="data.danger"
                (click)="dialogRef.close(true)" cdkFocusInitial>
          {{ data.confirmLabel || 'Confirmar' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .rp-confirm {
      padding: var(--q-space-5) var(--q-space-5) var(--q-space-4);
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      max-width: 360px;
    }
    .blob {
      width: 64px;
      height: 64px;
      display: grid;
      place-items: center;
      border-radius: var(--q-organic-2);
      background: var(--q-green-50);
      color: var(--q-green-600);
      margin-bottom: var(--q-space-3);
    }
    .blob.danger { background: var(--q-error-bg); color: var(--q-error); }
    h2 {
      font-family: var(--q-font-display);
      font-size: 1.25rem;
      padding: 0;
      margin: 0 0 var(--q-space-2);
    }
    h2::before { display: none; }
    p { margin: 0; color: var(--q-text-2); font-size: 0.9063rem; }
    .actions {
      display: flex;
      gap: var(--q-space-2);
      margin-top: var(--q-space-5);
    }
    .danger-btn {
      --mdc-filled-button-container-color: var(--q-error);
      --mdc-filled-button-label-text-color: #fff;
    }
  `]
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {}
}
