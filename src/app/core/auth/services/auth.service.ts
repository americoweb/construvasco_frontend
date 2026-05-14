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
      // Clear authentication state without navigating
      this.accessToken = null;
      this._authenticated.next(false);
      this._mustChangePassword.next(false);
      this.userService.clearUser();
    }
  }

  // Authentication methods
  signIn(credentials: LoginCredentials) {
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

  changePassword(request: ChangePasswordRequest): Observable<any> {
    return this.httpClient.post(
      this.configService.getApiUrl('auth/change-password'), 
      request
    ).pipe(
      tap(() => {
        this.notificationService.success('Password changed successfully!');
      }),
      catchError(error => {
        this.logger.error('Change password failed', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Sign in with Google OAuth
   * @param idToken Google ID token from Google Identity Services
   */
  signInWithGoogle(idToken: string): Observable<AuthResponse> {
    if (this._authenticated.value) {
      return throwError(() => new Error('User is already authenticated'));
    }

    return this.httpClient.post<AuthResponse>(
      this.configService.getApiUrl('auth/google'),
      { token: idToken }
    ).pipe(
      tap(response => {
        this.handleAuthSuccess(response);
        this.notificationService.success('Signed in with Google successfully!');
      }),
      catchError(error => {
        this.logger.error('Google sign in failed', error);
        return throwError(() => error);
      })
    );
  }

  // Invitation validation methods
  validateInvitation(token: string): Observable<any> {
    return this.httpClient.get(
      this.configService.getApiUrl(`auth/validate-invitation?token=${token}`)
    ).pipe(
      catchError(error => {
        this.logger.error('Invitation validation failed', error);
        return throwError(() => error);
      })
    );
  }

  validateCompany(companyName: string): Observable<any> {
    return this.httpClient.get(
      this.configService.getApiUrl(`auth/validate-company?company_name=${encodeURIComponent(companyName)}`)
    ).pipe(
      catchError(error => {
        this.logger.error('Company validation failed', error);
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
    // Don't navigate automatically - let the guards handle navigation
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
