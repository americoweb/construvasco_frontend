import { Component, OnInit, ViewChild, ChangeDetectionStrategy, Output, EventEmitter, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, delay } from 'rxjs/operators';
import { Subject, takeUntil } from 'rxjs';

// Angular Material
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';

// Services
import { AuthService } from '../../../../core/auth/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';

// Models
import { LoginCredentials } from '../../../../core/auth/models/auth.types';
import { environment } from '../../../../../environments/environment';

declare var google: any;

@Component({
  selector: 'app-login-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatDialogModule
  ],
  templateUrl: './login-modal.component.html',
  styleUrls: ['./login-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginModalComponent implements OnInit, OnDestroy {
  @ViewChild('signInNgForm') signInNgForm!: NgForm;
  @Output() close = new EventEmitter<void>();
  @Output() switchToRegister = new EventEmitter<void>();
  @Output() switchToForgotPassword = new EventEmitter<void>();

  signInForm!: FormGroup;
  isLoading = false;
  hidePassword = true;
  errorMessage = '';
  showError = false;

  private _unsubscribeAll = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.createForm();
    this.initializeGoogleSignIn();
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
  }

  private createForm(): void {
    this.signInForm = this.formBuilder.group({
      identifier: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      remember_me: [false]
    });
  }

  onSubmit(): void {
    this.showError = false;
    this.errorMessage = '';

    if (this.signInForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading = true;
    const credentials: LoginCredentials = this.signInForm.value;

    this.authService.signIn(credentials)
      .pipe(
        finalize(() => {
          this.isLoading = false;
        }),
        takeUntil(this._unsubscribeAll)
      )
      .subscribe({
        next: (response) => {
          this.notificationService.success('Bem-vindo de volta!');
          this.closeModal();
          
          // Check user role and redirect accordingly
          const user = response.user;
          const userRole = user?.current_tenant_context?.role?.toLowerCase();
          const isCustomer = !userRole || userRole === 'customer';
          
          if (response.must_change) {
            this.router.navigate(['/auth/change-password']);
          } else if (isCustomer) {
            this.router.navigate(['/conta/dashboard']);
          } else {
            this.router.navigate(['/admin/dashboard']);
          }
        },
        error: (error) => {
          const err = error?.error || {};
          this.errorMessage = err.message || 'Credenciais inválidas. Por favor, tente novamente.';
          this.showError = true;
          this.signInForm.get('password')?.reset();
        }
      });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.signInForm.controls).forEach(key => {
      const control = this.signInForm.get(key);
      control?.markAsTouched();
    });
  }

  getErrorMessage(controlName: string): string {
    const control = this.signInForm.get(controlName);
    
    if (control?.hasError('required')) {
      return 'Campo obrigatório';
    }
    
    if (control?.hasError('email')) {
      return 'Por favor, insira um email válido';
    }
    
    if (control?.hasError('minlength')) {
      return 'A senha deve ter pelo menos 8 caracteres';
    }
    
    return '';
  }

  closeModal(): void {
    this.close.emit();
  }

  onSwitchToRegister(): void {
    this.switchToRegister.emit();
  }

  onSwitchToForgotPassword(): void {
    this.switchToForgotPassword.emit();
  }

  /**
   * Initialize Google Identity Services
   */
  private initializeGoogleSignIn(): void {
    if (typeof google !== 'undefined' && google.accounts) {
      this.setupGoogleButton();
    } else {
      const maxAttempts = 10;
      let attempts = 0;
      const checkGoogle = () => {
        attempts++;
        if (typeof google !== 'undefined' && google.accounts) {
          this.setupGoogleButton();
        } else if (attempts < maxAttempts) {
          setTimeout(checkGoogle, 100);
        } else {
          // Stop trying after max attempts to avoid infinite loops
          console.warn('[Google Sign-In] Failed to load after maximum attempts');
        }
      };
      setTimeout(checkGoogle, 100);
    }
  }

  /**
   * Setup Google Sign-In button
   */
  private setupGoogleButton(): void {
    try {
      google.accounts.id.initialize({
        client_id: environment.googleClientId,
        callback: (response: any) => {
          this.handleGoogleSignIn(response);
        },
        auto_select: false,
        cancel_on_tap_outside: true
      });

      setTimeout(() => {
        this.renderGoogleButton();
      }, 300);
    } catch (error) {
      console.error('[Google Sign-In] Error initializing:', error);
    }
  }

  /**
   * Render Google Sign-In button
   */
  renderGoogleButton(): void {
    const buttonContainer = document.getElementById('googleSignInButtonModal');
    if (buttonContainer && !buttonContainer.hasChildNodes()) {
      try {
        google.accounts.id.renderButton(buttonContainer, {
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          width: '100%',
          type: 'standard'
        });
      } catch (error) {
        console.error('[Google Sign-In] Error rendering button:', error);
      }
    }
  }

  /**
   * Handle Google Sign-In success
   */
  handleGoogleSignIn(response: any): void {
    if (response && response.credential) {
      this.isLoading = true;
      
      this.authService.signInWithGoogle(response.credential)
        .pipe(
          delay(500),
          finalize(() => {
            this.isLoading = false;
          }),
          takeUntil(this._unsubscribeAll)
        )
        .subscribe({
          next: (authResponse) => {
            this.notificationService.success('Login com Google realizado com sucesso!');
            this.closeModal();
            
            const user = authResponse.user;
            const userRole = user?.current_tenant_context?.role?.toLowerCase();
            const isCustomer = !userRole || userRole === 'customer';
            
            if (isCustomer) {
              this.router.navigate(['/conta/dashboard']);
            } else {
              this.router.navigate(['/admin/dashboard']);
            }
          },
          error: (error) => {
            this.errorMessage = error?.error?.message || 'Erro ao fazer login com Google. Por favor, tente novamente.';
            this.showError = true;
          }
        });
    }
  }
}

