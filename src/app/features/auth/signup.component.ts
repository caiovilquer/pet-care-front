import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="auth-container">
      <div class="auth-wrapper">
        <div class="auth-card">
          <div class="auth-header">
            <span class="auth-wordmark">rotina<b>pet</b></span>
            <h1>Criar conta</h1>
            <p class="auth-subtitle">Cuide da rotina de quem você ama.</p>
          </div>

          <form [formGroup]="signupForm" (ngSubmit)="onSubmit()" class="auth-form">
            <div class="form-row">
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Nome</mat-label>
                <input matInput formControlName="firstName" autocomplete="given-name" required>
                <mat-error *ngIf="signupForm.get('firstName')?.hasError('required')">
                  Nome é obrigatório
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Sobrenome</mat-label>
                <input matInput formControlName="lastName" autocomplete="family-name">
              </mat-form-field>
            </div>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email" autocomplete="email" required>
              <mat-icon matSuffix>email</mat-icon>
              <mat-error *ngIf="signupForm.get('email')?.hasError('required')">
                Email é obrigatório
              </mat-error>
              <mat-error *ngIf="signupForm.get('email')?.hasError('email')">
                Email deve ser válido
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Telefone</mat-label>
              <input matInput formControlName="phoneNumber" placeholder="(11) 99999-9999" autocomplete="tel">
              <mat-icon matSuffix>phone</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Senha</mat-label>
              <input matInput [type]="hidePassword ? 'password' : 'text'"
                     formControlName="rawPassword" autocomplete="new-password" required>
              <button mat-icon-button matSuffix (click)="hidePassword = !hidePassword" type="button"
                      [attr.aria-label]="hidePassword ? 'Mostrar senha' : 'Ocultar senha'">
                <mat-icon>{{hidePassword ? 'visibility_off' : 'visibility'}}</mat-icon>
              </button>
              <mat-error *ngIf="signupForm.get('rawPassword')?.hasError('required')">
                Senha é obrigatória
              </mat-error>
              <mat-error *ngIf="signupForm.get('rawPassword')?.hasError('minlength')">
                Senha deve ter pelo menos 6 caracteres
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Confirmar senha</mat-label>
              <input matInput [type]="hideConfirmPassword ? 'password' : 'text'"
                     formControlName="confirmPassword" autocomplete="new-password" required>
              <button mat-icon-button matSuffix (click)="hideConfirmPassword = !hideConfirmPassword" type="button"
                      [attr.aria-label]="hideConfirmPassword ? 'Mostrar senha' : 'Ocultar senha'">
                <mat-icon>{{hideConfirmPassword ? 'visibility_off' : 'visibility'}}</mat-icon>
              </button>
              <mat-error *ngIf="signupForm.get('confirmPassword')?.hasError('required')">
                Confirmação de senha é obrigatória
              </mat-error>
              <mat-error *ngIf="signupForm.hasError('passwordMismatch')">
                Senhas não conferem
              </mat-error>
            </mat-form-field>

            <button mat-flat-button type="submit" class="auth-button full-width"
                    [disabled]="signupForm.invalid || isLoading">
              {{isLoading ? 'Criando conta...' : 'Criar conta'}}
            </button>
          </form>

          <p class="auth-footer">
            Já tem uma conta?
            <a routerLink="/auth/login">Entrar</a>
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .form-row {
      display: flex;
      gap: var(--q-space-3);
    }

    .half-width {
      flex: 1;
      min-width: 0;
    }

    @media (max-width: 480px) {
      .form-row {
        flex-direction: column;
        gap: var(--q-space-1);
      }
    }
  `],
  styleUrls: ['./auth-shared.css']
})
export class SignupComponent {
  signupForm: FormGroup;
  hidePassword = true;
  hideConfirmPassword = true;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toast: ToastService
  ) {
    this.signupForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: [''],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: [''],
      rawPassword: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(group: FormGroup) {
    const password = group.get('rawPassword');
    const confirmPassword = group.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  onSubmit(): void {
    if (this.signupForm.valid) {
      this.isLoading = true;
      const formData = { ...this.signupForm.value };
      delete formData.confirmPassword;
      formData.firstName = formData.firstName.trim();
      formData.lastName = formData.lastName?.trim() || null;
      formData.phoneNumber = formData.phoneNumber?.trim() || null;

      this.authService.signup(formData).subscribe({
        next: () => {
          this.toast.success('Conta criada com sucesso! Faça login para continuar.', 5000);
          this.router.navigate(['/auth/login']);
        },
        error: (error) => {
          let errorMessage = 'Erro ao criar conta. Tente novamente.';
          
          if (error.status === 400) {
            if (error.error?.message) {
              errorMessage = error.error.message;
            } else if (error.error?.details && Array.isArray(error.error.details)) {
              const firstError = error.error.details[0];
              if (firstError?.message) {
                errorMessage = `${firstError.field}: ${firstError.message}`;
              }
            } else {
              errorMessage = 'Dados inválidos. Verifique as informações e tente novamente.';
            }
          } else if (error.status === 409) {
            errorMessage = 'Este email já está cadastrado. Tente fazer login ou use outro email.';
          } else if (error.status === 0) {
            errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
          } else if (error.status >= 500) {
            errorMessage = 'Erro interno do servidor. Tente novamente em alguns minutos.';
          }
          
          this.toast.error(errorMessage, 6000);
          this.isLoading = false;
        },
        complete: () => {
          this.isLoading = false;
        }
      });
    }
  }
}
