import { Component, OnInit, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, NgForm } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { finalize, delay } from 'rxjs/operators';

// Services
import { AuthService } from '../../../core/auth/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

// Models
import { LoginCredentials } from '../../../core/auth/models/auth.types';
import { environment } from '../../../../environments/environment';

declare var google: any;

@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './sign-in.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SignInComponent implements OnInit {
  @ViewChild('signInNgForm') signInNgForm!: NgForm;

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
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.createForm();
    // Initialize Google Sign-In when Google Identity Services is loaded
    this.initializeGoogleSignIn();
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
    const credentials: LoginCredentials = this.signInForm.value;

    this.authService.signIn(credentials)
      .pipe(
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: (response) => {
          // Check user role and redirect accordingly
          const user = response.user;
          const userRole = user?.current_tenant_context?.role?.toLowerCase();
          const isCustomer = !userRole || userRole === 'customer'; // Default to customer if no role
          
          if (response.must_change) {
            this.router.navigate(['/auth/change-password']);
          } else if (isCustomer) {
            // Customers go to home page
            this.router.navigate(['/']);
          } else {
            // Admins go to admin dashboard
            const redirectUrl = this.activatedRoute.snapshot.queryParams['redirectUrl'] || '/admin/dashboard';
            this.router.navigate([redirectUrl]);
          }
        },
        error: (error) => {
          const err = error?.error || {};
          this.alert = {
            type: 'error',
            message: err.message || 'Invalid credentials. Please try again.'
          };
          this.showAlert = true;
          this.action = err.action;
          this.redirect = err.redirect;
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
      
      google.accounts.id.initialize({
        client_id: environment.googleClientId,
        callback: (response: any) => {
          console.log('[Google Sign-In] Callback received:', response ? 'Success' : 'Failed');
          this.handleGoogleSignIn(response);
        },
        auto_select: false,
        cancel_on_tap_outside: true
      });

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
    }
  }

  /**
   * Render Google Sign-In button
   */
  renderGoogleButton(): void {
    const buttonContainer = document.getElementById('googleSignInButton');
    if (buttonContainer && !buttonContainer.hasChildNodes()) {
      console.log('[Google Sign-In] Rendering button in container...');
      try {
        google.accounts.id.renderButton(buttonContainer, {
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          width: '100%',
          type: 'standard'
        });
        console.log('[Google Sign-In] Button rendered successfully');
      } catch (error) {
        console.error('[Google Sign-In] Error rendering button:', error);
      }
    } else {
      console.warn('[Google Sign-In] Button container not found or already has content');
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
      
      // Send token to backend
      this.authService.signInWithGoogle(response.credential)
        .pipe(
          delay(500),
          finalize(() => {
            this.isLoading = false;
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
    }
  }

  /**
   * Handle successful authentication
   */
  private handleSuccessfulAuth(authResponse: any): void {
    console.log('[Google Sign-In] Handling successful auth, checking role...');
    console.log('[Google Sign-In] Auth response data:', authResponse);
    
    // Check user role and redirect accordingly
    const user = authResponse.user;
    const userRole = user?.current_tenant_context?.role?.toLowerCase();
    const isCustomer = !userRole || userRole === 'customer'; // Default to customer if no role
    
    console.log('[Google Sign-In] User role check:', {
      isCustomer,
      role: user?.current_tenant_context?.role
    });
    
    if (isCustomer) {
      // Customers go to home page
      console.log('[Google Sign-In] User is customer, redirecting to home page');
      this.router.navigate(['/']);
    } else {
      // Admins go to admin dashboard
      console.log('[Google Sign-In] User is admin, redirecting to admin dashboard');
      const redirectUrl = this.activatedRoute.snapshot.queryParams['redirectUrl'] || '/admin/dashboard';
      this.router.navigate([redirectUrl]);
    }
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
    // Force a check of the authentication state
    this.authService.check().subscribe();
  }
}
