import { Component, OnInit, OnDestroy, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, NgForm } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { finalize, delay } from 'rxjs/operators';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FuseAlertComponent } from '@fuse/components/alert';

// Services
import { AuthService } from '../../../core/auth/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { UserService } from '../../../core/auth/services/user.service';

// Models
import { LoginCredentials } from '../../../core/auth/models/auth.types';
import { environment } from '../../../../environments/environment';
import { isStaffRole, resolveRoleDashboardPath } from '../../../core/auth/utils/role-dashboard.util';
import {
  ensureGoogleIdentityServicesInitialized,
  registerGoogleCredentialHandler,
  renderGoogleSignInButton,
  unregisterGoogleCredentialHandler,
} from '../../../core/auth/google-identity-services';

declare let google: any;

@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [
    CommonModule,
    FuseAlertComponent,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignInComponent implements OnInit, OnDestroy {
  @ViewChild('signInNgForm') signInNgForm!: NgForm;

  private readonly onGoogleCredential = (response: { credential?: string }) => {
    this.handleGoogleSignIn(response);
  };

  signInForm!: FormGroup;
  isLoading = false;
  hidePassword = true;

  alert = { type: 'success', message: '' };
  showAlert = false;
  action?: string;
  redirect?: string;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private notificationService: NotificationService,
    private userService: UserService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.createForm();
    registerGoogleCredentialHandler(this.onGoogleCredential);
    this.initializeGoogleSignIn();
  }

  ngOnDestroy(): void {
    unregisterGoogleCredentialHandler(this.onGoogleCredential);
  }

  private createForm(): void {
    this.signInForm = this.formBuilder.group({
      identifier: ['', [Validators.required]],
      password: ['', [Validators.required]],
      remember_me: [false]
    });
  }

  onSubmit(): void {
    this.showAlert = false;
    if (this.signInForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading = true;
    this.cdr.markForCheck();
    const credentials: LoginCredentials = this.signInForm.value;

    this.authService.signIn(credentials)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response) => {
          this.redirectByRoleWithFreshContext(response);
        },
        error: (error) => {
          const err = error?.error || {};
          this.alert = {
            type: 'error',
            message: err.message || 'Credenciais inválidas. Tente novamente.'
          };
          this.showAlert = true;
          this.action = err.action;
          this.redirect = err.redirect;
          this.signInForm.get('password')?.reset();
          this.cdr.markForCheck();
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
      return `${this.getFieldLabel(controlName)} is required`;
    }
    
    if (control?.hasError('email')) {
      return 'Please enter a valid email address';
    }
    
    return '';
  }

  private getFieldLabel(controlName: string): string {
    const labels: { [key: string]: string } = {
      identifier: 'Email',
      password: 'Password'
    };
    return labels[controlName] || controlName;
  }

  /**
   * Initialize Google Identity Services
   */
  private initializeGoogleSignIn(): void {
    if (!environment.googleClientId?.trim()) {
      return;
    }
    console.log('[Google Sign-In] Initializing...');
    console.log('[Google Sign-In] Google API available:', typeof google !== 'undefined');
    console.log('[Google Sign-In] Client ID:', environment.googleClientId);

    // Wait for Google Identity Services to load
    if (typeof google !== 'undefined' && google.accounts) {
      console.log('[Google Sign-In] Google API loaded, setting up button...');
      this.setupGoogleButton();
    } else {
      // Retry after a short delay if Google API isn't loaded yet (max 10 attempts = 1 second)
      const maxAttempts = 10;
      let attempts = 0;
      const checkGoogle = () => {
        attempts++;
        if (typeof google !== 'undefined' && google.accounts) {
          console.log('[Google Sign-In] Google API loaded after', attempts, 'attempts');
          this.setupGoogleButton();
        } else if (attempts < maxAttempts) {
          setTimeout(checkGoogle, 100);
        } else {
          console.error('[Google Sign-In] Google API failed to load after', maxAttempts, 'attempts');
          this.alert = {
            type: 'error',
            message: 'Error loading Google Sign-In. Please reload the page.'
          };
          this.showAlert = true;
          this.cdr.markForCheck();
        }
      };
      setTimeout(checkGoogle, 100);
    }
  }

  /**
   * Setup Google Sign-In button with One Tap fallback
   */
  private setupGoogleButton(): void {
    try {
      console.log('[Google Sign-In] Setting up button...');

      if (!ensureGoogleIdentityServicesInitialized(environment.googleClientId)) {
        return;
      }

      // Try One Tap first (better UX)
      console.log('[Google Sign-In] Attempting One Tap...');
      google.accounts.id.prompt((notification: any) => {
        console.log('[Google Sign-In] One Tap notification:', notification);
        
        if (notification.isNotDisplayed() || notification.isSkippedMoment() || notification.isDismissedMoment()) {
          console.log('[Google Sign-In] One Tap not displayed, rendering button...');
          // Fallback to button if One Tap doesn't show
          this.renderGoogleButton();
        } else if (notification.isDisplayed()) {
          console.log('[Google Sign-In] One Tap displayed successfully');
        }
      });

      // Also render button as fallback
      setTimeout(() => {
        this.renderGoogleButton();
      }, 500);
    } catch (error) {
      console.error('[Google Sign-In] Error initializing:', error);
      this.alert = {
        type: 'error',
        message: 'Error initializing Google Sign-In. Please try again.'
      };
      this.showAlert = true;
      this.cdr.markForCheck();
    }
  }

  /**
   * Render Google Sign-In button
   */
  renderGoogleButton(): void {
    const buttonContainer = document.getElementById('googleSignInButton');
    if (!buttonContainer) {
      console.warn('[Google Sign-In] Button container not found');
      return;
    }
    console.log('[Google Sign-In] Rendering button in container...');
    if (renderGoogleSignInButton(buttonContainer)) {
      console.log('[Google Sign-In] Button rendered successfully');
    } else {
      console.error('[Google Sign-In] Error rendering button');
    }
  }

  /**
   * Handle Google Sign-In success
   * This is called by Google Identity Services callback
   */
  handleGoogleSignIn(response: any): void {
    console.log('[Google Sign-In] Handling sign-in response...');
    console.log('[Google Sign-In] Response received:', response ? 'Yes' : 'No');
    console.log('[Google Sign-In] Has credential:', response?.credential ? 'Yes' : 'No');
    
    // Hide the alert
    this.showAlert = false;

    if (response && response.credential) {
      console.log('[Google Sign-In] Sending token to backend...');
      this.isLoading = true;
      this.cdr.markForCheck();

      // Send token to backend
      this.authService.signInWithGoogle(response.credential)
        .pipe(
          delay(500),
          finalize(() => {
            this.isLoading = false;
            this.cdr.markForCheck();
          })
        )
        .subscribe({
          next: (authResponse) => {
            console.log('[Google Sign-In] Full response:', authResponse);
            this.handleSuccessfulAuth(authResponse);
          },
          error: (error) => {
            console.error('[Google Sign-In] Error in signInWithGoogle:', error);
            this.handleAuthError(error);
          }
        });
    } else {
      // Handle missing token
      this.alert = {
        type: 'error',
        message: 'Error obtaining Google token. Please try again.'
      };
      this.showAlert = true;
      this.cdr.markForCheck();
    }
  }

  /**
   * Handle successful authentication
   */
  private handleSuccessfulAuth(authResponse: any): void {
    this.redirectByRoleWithFreshContext(authResponse);
  }

  private redirectByRoleWithFreshContext(response: any): void {
    if (response?.must_change) {
      this.router.navigate(['/auth/change-password']);
      return;
    }

    this.userService.getCurrentUser().subscribe({
      next: (user) => this.redirectByRole(user?.current_tenant_context?.role),
      error: () => this.redirectByRole(response?.user?.current_tenant_context?.role)
    });
  }

  private redirectByRole(role: string | undefined): void {
    const defaultTarget = resolveRoleDashboardPath(role);
    const queryRedirect = this.activatedRoute.snapshot.queryParams['redirectUrl'] as string | undefined;

    if (isStaffRole(role) && queryRedirect) {
      this.router.navigate([queryRedirect]);
      return;
    }

    this.router.navigate([defaultTarget]);
  }

  /**
   * Handle authentication error
   */
  private handleAuthError(error: any): void {
    // Set the alert
    this.alert = {
      type: 'error',
      message: error?.error?.message || error?.error?.error || 'Error signing in with Google. Please try again.'
    };
    // Show the alert
    this.showAlert = true;
    this.cdr.markForCheck();
    this.authService.check().subscribe();
  }
}
