import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-signup',
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
    MatSnackBarModule
  ],
  template: `
    <div class="signup-container">
      <mat-card class="signup-card" [class.loading]="isLoading">
        <mat-card-header>
          <div class="header-image">
            <mat-icon>person_add</mat-icon>
          </div>
          <mat-card-title>Criar Conta</mat-card-title>
          <mat-card-subtitle>
            Junte-se a nós para começar sua jornada
          </mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="signupForm" (ngSubmit)="onSubmit()">
            <div class="form-row">
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Nome</mat-label>
                <input matInput formControlName="firstName" placeholder="Digite seu nome" required>
                <mat-icon matSuffix>person</mat-icon>
                <mat-error *ngIf="signupForm.get('firstName')?.hasError('required')">
                  Nome é obrigatório
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Sobrenome</mat-label>
                <input matInput formControlName="lastName" placeholder="Digite seu sobrenome">
                <mat-icon matSuffix>person</mat-icon>
              </mat-form-field>
            </div>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email" placeholder="Digite seu e-mail" required>
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
              <input matInput formControlName="phoneNumber" placeholder="(11) 99999-9999">
              <mat-icon matSuffix>phone</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Senha</mat-label>
              <input matInput [type]="hidePassword ? 'password' : 'text'" formControlName="rawPassword" placeholder="Digite sua senha" required>
              <button mat-icon-button matSuffix (click)="hidePassword = !hidePassword" type="button">
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
              <mat-label>Confirmar Senha</mat-label>
              <input matInput [type]="hideConfirmPassword ? 'password' : 'text'" formControlName="confirmPassword" placeholder="Confirme sua senha" required>
              <button mat-icon-button matSuffix (click)="hideConfirmPassword = !hideConfirmPassword" type="button">
                <mat-icon>{{hideConfirmPassword ? 'visibility_off' : 'visibility'}}</mat-icon>
              </button>
              <mat-error *ngIf="signupForm.get('confirmPassword')?.hasError('required')">
                Confirmação de senha é obrigatória
              </mat-error>
              <mat-error *ngIf="signupForm.hasError('passwordMismatch')">
                Senhas não conferem
              </mat-error>
            </mat-form-field>

            <mat-card-actions>
              <button 
                mat-raised-button 
                color="primary" 
                type="submit" 
                class="full-width"
                [disabled]="signupForm.invalid || isLoading">
                <mat-icon *ngIf="isLoading">hourglass_empty</mat-icon>
                <span>{{isLoading ? 'Criando conta...' : 'Criar conta'}}</span>
              </button>
            </mat-card-actions>

            <div class="center-text">
              Já tem uma conta? 
              <a routerLink="/auth/login" class="login-link">Entrar</a>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .signup-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
      padding: 20px;
      position: relative;
    }

    .signup-container::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: 
        radial-gradient(circle at 20% 20%, rgba(99, 102, 241, 0.03) 0%, transparent 50%),
        radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.03) 0%, transparent 50%);
      pointer-events: none;
    }

    .signup-card {
      width: 100%;
      max-width: 480px;
      padding: 2.5rem;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      border-radius: 20px;
      box-shadow: var(--shadow-card);
      border: 1px solid var(--border-light);
      position: relative;
      z-index: 1;
      animation: fadeInUp 0.6s ease-out;
      transition: none;
    }

    .header-image {
      background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 64px;
      height: 64px;
      border-radius: 50%;
      margin: 0 auto 1.5rem auto;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
    }

    .header-image mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
    }

    mat-card-header {
      margin-bottom: 2rem;
      text-align: center;
      flex-direction: column;
      align-items: center;
    }

    mat-card-title {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 0.5rem;
      letter-spacing: -0.5px;
    }

    mat-card-subtitle {
      font-size: 1rem;
      color: var(--text-secondary);
      font-weight: 500;
    }

    .form-row {
      display: flex;
      gap: 1rem;
      margin-bottom: 0.5rem;
    }

    .full-width {
      width: 100%;
      margin-bottom: 1.5rem;
    }

    .half-width {
      flex: 1;
      margin-bottom: 1.5rem;
    }

    .center-text {
      text-align: center;
      margin: 1.5rem 0 0 0;
      width: 100%;
      color: var(--text-secondary);
    }

    .login-link {
      color: var(--primary-color);
      text-decoration: none;
      font-weight: 600;
      transition: color 0.3s ease;
    }

    .login-link:hover {
      color: var(--primary-dark);
      text-decoration: underline;
    }

    /* Form field styling */
    ::ng-deep .mat-mdc-form-field {
      width: 100%;
    }



    ::ng-deep .mat-mdc-form-field.mat-focused .mdc-text-field {
      border-color: var(--primary-color) !important;
      box-shadow: none !important;
    }

    ::ng-deep .mat-mdc-form-field:not(.mat-form-field-disabled) .mdc-text-field:hover {
      border-color: var(--primary-light) !important;
    }

    /* Remove outlines */
    ::ng-deep .mat-mdc-form-field .mdc-text-field:focus-within {
      outline: none !important;
    }

    ::ng-deep .mat-mdc-form-field input:focus {
      outline: none !important;
      box-shadow: none !important;
    }

    /* Button styling */
    ::ng-deep .mat-mdc-raised-button {
      border-radius: 12px !important;
      font-weight: 600 !important;
      text-transform: none !important;
      padding: 12px 24px !important;
      height: 48px !important;
      background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%) !important;
      color: white !important;
      box-shadow: 0 4px 12px rgba(251, 146, 60, 0.3) !important;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
    }

    ::ng-deep .mat-mdc-raised-button:not([disabled]) {
      color: white !important;
    }

    ::ng-deep .mat-mdc-raised-button:hover:not([disabled]) {
      transform: translateY(-2px) !important;
      box-shadow: 0 6px 20px rgba(251, 146, 60, 0.4) !important;
      color: white !important;
    }

    ::ng-deep .mat-mdc-raised-button:disabled {
      background: var(--text-muted) !important;
      color: white !important;
      transform: none !important;
      box-shadow: none !important;
    }

    /* Ensure button text is always white */
    ::ng-deep .mat-mdc-raised-button span,
    ::ng-deep .mat-mdc-raised-button .mdc-button__label {
      color: white !important;
    }

    ::ng-deep .mat-mdc-raised-button mat-icon {
      color: white !important;
    }

    /* Icon button styling */
    ::ng-deep .mat-mdc-icon-button {
      transition: all 0.3s ease !important;
    }

    ::ng-deep .mat-mdc-icon-button:hover {
      background: rgba(99, 102, 241, 0.1) !important;
    }

    /* Card actions */
    mat-card-actions {
      padding: 0 !important;
      margin-top: 1rem;
    }

    /* Loading state */
    .signup-card.loading {
      pointer-events: none;
      opacity: 0.8;
    }

    /* Animation */
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* Responsive design */
    @media (max-width: 768px) {
      .signup-container {
        padding: 1rem;
      }
      
      .signup-card {
        padding: 2rem;
        border-radius: 16px;
        max-width: 100%;
      }
      
      .form-row {
        flex-direction: column;
        gap: 0;
      }
      
      .half-width {
        margin-bottom: 1rem;
      }
      
      .header-image {
        width: 56px;
        height: 56px;
        margin-bottom: 1rem;
      }
      
      .header-image mat-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
      }
      
      mat-card-title {
        font-size: 1.5rem;
      }
    }
  `]
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
    private snackBar: MatSnackBar
  ) {
    this.signupForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: [''],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: [''],
      rawPassword: ['', [Validators.required, Validators.minLength(6)]],
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

      this.authService.signup(formData).subscribe({
        next: () => {
          this.snackBar.open('✅ Conta criada com sucesso! Faça login para continuar.', 'Fechar', {
            duration: 5000,
            panelClass: ['success-snackbar']
          });
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
          
          this.snackBar.open(`❌ ${errorMessage}`, 'Fechar', {
            duration: 6000,
            panelClass: ['error-snackbar']
          });
          this.isLoading = false;
        },
        complete: () => {
          this.isLoading = false;
        }
      });
    }
  }
}
