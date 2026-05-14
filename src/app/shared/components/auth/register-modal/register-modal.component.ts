import { Component, OnInit, ViewChild, ChangeDetectionStrategy, Output, EventEmitter, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, NgForm, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, delay } from 'rxjs/operators';
import { Subject, take, takeUntil } from 'rxjs';

// Angular Material
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Services
import { AuthService } from '../../../../core/auth/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { UserService } from '../../../../core/auth/services/user.service';

// Models
import { RegisterData } from '../../../../core/auth/models/auth.types';
import { environment } from '../../../../../environments/environment';
import {
  ensureGoogleIdentityServicesInitialized,
  registerGoogleCredentialHandler,
  renderGoogleSignInButton,
  unregisterGoogleCredentialHandler,
} from '../../../../core/auth/google-identity-services';

declare var google: any;

@Component({
  selector: 'app-register-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './register-modal.component.html',
  styleUrls: ['./register-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegisterModalComponent implements OnInit, OnDestroy {
  @ViewChild('registerNgForm') registerNgForm!: NgForm;
  @Output() close = new EventEmitter<void>();
  @Output() switchToLogin = new EventEmitter<void>();

  registerForm!: FormGroup;
  isLoading = false;
  hidePassword = true;
  hideConfirmPassword = true;
  errorMessage = '';
  showError = false;

  private _unsubscribeAll = new Subject<void>();
  private readonly onGoogleCredential = (response: { credential?: string }) => {
    this.handleGoogleSignUp(response);
  };

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private notificationService: NotificationService,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.createForm();
    registerGoogleCredentialHandler(this.onGoogleCredential);
    this.initializeGoogleSignIn();
  }

  ngOnDestroy(): void {
    unregisterGoogleCredentialHandler(this.onGoogleCredential);
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
  }

  private createForm(): void {
    this.registerForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      password_confirmation: ['', [Validators.required]],
      accept_terms: [false, [Validators.requiredTrue]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const passwordConfirmation = control.get('password_confirmation');
    
    if (!password || !passwordConfirmation) {
      return null;
    }
    
    return password.value === passwordConfirmation.value ? null : { passwordMismatch: true };
  }

  onSubmit(): void {
    this.showError = false;
    this.errorMessage = '';

    if (this.registerForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading = true;
    const formValue = this.registerForm.value;
    const registerData: RegisterData = {
      name: formValue.name,
      identifier: formValue.email,
      type: 'email',
      password: formValue.password,
      password_confirmation: formValue.password_confirmation
    };

    this.authService.signUp(registerData)
      .pipe(
        finalize(() => {
          this.isLoading = false;
        }),
        takeUntil(this._unsubscribeAll)
      )
      .subscribe({
        next: (response) => {
          this.notificationService.success(`Bem-vindo, ${response.user.name}!`);
          this.redirectByRoleWithFreshContext(response);
        },
        error: (error) => {
          const body = error?.error;
          const err = (typeof body === 'object' && body !== null ? body : {}) as {
            message_pt?: string;
            message?: string;
            errors?: { identifier?: string[]; email?: string[]; name?: string[] };
          };
          this.errorMessage =
            err.message_pt ||
            err.message ||
            err.errors?.identifier?.[0] ||
            err.errors?.email?.[0] ||
            err.errors?.name?.[0] ||
            (typeof body === 'string' ? body : null) ||
            'Erro ao criar conta. Por favor, tente novamente.';
          this.showError = true;
        }
      });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.registerForm.controls).forEach(key => {
      const control = this.registerForm.get(key);
      control?.markAsTouched();
    });
  }

  getErrorMessage(controlName: string): string {
    const control = this.registerForm.get(controlName);
    
    if (control?.hasError('required')) {
      return 'Campo obrigatório';
    }
    
    if (control?.hasError('email')) {
      return 'Por favor, insira um email válido';
    }
    
    if (control?.hasError('minlength')) {
      if (controlName === 'name') {
        return 'O nome deve ter pelo menos 3 caracteres';
      }
      return 'A senha deve ter pelo menos 8 caracteres';
    }
    
    if (control?.hasError('requiredTrue') && controlName === 'accept_terms') {
      return 'Você deve aceitar os termos e condições';
    }
    
    return '';
  }

  getPasswordMismatchError(): boolean {
    return this.registerForm.hasError('passwordMismatch') && 
           this.registerForm.get('password_confirmation')?.touched;
  }

  closeModal(): void {
    this.close.emit();
  }

  onSwitchToLogin(): void {
    this.switchToLogin.emit();
  }

  /**
   * Initialize Google Identity Services
   */
  private initializeGoogleSignIn(): void {
    if (!environment.googleClientId?.trim()) {
      return;
    }
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
          console.warn('[Google Sign-Up] Failed to load after maximum attempts');
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
      const ok = ensureGoogleIdentityServicesInitialized(environment.googleClientId);
      if (!ok) {
        return;
      }
      setTimeout(() => {
        this.renderGoogleButton();
      }, 300);
    } catch (error) {
      console.error('[Google Sign-Up] Error initializing:', error);
    }
  }

  /**
   * Render Google Sign-In button
   */
  renderGoogleButton(): void {
    const buttonContainer = document.getElementById('googleSignUpButtonModal');
    if (!buttonContainer) {
      return;
    }
    if (!renderGoogleSignInButton(buttonContainer, { text: 'signup_with' })) {
      console.error('[Google Sign-Up] Error rendering button');
    }
  }

  /**
   * Handle Google Sign-Up success
   */
  handleGoogleSignUp(response: any): void {
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
            this.notificationService.success(`Bem-vindo, ${authResponse.user.name}!`);
            this.redirectByRoleWithFreshContext(authResponse);
          },
          error: (error) => {
            this.errorMessage = error?.error?.message || 'Erro ao criar conta com Google. Por favor, tente novamente.';
            this.showError = true;
          }
        });
    }
  }

  private redirectByRoleWithFreshContext(response: any): void {
    this.userService.getCurrentUser()
      .pipe(take(1))
      .subscribe({
        next: (user) => this.redirectByRole(user?.current_tenant_context?.role),
        error: () => this.redirectByRole(response?.user?.current_tenant_context?.role)
      });
  }

  private redirectByRole(role: string | undefined): void {
    const normalizedRole = (role || '').toLowerCase();
    const isAdminUser = normalizedRole !== '' && normalizedRole !== 'customer';
    this.closeModal();

    if (isAdminUser) {
      this.router.navigate(['/admin/dashboard']);
      return;
    }

    this.router.navigate(['/conta/dashboard']);
  }
}

