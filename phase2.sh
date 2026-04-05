#!/bin/bash

# Phase 2: Authentication Setup Script
# Run this script from the src/ directory after Phase 1
# Usage: chmod +x phase2-authentication.sh && ./phase2-authentication.sh

echo "🔐 Creating Phase 2: Authentication System..."

# Create directory structure
mkdir -p app/core/auth/guards
mkdir -p app/core/auth/services
mkdir -p app/core/auth/models
mkdir -p app/core/auth/interceptors
mkdir -p app/modules/auth/sign-in
mkdir -p app/modules/auth/sign-up

echo "📁 Authentication directory structure created"

# =============================================================================
# AUTH MODELS
# =============================================================================

# Create user.interface.ts
cat > app/core/auth/models/user.interface.ts << 'EOF'
export interface User {
  id: string;
  name: string;
  identifier: string; // email or phone
  type: 'email' | 'phone';
  avatar?: string;
  verified_at?: string;
  created_at: string;
  updated_at: string;
  current_tenant_context?: TenantContext;
}

export interface TenantContext {
  tenant_id: string;
  role: string;
  permissions: string[];
  is_owner: boolean;
  custom_permissions: {
    granted: string[];
    denied: string[];
  };
}

export interface UserProfile extends User {
  profile?: {
    first_name?: string;
    last_name?: string;
    phone?: string;
    timezone?: string;
    language?: string;
    bio?: string;
  };
  preferences?: {
    theme: 'light' | 'dark' | 'auto';
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
  };
}
EOF

# Create auth.types.ts
cat > app/core/auth/models/auth.types.ts << 'EOF'
export interface LoginCredentials {
  identifier: string; // email or phone
  password: string;
  remember_me?: boolean;
}

export interface RegisterData {
  name: string;
  identifier: string;
  type: 'email' | 'phone';
  password: string;
  password_confirmation: string;
  organization_name: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: 'bearer';
  expires_in: number;
  user: User;
  current_tenant?: Tenant;
  must_change?: boolean;
  message?: string;
}

export interface TokenPayload {
  sub: string; // user id
  iat: number; // issued at
  exp: number; // expires at
  tenant_id?: string;
  permissions?: string[];
}

export interface ForgotPasswordRequest {
  identifier: string;
  type: 'email' | 'phone';
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
  password_confirmation: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  password: string;
  password_confirmation: string;
}

export interface RefreshTokenResponse {
  access_token: string;
  token_type: 'bearer';
  expires_in: number;
}
EOF

# Create tenant.interface.ts
cat > app/core/auth/models/tenant.interface.ts << 'EOF'
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  is_active: boolean;
  settings: TenantSettings;
  features: string[];
  created_at: string;
  updated_at: string;
}

export interface TenantSettings {
  timezone: string;
  currency: string;
  language: string;
  branding?: {
    logo?: string;
    primary_color?: string;
    secondary_color?: string;
  };
  features: string[];
}

export interface TenantUser {
  user_id: string;
  tenant_id: string;
  role_id: string;
  role: string;
  permissions: string[];
  current_tenant: boolean;
  joined_at: string;
  status: 'active' | 'inactive' | 'suspended';
}

export interface TenantInvitation {
  id: string;
  tenant_id: string;
  email: string;
  role: string;
  permissions: string[];
  invited_by: string;
  expires_at: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  created_at: string;
}
EOF

echo "✅ Auth models created"

# =============================================================================
# AUTH SERVICES
# =============================================================================

# Create auth.service.ts
cat > app/core/auth/services/auth.service.ts << 'EOF'
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, switchMap, tap, map } from 'rxjs/operators';
import { Router } from '@angular/router';

import { ConfigService } from '../../services/config.service';
import { LoggingService } from '../../services/logging.service';
import { NotificationService } from '../../services/notification.service';
import { UserService } from './user.service';

import { 
  LoginCredentials, 
  RegisterData, 
  AuthResponse, 
  ForgotPasswordRequest, 
  ResetPasswordRequest,
  ChangePasswordRequest,
  RefreshTokenResponse,
  TokenPayload 
} from '../models/auth.types';
import { User } from '../models/user.interface';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private _authenticated = new BehaviorSubject<boolean>(false);
  private _mustChangePassword = new BehaviorSubject<boolean>(false);
  private readonly TOKEN_KEY = 'access_token';
  private readonly REFRESH_BUFFER = 5 * 60 * 1000; // 5 minutes before expiry

  constructor(
    private httpClient: HttpClient,
    private configService: ConfigService,
    private logger: LoggingService,
    private notificationService: NotificationService,
    private userService: UserService,
    private router: Router
  ) {
    this.initializeAuth();
  }

  // Observables
  get authenticated$(): Observable<boolean> {
    return this._authenticated.asObservable();
  }

  get mustChangePassword$(): Observable<boolean> {
    return this._mustChangePassword.asObservable();
  }

  get isAuthenticated(): boolean {
    return this._authenticated.value;
  }

  // Token management
  get accessToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private set accessToken(token: string | null) {
    if (token) {
      localStorage.setItem(this.TOKEN_KEY, token);
    } else {
      localStorage.removeItem(this.TOKEN_KEY);
    }
  }

  // Initialize authentication state
  private initializeAuth(): void {
    const token = this.accessToken;
    if (token && !this.isTokenExpired(token)) {
      this._authenticated.next(true);
      this.setupTokenRefresh(token);
    } else {
      this.signOut();
    }
  }

  // Authentication methods
  signIn(credentials: LoginCredentials): Observable<AuthResponse> {
    if (this._authenticated.value) {
      return throwError(() => new Error('User is already authenticated'));
    }

    return this.httpClient.post<AuthResponse>(
      this.configService.getApiUrl('auth/login'), 
      credentials
    ).pipe(
      tap(response => {
        this.handleAuthSuccess(response);
      }),
      catchError(error => {
        this.logger.error('Sign in failed', error);
        return throwError(() => error);
      })
    );
  }

  signUp(userData: RegisterData): Observable<AuthResponse> {
    return this.httpClient.post<AuthResponse>(
      this.configService.getApiUrl('auth/register'), 
      userData
    ).pipe(
      tap(response => {
        this.handleAuthSuccess(response);
        this.notificationService.success('Registration successful! Welcome to iHRM.');
      }),
      catchError(error => {
        this.logger.error('Sign up failed', error);
        return throwError(() => error);
      })
    );
  }

  signOut(): Observable<boolean> {
    return this.httpClient.post(
      this.configService.getApiUrl('auth/logout'), 
      {}
    ).pipe(
      catchError(() => of({})), // Continue even if logout API fails
      tap(() => {
        this.handleSignOut();
      }),
      map(() => true)
    );
  }

  // Token validation and refresh
  check(): Observable<boolean> {
    if (this._authenticated.value) {
      return of(true);
    }

    const token = this.accessToken;
    if (!token) {
      return of(false);
    }

    if (this.isTokenExpired(token)) {
      this.signOut();
      return of(false);
    }

    // Verify token with backend
    return this.refreshToken().pipe(
      map(() => true),
      catchError(() => {
        this.signOut();
        return of(false);
      })
    );
  }

  refreshToken(): Observable<RefreshTokenResponse> {
    return this.httpClient.post<RefreshTokenResponse>(
      this.configService.getApiUrl('auth/refresh'), 
      {}
    ).pipe(
      tap(response => {
        this.accessToken = response.access_token;
        this.setupTokenRefresh(response.access_token);
        this.logger.info('Token refreshed successfully');
      }),
      catchError(error => {
        this.logger.error('Token refresh failed', error);
        this.signOut();
        return throwError(() => error);
      })
    );
  }

  // Password management
  forgotPassword(request: ForgotPasswordRequest): Observable<any> {
    return this.httpClient.post(
      this.configService.getApiUrl('auth/forgot-password'), 
      request
    ).pipe(
      tap(() => {
        this.notificationService.success('Password reset instructions sent!');
      }),
      catchError(error => {
        this.logger.error('Forgot password failed', error);
        return throwError(() => error);
      })
    );
  }

  resetPassword(request: ResetPasswordRequest): Observable<any> {
    return this.httpClient.post(
      this.configService.getApiUrl('auth/reset-password'), 
      request
    ).pipe(
      tap(() => {
        this.notificationService.success('Password reset successful! Please sign in.');
      }),
      catchError(error => {
        this.logger.error('Reset password failed', error);
        return throwError(() => error);
      })
    );
  }

  changePassword(request: ChangePasswordRequest): Observable<any> {
    return this.httpClient.post(
      this.configService.getApiUrl('auth/change-password'), 
      request
    ).pipe(
      tap(() => {
        this._mustChangePassword.next(false);
        this.notificationService.success('Password changed successfully!');
      }),
      catchError(error => {
        this.logger.error('Change password failed', error);
        return throwError(() => error);
      })
    );
  }

  // Private helper methods
  private handleAuthSuccess(response: AuthResponse): void {
    this.accessToken = response.access_token;
    this._authenticated.next(true);
    this._mustChangePassword.next(response.must_change || false);
    
    // Store user data
    this.userService.setUser(response.user);
    
    // Store tenant data if available
    if (response.current_tenant) {
      this.userService.setCurrentTenant(response.current_tenant);
    }

    // Setup token refresh
    this.setupTokenRefresh(response.access_token);

    this.logger.info('Authentication successful');
  }

  private handleSignOut(): void {
    this.accessToken = null;
    this._authenticated.next(false);
    this._mustChangePassword.next(false);
    this.userService.clearUser();
    this.router.navigate(['/auth/sign-in']);
    this.logger.info('User signed out');
  }

  private setupTokenRefresh(token: string): void {
    try {
      const payload = this.decodeToken(token);
      if (payload?.exp) {
        const expiryTime = payload.exp * 1000; // Convert to milliseconds
        const currentTime = Date.now();
        const timeUntilRefresh = expiryTime - currentTime - this.REFRESH_BUFFER;

        if (timeUntilRefresh > 0) {
          setTimeout(() => {
            if (this._authenticated.value) {
              this.refreshToken().subscribe();
            }
          }, timeUntilRefresh);
        }
      }
    } catch (error) {
      this.logger.warn('Failed to setup token refresh', error);
    }
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = this.decodeToken(token);
      if (!payload?.exp) return true;
      
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch {
      return true;
    }
  }

  private decodeToken(token: string): TokenPayload | null {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  }
}
EOF

# Create user.service.ts
cat > app/core/auth/services/user.service.ts << 'EOF'
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap, catchError, throwError } from 'rxjs/operators';

import { ConfigService } from '../../services/config.service';
import { LoggingService } from '../../services/logging.service';
import { User, UserProfile } from '../models/user.interface';
import { Tenant } from '../models/tenant.interface';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private _user = new BehaviorSubject<User | null>(null);
  private _currentTenant = new BehaviorSubject<Tenant | null>(null);

  constructor(
    private httpClient: HttpClient,
    private configService: ConfigService,
    private logger: LoggingService
  ) {}

  // Observables
  get user$(): Observable<User | null> {
    return this._user.asObservable();
  }

  get currentTenant$(): Observable<Tenant | null> {
    return this._currentTenant.asObservable();
  }

  // Getters
  get user(): User | null {
    return this._user.value;
  }

  get currentTenant(): Tenant | null {
    return this._currentTenant.value;
  }

  // User management
  setUser(user: User): void {
    this._user.next(user);
    this.logger.info('User data updated');
  }

  setCurrentTenant(tenant: Tenant): void {
    this._currentTenant.next(tenant);
    this.logger.info('Current tenant updated');
  }

  clearUser(): void {
    this._user.next(null);
    this._currentTenant.next(null);
    this.logger.info('User data cleared');
  }

  // API methods
  getCurrentUser(): Observable<User> {
    return this.httpClient.get<User>(
      this.configService.getApiUrl('auth/me')
    ).pipe(
      tap(user => {
        this.setUser(user);
      }),
      catchError(error => {
        this.logger.error('Failed to get current user', error);
        return throwError(() => error);
      })
    );
  }

  updateProfile(profile: Partial<UserProfile>): Observable<User> {
    return this.httpClient.put<User>(
      this.configService.getApiUrl('user/profile'),
      profile
    ).pipe(
      tap(user => {
        this.setUser(user);
        this.logger.info('Profile updated successfully');
      }),
      catchError(error => {
        this.logger.error('Failed to update profile', error);
        return throwError(() => error);
      })
    );
  }

  uploadAvatar(file: File): Observable<User> {
    const formData = new FormData();
    formData.append('avatar', file);

    return this.httpClient.post<User>(
      this.configService.getApiUrl('user/avatar'),
      formData
    ).pipe(
      tap(user => {
        this.setUser(user);
        this.logger.info('Avatar updated successfully');
      }),
      catchError(error => {
        this.logger.error('Failed to upload avatar', error);
        return throwError(() => error);
      })
    );
  }

  // Tenant management
  switchTenant(tenantId: string): Observable<Tenant> {
    return this.httpClient.post<Tenant>(
      this.configService.getApiUrl('user/switch-tenant'),
      { tenant_id: tenantId }
    ).pipe(
      tap(tenant => {
        this.setCurrentTenant(tenant);
        this.logger.info('Switched tenant successfully');
      }),
      catchError(error => {
        this.logger.error('Failed to switch tenant', error);
        return throwError(() => error);
      })
    );
  }

  getUserTenants(): Observable<Tenant[]> {
    return this.httpClient.get<Tenant[]>(
      this.configService.getApiUrl('user/tenants')
    ).pipe(
      catchError(error => {
        this.logger.error('Failed to get user tenants', error);
        return throwError(() => error);
      })
    );
  }

  // Permission helpers
  hasPermission(permission: string): boolean {
    const user = this._user.value;
    if (!user?.current_tenant_context) return false;
    
    return user.current_tenant_context.permissions.some(p => 
      p === permission || permission.startsWith(p)
    );
  }

  hasRole(role: string): boolean {
    const user = this._user.value;
    return user?.current_tenant_context?.role === role;
  }

  isOwner(): boolean {
    const user = this._user.value;
    return user?.current_tenant_context?.is_owner || false;
  }
}
EOF

echo "✅ Auth services created"

# =============================================================================
# AUTH GUARDS
# =============================================================================

# Create auth.guard.ts
cat > app/core/auth/guards/auth.guard.ts << 'EOF'
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { of, switchMap } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.check().pipe(
    switchMap(authenticated => {
      if (!authenticated) {
        // Store the attempted URL for redirecting after login
        const redirectUrl = state.url === '/sign-out' ? '/' : state.url;
        router.navigate(['/auth/sign-in'], { 
          queryParams: { redirectUrl } 
        });
        return of(false);
      }

      // Check if user must change password
      if (authService.mustChangePassword$.value && 
          !state.url.includes('change-password')) {
        router.navigate(['/auth/change-password']);
        return of(false);
      }

      return of(true);
    })
  );
};
EOF

# Create no-auth.guard.ts
cat > app/core/auth/guards/no-auth.guard.ts << 'EOF'
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { of, switchMap } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const noAuthGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.check().pipe(
    switchMap(authenticated => {
      if (authenticated) {
        // User is authenticated, redirect to dashboard
        router.navigate(['/dashboard']);
        return of(false);
      }

      return of(true);
    })
  );
};
EOF

echo "✅ Auth guards created"

# =============================================================================
# AUTH INTERCEPTOR
# =============================================================================

# Create auth.interceptor.ts
cat > app/core/auth/interceptors/auth.interceptor.ts << 'EOF'
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  
  // Get the auth token
  const token = authService.accessToken;
  
  // Skip auth header for certain endpoints
  const skipAuthEndpoints = [
    '/auth/login',
    '/auth/register', 
    '/auth/forgot-password',
    '/auth/reset-password'
  ];
  
  const shouldSkipAuth = skipAuthEndpoints.some(endpoint => 
    req.url.includes(endpoint)
  );
  
  // Clone the request and add the authorization header if token exists
  if (token && !shouldSkipAuth) {
    const authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    return next(authReq);
  }
  
  return next(req);
};
EOF

echo "✅ Auth interceptor created"

# =============================================================================
# AUTH COMPONENTS
# =============================================================================

# Create sign-in component
cat > app/modules/auth/sign-in/sign-in.component.ts << 'EOF'
import { Component, OnInit, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, NgForm } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';

// Angular Material
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Services
import { AuthService } from '../../../core/auth/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

// Models
import { LoginCredentials } from '../../../core/auth/models/auth.types';

@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './sign-in.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SignInComponent implements OnInit {
  @ViewChild('signInNgForm') signInNgForm!: NgForm;

  signInForm!: FormGroup;
  isLoading = false;
  hidePassword = true;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.createForm();
  }

  private createForm(): void {
    this.signInForm = this.formBuilder.group({
      identifier: ['', [Validators.required]],
      password: ['', [Validators.required]],
      remember_me: [false]
    });
  }

  onSubmit(): void {
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
          const redirectUrl = this.activatedRoute.snapshot.queryParams['redirectUrl'] || '/dashboard';
          
          if (response.must_change) {
            this.router.navigate(['/auth/change-password']);
          } else {
            this.router.navigate([redirectUrl]);
          }
        },
        error: (error) => {
          this.signInNgForm.resetForm();
          this.createForm();
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
      identifier: 'Email/Phone',
      password: 'Password'
    };
    return labels[controlName] || controlName;
  }
}
EOF

# Create sign-in component template
cat > app/modules/auth/sign-in/sign-in.component.html << 'EOF'
<div class="flex flex-col sm:flex-row items-center md:items-start sm:justify-center md:justify-start flex-auto min-w-0">
  
  <!-- Content -->
  <div class="md:flex md:items-center md:justify-end w-full sm:w-auto md:h-full md:w-1/2 py-8 px-4 sm:p-12 md:p-16 sm:rounded-2xl md:rounded-none sm:shadow md:shadow-none sm:bg-card">
    
    <div class="w-full max-w-80 sm:w-80 mx-auto sm:mx-0">
      
      <!-- Logo -->
      <div class="w-12 mx-auto mb-8">
        <img src="assets/images/logo/logo.svg" alt="iHRM Logo">
      </div>

      <!-- Title -->
      <div class="text-4xl font-extrabold tracking-tight leading-tight text-center">
        Sign in to iHRM
      </div>
      <div class="flex items-baseline mt-0.5 font-medium text-center">
        <div>Don't have an account?</div>
        <a 
          class="ml-1 text-primary-500 hover:underline"
          [routerLink]="['/auth/sign-up']">
          Sign up
        </a>
      </div>

      <!-- Sign in form -->
      <form 
        class="mt-8"
        [formGroup]="signInForm"
        #signInNgForm="ngForm"
        (ngSubmit)="onSubmit()">

        <!-- Email/Phone field -->
        <mat-form-field class="w-full">
          <mat-label>Email or Phone</mat-label>
          <input
            id="identifier"
            matInput
            formControlName="identifier"
            autocomplete="username">
          <mat-icon 
            class="icon-size-5"
            matSuffix
            [svgIcon]="'heroicons_solid:user'">
          </mat-icon>
          <mat-error *ngIf="signInForm.get('identifier')?.hasError('required')">
            Email or phone is required
          </mat-error>
        </mat-form-field>

        <!-- Password field -->
        <mat-form-field class="w-full">
          <mat-label>Password</mat-label>
          <input
            id="password"
            matInput
            [type]="hidePassword ? 'password' : 'text'"
            formControlName="password"
            autocomplete="current-password">
          <button
            type="button"
            mat-icon-button
            matSuffix
            (click)="hidePassword = !hidePassword">
            <mat-icon>
              {{hidePassword ? 'visibility_off' : 'visibility'}}
            </mat-icon>
          </button>
          <mat-error *ngIf="signInForm.get('password')?.hasError('required')">
            Password is required
          </mat-error>
        </mat-form-field>

        <!-- Remember me -->
        <div class="inline-flex items-end justify-between w-full mt-1.5">
          <mat-checkbox
            formControlName="remember_me"
            class="-ml-2">
            Remember me
          </mat-checkbox>
          <a
            class="text-md font-medium text-primary-500 hover:underline"
            [routerLink]="['/auth/forgot-password']">
            Forgot password?
          </a>
        </div>

        <!-- Submit button -->
        <button
          class="fuse-mat-button-large w-full mt-6"
          mat-flat-button
          type="submit"
          [color]="'primary'"
          [disabled]="isLoading">
          <span *ngIf="!isLoading">
            Sign in
          </span>
          <mat-progress-spinner
            *ngIf="isLoading"
            [diameter]="24"
            [mode]="'indeterminate'">
          </mat-progress-spinner>
        </button>

      </form>
    </div>
  </div>

  <!-- Background -->
  <div class="relative hidden md:flex flex-auto items-center justify-center w-1/2 h-full p-16 lg:px-28 overflow-hidden bg-gray-800 dark:border-l">
    
    <!-- Background pattern -->
    <svg class="absolute inset-0 pointer-events-none"
         viewBox="0 0 960 540" width="100%" height="100%" preserveAspectRatio="xMidYMax slice">
      <g class="text-gray-700 opacity-25" fill="none" stroke="currentColor" stroke-width="100">
        <circle r="234" cx="196" cy="23"></circle>
        <circle r="234" cx="790" cy="491"></circle>
      </g>
    </svg>

    <!-- Content -->
    <div class="z-10 relative w-full max-w-2xl">
      <div class="text-7xl font-bold leading-none text-gray-100">
        <div>Welcome to</div>
        <div class="text-blue-500">iHRM</div>
      </div>
      <div class="mt-6 text-lg tracking-tight leading-6 text-gray-400">
        Intelligent Human Resource Management System designed to streamline your HR processes with AI-powered insights and modern workflow management.
      </div>
    </div>
  </div>

</div>
EOF

echo "✅ Sign-in component created"

# =============================================================================
# UPDATE APP CONFIG WITH AUTH INTERCEPTOR
# =============================================================================

# Update app.config.ts to include auth interceptor
cat > app/app.config.ts << 'EOF'
import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { routes } from './app.routes';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { loadingInterceptor } from './core/interceptors/loading.interceptor';
import { authInterceptor } from './core/auth/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([
        authInterceptor,    // Add auth headers
        errorInterceptor,   // Handle errors
        loadingInterceptor  // Manage loading states
      ])
    ),
    provideAnimationsAsync()
  ]
};
EOF

# Update app.routes.ts to include auth routes
cat > app/app.routes.ts << 'EOF'
import { Routes } from '@angular/router';
import { authGuard } from './core/auth/guards/auth.guard';
import { noAuthGuard } from './core/auth/guards/no-auth.guard';

export const routes: Routes = [
  // Redirect empty path to dashboard
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },

  // Auth routes (accessible only when NOT authenticated)
  {
    path: 'auth',
    canActivate: [noAuthGuard],
    children: [
      {
        path: 'sign-in',
        loadComponent: () => import('./modules/auth/sign-in/sign-in.component').then(m => m.SignInComponent)
      },
      {
        path: 'sign-up',
        loadComponent: () => import('./modules/auth/sign-up/sign-up.component').then(m => m.SignUpComponent)
      },
      {
        path: 'forgot-password',
        loadComponent: () => import('./modules/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
      },
      {
        path: 'reset-password',
        loadComponent: () => import('./modules/auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent)
      }
    ]
  },

  // Protected routes (require authentication)
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./modules/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },

  // Change password (special case - authenticated but must change)
  {
    path: 'auth/change-password',
    canActivate: [authGuard],
    loadComponent: () => import('./modules/auth/change-password/change-password.component').then(m => m.ChangePasswordComponent)
  },

  // Signed-in redirect
  {
    path: 'signed-in-redirect',
    pathMatch: 'full',
    redirectTo: '/dashboard'
  },

  // 404 redirect to dashboard
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];
EOF

echo "✅ App configuration updated with auth interceptor and routes"

# =============================================================================
# CREATE BASIC DASHBOARD COMPONENT
# =============================================================================

# Create basic dashboard component directory
mkdir -p app/modules/dashboard

# Create dashboard component
cat > app/modules/dashboard/dashboard.component.ts << 'EOF'
import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/auth/services/auth.service';
import { UserService } from '../../core/auth/services/user.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="flex flex-col flex-auto min-w-0">
      
      <!-- Header -->
      <div class="flex flex-col sm:flex-row flex-0 sm:items-center sm:justify-between p-6 sm:py-8 sm:px-10 border-b bg-card dark:bg-transparent">
        <div class="flex-1 min-w-0">
          <!-- Breadcrumbs -->
          <div class="flex flex-wrap items-center font-medium">
            <div>
              <a class="whitespace-nowrap text-primary-500">iHRM</a>
            </div>
            <div class="flex items-center ml-1 whitespace-nowrap">
              <mat-icon
                class="icon-size-5 text-secondary"
                [svgIcon]="'heroicons_mini:chevron-right'"></mat-icon>
              <a class="ml-1 text-primary-500">Dashboard</a>
            </div>
          </div>
          <!-- Title -->
          <div class="mt-2">
            <h2 class="text-3xl md:text-4xl font-extrabold tracking-tight leading-7 sm:leading-10 truncate">
              Welcome back!
            </h2>
          </div>
        </div>
        
        <!-- Actions -->
        <div class="flex items-center mt-6 sm:mt-0 sm:ml-4">
          <button
            mat-raised-button
            [color]="'primary'"
            (click)="signOut()">
            <mat-icon [svgIcon]="'heroicons_outline:arrow-right-on-rectangle'"></mat-icon>
            <span class="ml-2">Sign out</span>
          </button>
        </div>
      </div>

      <!-- Main -->
      <div class="flex-auto p-6 sm:p-10">
        
        <!-- User info card -->
        <div class="bg-card shadow rounded-2xl p-6 mb-6" *ngIf="userService.user$ | async as user">
          <h3 class="text-lg font-medium mb-4">User Information</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="text-sm font-medium text-secondary">Name</label>
              <p class="text-lg">{{ user.name }}</p>
            </div>
            <div>
              <label class="text-sm font-medium text-secondary">Email/Phone</label>
              <p class="text-lg">{{ user.identifier }}</p>
            </div>
            <div>
              <label class="text-sm font-medium text-secondary">Type</label>
              <p class="text-lg capitalize">{{ user.type }}</p>
            </div>
            <div>
              <label class="text-sm font-medium text-secondary">Role</label>
              <p class="text-lg">{{ user.current_tenant_context?.role || 'N/A' }}</p>
            </div>
          </div>
        </div>

        <!-- Tenant info card -->
        <div class="bg-card shadow rounded-2xl p-6 mb-6" *ngIf="userService.currentTenant$ | async as tenant">
          <h3 class="text-lg font-medium mb-4">Organization Information</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="text-sm font-medium text-secondary">Name</label>
              <p class="text-lg">{{ tenant.name }}</p>
            </div>
            <div>
              <label class="text-sm font-medium text-secondary">Status</label>
              <p class="text-lg">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      [class]="tenant.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
                  {{ tenant.is_active ? 'Active' : 'Inactive' }}
                </span>
              </p>
            </div>
          </div>
        </div>

        <!-- Quick stats -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div class="bg-card shadow rounded-2xl p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <mat-icon class="text-primary-600 text-2xl">people</mat-icon>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-secondary">Total Users</p>
                <p class="text-2xl font-semibold">-</p>
              </div>
            </div>
          </div>

          <div class="bg-card shadow rounded-2xl p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <mat-icon class="text-green-600 text-2xl">work</mat-icon>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-secondary">Active Jobs</p>
                <p class="text-2xl font-semibold">-</p>
              </div>
            </div>
          </div>

          <div class="bg-card shadow rounded-2xl p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <mat-icon class="text-blue-600 text-2xl">person_add</mat-icon>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-secondary">Candidates</p>
                <p class="text-2xl font-semibold">-</p>
              </div>
            </div>
          </div>

          <div class="bg-card shadow rounded-2xl p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <mat-icon class="text-purple-600 text-2xl">event</mat-icon>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-secondary">Interviews</p>
                <p class="text-2xl font-semibold">-</p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit {

  constructor(
    public authService: AuthService,
    public userService: UserService
  ) {}

  ngOnInit(): void {
    // Load current user data
    this.userService.getCurrentUser().subscribe();
  }

  signOut(): void {
    this.authService.signOut().subscribe();
  }
}
EOF

echo "✅ Basic dashboard component created"

echo ""
echo "🎉 Phase 2: Authentication System completed successfully!"
echo ""
echo "📂 Created authentication system:"
echo "   ✅ JWT-based authentication service"
echo "   ✅ User and tenant management"
echo "   ✅ Route guards for protected/public routes"
echo "   ✅ Auth interceptor for automatic token handling"
echo "   ✅ Sign-in component with Material Design"
echo "   ✅ Basic dashboard component"
echo ""
echo "🔐 Features included:"
echo "   • Login/logout with JWT tokens"
echo "   • Automatic token refresh"
echo "   • Password change flow"
echo "   • Multi-tenant support"
echo "   • Permission-based access"
echo "   • Route protection"
echo ""
echo "🚀 Next steps:"
echo "   1. Create sign-up, forgot-password components"
echo "   2. Test authentication flow"
echo "   3. Create basic UI components (Phase 3)"
echo ""
echo "💡 Authentication system provides:"
echo "   • Secure JWT token management"
echo "   • Automatic logout on token expiry"
echo "   • Multi-tenant context switching"
echo "   • Role and permission checking"
echo "   • Laravel JWT backend integration"