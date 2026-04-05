import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';

import { ConfigService } from '../../services/config.service';
import { LoggingService } from '../../services/logging.service';
import { User, UserProfile, ApiResponse, AuthMeResponse, TenantUser, TenantInvitation } from '../models/user.interface';
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
    return this.httpClient.get<AuthMeResponse>(
      this.configService.getApiUrl('auth/me')
    ).pipe(
      map(response => {
        // Extract user data and add current_tenant_context
        const user = response.user;
        user.current_tenant_context = response.tenant_context;
        
        // Set current tenant if available
        if (response.current_tenant) {
          this.setCurrentTenant(response.current_tenant);
        }
        
        return user;
      }),
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
    console.log('UserService: updateProfile called with:', profile);
    
    return this.httpClient.put<ApiResponse<User>>(
      this.configService.getApiUrl('user/profile'),
      profile
    ).pipe(
      map(response => {
        console.log('UserService: updateProfile response:', response);
        return response.data;
      }),
      tap(user => {
        this.setUser(user);
        this.logger.info('Profile updated successfully');
      }),
      catchError(error => {
        console.error('UserService: updateProfile error:', error);
        this.logger.error('Failed to update profile', error);
        return throwError(() => error);
      })
    );
  }

  uploadAvatar(file: File): Observable<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('avatar', file);

    return this.httpClient.post<ApiResponse<any>>(
      this.configService.getApiUrl('user/avatar'),
      formData
    ).pipe(
      tap(response => {
        // Update user with new avatar path
        const currentUser = this.user;
        
        if (currentUser && response.data) {
          currentUser.profile_photo_path = response.data.profile_photo_path;
          // Don't set avatar_url as we construct it properly on frontend
          // currentUser.avatar_url = response.data.avatar_url;
          
          this.setUser(currentUser);
        }
        
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
    return this.httpClient.post<ApiResponse<Tenant>>(
      this.configService.getApiUrl('user/switch-tenant'),
      { tenant_id: tenantId }
    ).pipe(
      map(response => response.data),
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
    return this.httpClient.get<ApiResponse<Tenant[]>>(
      this.configService.getApiUrl('user/tenants')
    ).pipe(
      map(response => response.data),
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

  inviteUserToTenant(inviteData: { identifier: string; type: string; role: string }): Observable<ApiResponse<any>> {
    return this.httpClient.post<ApiResponse<any>>(
      this.configService.getApiUrl('tenants/users'),
      inviteData
    ).pipe(
      tap(response => {
        this.logger.info('User invited to tenant successfully');
      }),
      catchError(error => {
        this.logger.error('Failed to invite user to tenant', error);
        return throwError(() => error);
      })
    );
  }

  getTenantInvitations(): Observable<ApiResponse<TenantInvitation[]>> {
    return this.httpClient.get<ApiResponse<TenantInvitation[]>>(
      this.configService.getApiUrl('tenants/invitations')
    );
  }

  getTenantUsers(status: string = 'active'): Observable<ApiResponse<TenantUser[]>> {
    return this.httpClient.get<ApiResponse<TenantUser[]>>(
      this.configService.getApiUrl(`tenants/users?status=${status}`)
    );
  }

  cancelTenantInvitation(invitationId: string): Observable<ApiResponse<any>> {
    return this.httpClient.delete<ApiResponse<any>>(
      this.configService.getApiUrl(`tenants/invitations/${invitationId}`)
    );
  }

  // Settings management
  getSettings(): Observable<ApiResponse<any>> {
    return this.httpClient.get<ApiResponse<any>>(
      this.configService.getApiUrl('user/settings')
    ).pipe(
      catchError(error => {
        this.logger.error('Failed to get settings', error);
        return throwError(() => error);
      })
    );
  }

  updateSettings(settings: any): Observable<ApiResponse<any>> {
    return this.httpClient.put<ApiResponse<any>>(
      this.configService.getApiUrl('user/settings'),
      { settings }
    ).pipe(
      tap(() => {
        this.logger.info('Settings updated successfully');
      }),
      catchError(error => {
        this.logger.error('Failed to update settings', error);
        return throwError(() => error);
      })
    );
  }

  // Address management (stored in settings)
  getAddresses(): Observable<any[]> {
    return this.getSettings().pipe(
      map(response => response.data?.addresses ?? []),
      catchError(error => {
        this.logger.error('Failed to get addresses', error);
        return throwError(() => error);
      })
    );
  }

  saveAddresses(addresses: any[]): Observable<any> {
    return this.updateSettings({ addresses }).pipe(
      tap(() => {
        this.logger.info('Addresses saved successfully');
      }),
      catchError(error => {
        this.logger.error('Failed to save addresses', error);
        return throwError(() => error);
      })
    );
  }
}