import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
  selector: 'app-reset-password',
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
              <h1>Redefinir senha</h1>
              <p class="auth-subtitle" *ngIf="!tokenValidated">
                Validando token...
              </p>
              <p class="auth-subtitle" *ngIf="tokenValidated && !invalidToken">
                Digite sua nova senha
              </p>
              <p class="auth-subtitle error" *ngIf="invalidToken">
                Token inválido ou expirado
              </p>
            </div>

            <div *ngIf="isValidating" class="loading-container">
              <mat-spinner diameter="40"></mat-spinner>
              <p>Validando token...</p>
            </div>

            <div *ngIf="invalidToken" class="error-container">
              <mat-icon class="error-icon">error_outline</mat-icon>
              <p>O link de redefinição de senha é inválido ou já expirou.</p>
              <button mat-raised-button color="primary" routerLink="/auth/forgot-password">
                Solicitar novo link
              </button>
            </div>

            <form 
              *ngIf="tokenValidated && !invalidToken" 
              [formGroup]="resetForm" 
              (ngSubmit)="onSubmit()" 
              class="auth-form"
            >
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Nova senha</mat-label>
                <input
                  matInput
                  [type]="hidePassword ? 'password' : 'text'"
                  formControlName="password"
                  placeholder="Digite sua nova senha"
                  autocomplete="new-password"
                >
                <button
                  mat-icon-button
                  matSuffix
                  type="button"
                  (click)="hidePassword = !hidePassword"
                  [attr.aria-label]="'Hide password'"
                  [attr.aria-pressed]="hidePassword"
                >
                  <mat-icon>{{hidePassword ? 'visibility_off' : 'visibility'}}</mat-icon>
                </button>
                <mat-error *ngIf="resetForm.get('password')?.hasError('required')">
                  Senha é obrigatória
                </mat-error>
                <mat-error *ngIf="resetForm.get('password')?.hasError('minlength')">
                  Senha deve ter pelo menos 6 caracteres
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Confirmar nova senha</mat-label>
                <input
                  matInput
                  [type]="hideConfirmPassword ? 'password' : 'text'"
                  formControlName="confirmPassword"
                  placeholder="Confirme sua nova senha"
                  autocomplete="new-password"
                >
                <button
                  mat-icon-button
                  matSuffix
                  type="button"
                  (click)="hideConfirmPassword = !hideConfirmPassword"
                  [attr.aria-label]="'Hide password'"
                  [attr.aria-pressed]="hideConfirmPassword"
                >
                  <mat-icon>{{hideConfirmPassword ? 'visibility_off' : 'visibility'}}</mat-icon>
                </button>
                <mat-error *ngIf="resetForm.get('confirmPassword')?.hasError('required')">
                  Confirmação de senha é obrigatória
                </mat-error>
                <mat-error *ngIf="resetForm.hasError('passwordsMismatch') && resetForm.get('confirmPassword')?.touched">
                  As senhas não coincidem
                </mat-error>
              </mat-form-field>

              <button
                mat-raised-button
                color="primary"
                type="submit"
                class="auth-button full-width"
                [disabled]="resetForm.invalid || isLoading"
              >
                <mat-spinner *ngIf="isLoading" diameter="20"></mat-spinner>
                <span *ngIf="!isLoading">Redefinir senha</span>
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
export class ResetPasswordComponent implements OnInit {
  resetForm: FormGroup;
  isLoading = false;
  isValidating = true;
  tokenValidated = false;
  invalidToken = false;
  hidePassword = true;
  hideConfirmPassword = true;
  private token: string | null = null;

  constructor(
    private fb: FormBuilder,
    private passwordResetService: PasswordResetService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.resetForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordsMatchValidator });
  }

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParams['token'];
    
    if (!this.token) {
      this.invalidToken = true;
      this.isValidating = false;
      return;
    }

    this.validateToken();
  }

  private validateToken(): void {
    if (!this.token) return;

    this.passwordResetService.validateResetToken(this.token).subscribe({
      next: () => {
        this.isValidating = false;
        this.tokenValidated = true;
        this.invalidToken = false;
      },
      error: (error) => {
        console.error('Token inválido:', error);
        this.isValidating = false;
        this.tokenValidated = false;
        this.invalidToken = true;
      }
    });
  }

  onSubmit(): void {
    if (this.resetForm.invalid || !this.token) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading = true;
    const password = this.resetForm.get('password')?.value;

    this.passwordResetService.resetPassword(this.token, password).subscribe({
      next: () => {
        this.isLoading = false;
        this.snackBar.open(
          'Senha redefinida com sucesso! Redirecionando para o login...',
          'Fechar',
          {
            duration: 4000,
            panelClass: ['success-snackbar']
          }
        );
        
        setTimeout(() => {
          this.router.navigate(['/auth/login']);
        }, 2000);
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Erro ao redefinir senha:', error);
        
        if (error.status === 400) {
          this.snackBar.open(
            'Token inválido ou expirado. Solicite um novo link de redefinição.',
            'Fechar',
            {
              duration: 5000,
              panelClass: ['error-snackbar']
            }
          );
          this.invalidToken = true;
        } else {
          this.snackBar.open(
            'Erro ao redefinir senha. Tente novamente.',
            'Fechar',
            {
              duration: 4000,
              panelClass: ['error-snackbar']
            }
          );
        }
      }
    });
  }

  private passwordsMatchValidator(group: FormGroup) {
    const password = group.get('password');
    const confirmPassword = group.get('confirmPassword');
    
    if (!password || !confirmPassword) {
      return null;
    }
    
    return password.value === confirmPassword.value ? null : { passwordsMismatch: true };
  }

  private markFormGroupTouched(): void {
    Object.keys(this.resetForm.controls).forEach(key => {
      const control = this.resetForm.get(key);
      control?.markAsTouched();
    });
  }
}
