import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PasswordResetService } from '../../core/services/password-reset.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="auth-container">
      <div class="auth-wrapper">
        <mat-card class="auth-card">
          <mat-card-content>
            <div class="auth-header">
              <mat-icon class="auth-icon">lock_reset</mat-icon>
              <h1>Esqueci minha senha</h1>
              <p class="auth-subtitle">
                Digite seu email para receber instruções de redefinição de senha
              </p>
            </div>

            <form [formGroup]="forgotForm" (ngSubmit)="onSubmit()" class="auth-form">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Email</mat-label>
                <input
                  matInput
                  type="email"
                  formControlName="email"
                  placeholder="seu@email.com"
                  autocomplete="email"
                >
                <mat-icon matSuffix>email</mat-icon>
                <mat-error *ngIf="forgotForm.get('email')?.hasError('required')">
                  Email é obrigatório
                </mat-error>
                <mat-error *ngIf="forgotForm.get('email')?.hasError('email')">
                  Digite um email válido
                </mat-error>
              </mat-form-field>

              <button
                mat-raised-button
                color="primary"
                type="submit"
                class="auth-button full-width"
                [disabled]="forgotForm.invalid || isLoading"
              >
                <mat-spinner *ngIf="isLoading" diameter="20"></mat-spinner>
                <span *ngIf="!isLoading">Enviar instruções</span>
              </button>

              <div class="auth-links">
                <a routerLink="/auth/login" mat-button>
                  <mat-icon>arrow_back</mat-icon>
                  Voltar ao login
                </a>
              </div>
            </form>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styleUrls: ['./auth-shared.css']
})
export class ForgotPasswordComponent {
  forgotForm: FormGroup;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private passwordResetService: PasswordResetService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit(): void {
    if (this.forgotForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading = true;
    const email = this.forgotForm.get('email')?.value;

    this.passwordResetService.requestPasswordReset(email).subscribe({
      next: () => {
        this.isLoading = false;
        this.snackBar.open(
          'Se este email estiver cadastrado, você receberá instruções para redefinir sua senha.',
          'Fechar',
          {
            duration: 6000,
            panelClass: ['success-snackbar']
          }
        );
        // Redireciona para login após 3 segundos
        setTimeout(() => {
          this.router.navigate(['/auth/login']);
        }, 3000);
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Erro ao solicitar reset de senha:', error);
        this.snackBar.open(
          'Se este email estiver cadastrado, você receberá instruções para redefinir sua senha.',
          'Fechar',
          {
            duration: 6000,
            panelClass: ['success-snackbar']
          }
        );
        // Por segurança, mostramos a mesma mensagem mesmo em caso de erro
      }
    });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.forgotForm.controls).forEach(key => {
      const control = this.forgotForm.get(key);
      control?.markAsTouched();
    });
  }
}
