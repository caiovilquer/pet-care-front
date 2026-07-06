import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  ToastComponent,
  ToastData,
  ToastType
} from '../../shared/components/ui/toast.component';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly snackBar = inject(MatSnackBar);

  success(message: string, duration = 3000): void {
    this.show(message, 'success', duration);
  }

  error(message: string, duration = 4000): void {
    this.show(message, 'error', duration);
  }

  warning(message: string, duration = 4000): void {
    this.show(message, 'warning', duration);
  }

  info(message: string, duration = 4000): void {
    this.show(message, 'info', duration);
  }

  private show(message: string, type: ToastType, duration: number): void {
    this.snackBar.openFromComponent(ToastComponent, {
      data: { message, type } satisfies ToastData,
      duration,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: ['rp-toast-panel']
    });
  }
}
