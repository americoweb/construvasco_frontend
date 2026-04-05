#!/bin/bash

# Phase 1: Core Foundation Setup Script
# Run this script from the src/ directory
# Usage: chmod +x phase1-foundation.sh && ./phase1-foundation.sh

echo "🚀 Creating Phase 1: Core Foundation Structure..."

# Create directory structure
mkdir -p app/core/models
mkdir -p app/core/services
mkdir -p app/core/interceptors
mkdir -p app/shared/services
mkdir -p app/shared/models
mkdir -p app/shared/constants
mkdir -p app/shared/utils
mkdir -p environments

echo "📁 Directory structure created"

# =============================================================================
# CORE MODELS
# =============================================================================

# Create api.types.ts
cat > app/core/models/api.types.ts << 'EOF'
export interface ApiResponse<T> {
  data?: T;
  items?: T;
  meta?: PaginationInfo;
  message?: string;
  success?: boolean;
  errors?: ValidationError[];
}

export interface PaginationInfo {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from?: number;
  to?: number;
}

export interface ValidationError {
  field: string;
  type: string;
  message: string;
}

export interface Identifiable {
  id: string | number;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}
EOF

# Create common.types.ts
cat > app/core/models/common.types.ts << 'EOF'
export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar?: string;
  role: string;
  permissions: string[];
  tenant_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  settings: TenantSettings;
  created_at: string;
  updated_at: string;
}

export interface TenantSettings {
  theme?: string;
  features: {
    ai_enabled: boolean;
    analytics_enabled: boolean;
    multi_language: boolean;
  };
  branding?: {
    primary_color?: string;
    logo_url?: string;
    favicon_url?: string;
  };
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  timestamp: Date;
  read: boolean;
  action?: {
    label: string;
    url: string;
  };
}

export interface Breadcrumb {
  label: string;
  url?: string;
  active?: boolean;
}
EOF

# Create app-config.interface.ts
cat > app/core/models/app-config.interface.ts << 'EOF'
export interface AppConfig {
  production: boolean;
  apiURL: {
    root: string;
    auth?: string;
    uploads?: string;
  };
  features: {
    aiEnabled: boolean;
    analytics: boolean;
    debugging: boolean;
    multiTenant: boolean;
  };
  app: {
    name: string;
    version: string;
    description?: string;
  };
  external?: {
    sentry?: {
      dsn: string;
    };
    analytics?: {
      google_analytics_id?: string;
    };
  };
}
EOF

echo "✅ Core models created"

# =============================================================================
# CORE SERVICES
# =============================================================================

# Create config.service.ts
cat > app/core/services/config.service.ts << 'EOF'
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AppConfig } from '../models/app-config.interface';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private config: AppConfig = environment;
  private configSubject = new BehaviorSubject<AppConfig>(this.config);

  get config$() {
    return this.configSubject.asObservable();
  }

  getConfig(): AppConfig {
    return this.config;
  }

  updateConfig(updates: Partial<AppConfig>): void {
    this.config = { ...this.config, ...updates };
    this.configSubject.next(this.config);
  }

  isProduction(): boolean {
    return this.config.production;
  }

  getApiUrl(endpoint?: string): string {
    const baseUrl = this.config.apiURL.root;
    return endpoint ? `${baseUrl}/${endpoint}` : baseUrl;
  }

  isFeatureEnabled(feature: keyof AppConfig['features']): boolean {
    return this.config.features[feature] || false;
  }
}
EOF

# Create logging.service.ts
cat > app/core/services/logging.service.ts << 'EOF'
import { Injectable } from '@angular/core';
import { ConfigService } from './config.service';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

@Injectable({
  providedIn: 'root'
})
export class LoggingService {
  private logLevel: LogLevel = LogLevel.DEBUG;

  constructor(private configService: ConfigService) {
    this.logLevel = this.configService.isProduction() ? LogLevel.WARN : LogLevel.DEBUG;
  }

  debug(message: string, ...args: any[]): void {
    if (this.logLevel <= LogLevel.DEBUG) {
      console.log(`🐛 [DEBUG] ${message}`, ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.logLevel <= LogLevel.INFO) {
      console.info(`ℹ️ [INFO] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.logLevel <= LogLevel.WARN) {
      console.warn(`⚠️ [WARN] ${message}`, ...args);
    }
  }

  error(message: string, error?: any, ...args: any[]): void {
    if (this.logLevel <= LogLevel.ERROR) {
      console.error(`❌ [ERROR] ${message}`, error, ...args);
      
      // In production, send to external service (Sentry, etc.)
      if (this.configService.isProduction()) {
        this.sendToExternalService(message, error);
      }
    }
  }

  private sendToExternalService(message: string, error?: any): void {
    // TODO: Implement external error reporting (Sentry, LogRocket, etc.)
    // For now, just keep in console
    console.error('External logging:', { message, error });
  }
}
EOF

# Create notification.service.ts
cat > app/core/services/notification.service.ts << 'EOF'
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Notification } from '../models/common.types';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notifications = new BehaviorSubject<Notification[]>([]);
  private autoHideTimeout = 5000; // 5 seconds

  get notifications$() {
    return this.notifications.asObservable();
  }

  show(notification: Partial<Notification>): void {
    const newNotification: Notification = {
      id: this.generateId(),
      title: notification.title || '',
      message: notification.message || '',
      type: notification.type || 'info',
      timestamp: new Date(),
      read: false,
      ...notification
    };

    const current = this.notifications.value;
    this.notifications.next([...current, newNotification]);

    // Auto-hide after timeout
    if (newNotification.type !== 'error') {
      setTimeout(() => {
        this.remove(newNotification.id);
      }, this.autoHideTimeout);
    }
  }

  success(message: string, title?: string): void {
    this.show({ message, title, type: 'success' });
  }

  error(message: string, title?: string): void {
    this.show({ message, title, type: 'error' });
  }

  warning(message: string, title?: string): void {
    this.show({ message, title, type: 'warning' });
  }

  info(message: string, title?: string): void {
    this.show({ message, title, type: 'info' });
  }

  remove(id: string): void {
    const current = this.notifications.value;
    this.notifications.next(current.filter(n => n.id !== id));
  }

  clear(): void {
    this.notifications.next([]);
  }

  markAsRead(id: string): void {
    const current = this.notifications.value;
    const updated = current.map(n => 
      n.id === id ? { ...n, read: true } : n
    );
    this.notifications.next(updated);
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
EOF

echo "✅ Core services created"

# =============================================================================
# INTERCEPTORS
# =============================================================================

# Create error.interceptor.ts
cat > app/core/interceptors/error.interceptor.ts << 'EOF'
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { LoggingService } from '../services/logging.service';
import { NotificationService } from '../services/notification.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const loggingService = inject(LoggingService);
  const notificationService = inject(NotificationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An unexpected error occurred';

      // Handle different error types
      if (error.error instanceof ErrorEvent) {
        // Client-side error
        errorMessage = `Client Error: ${error.error.message}`;
      } else {
        // Server-side error
        switch (error.status) {
          case 400:
            errorMessage = error.error?.message || 'Bad Request';
            break;
          case 401:
            errorMessage = 'Unauthorized - Please login again';
            break;
          case 403:
            errorMessage = 'Access denied - You do not have permission';
            break;
          case 404:
            errorMessage = 'Resource not found';
            break;
          case 422:
            errorMessage = error.error?.message || 'Validation failed';
            break;
          case 500:
            errorMessage = 'Server error - Please try again later';
            break;
          default:
            errorMessage = error.error?.message || `Error ${error.status}: ${error.statusText}`;
        }
      }

      // Log the error
      loggingService.error('HTTP Error:', error);

      // Show user notification (except for 401 which should be handled by auth)
      if (error.status !== 401) {
        notificationService.error(errorMessage);
      }

      return throwError(() => error);
    })
  );
};
EOF

# Create loading.interceptor.ts
cat > app/core/interceptors/loading.interceptor.ts << 'EOF'
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { LoadingService } from '../../shared/services/loading.service';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loadingService = inject(LoadingService);

  // Skip loading for certain requests
  if (req.headers.has('skip-loading')) {
    return next(req);
  }

  loadingService.show();

  return next(req).pipe(
    finalize(() => {
      loadingService.hide();
    })
  );
};
EOF

echo "✅ Interceptors created"

# =============================================================================
# SHARED SERVICES
# =============================================================================

# Create base.service.ts
cat > app/shared/services/base.service.ts << 'EOF'
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError, finalize, map } from 'rxjs/operators';
import { Identifiable, ApiResponse, PaginationInfo } from '../../core/models/api.types';
import { ConfigService } from '../../core/services/config.service';
import { LoggingService } from '../../core/services/logging.service';

@Injectable({
  providedIn: 'root'
})
export class BaseService<T extends Identifiable> {
  public baseUrl: string;
  public item = new BehaviorSubject<T | null>(null);
  public items = new BehaviorSubject<T[]>([]);
  public loading = new BehaviorSubject<boolean>(false);
  public pagination = new BehaviorSubject<PaginationInfo>({
    current_page: 1,
    per_page: 10,
    total: 0,
    last_page: 1
  });

  constructor(
    protected httpClient: HttpClient,
    protected configService: ConfigService,
    protected logger: LoggingService,
    baseUrl: string,
    protected idKey: string = 'id'
  ) {
    this.baseUrl = this.configService.getApiUrl(baseUrl);
  }

  // Observable getters
  get item$(): Observable<T | null> {
    return this.item.asObservable();
  }

  get items$(): Observable<T[]> {
    return this.items.asObservable();
  }

  get loading$(): Observable<boolean> {
    return this.loading.asObservable();
  }

  get pagination$(): Observable<PaginationInfo> {
    return this.pagination.asObservable();
  }

  // CRUD operations
  get(params: any = {}): Observable<ApiResponse<T[]>> {
    this.loading.next(true);
    return this.httpClient.get<ApiResponse<T[]>>(this.baseUrl, { params }).pipe(
      tap(response => {
        this.items.next(response.data || response.items || []);
        if (response.meta) {
          this.pagination.next(response.meta);
        }
      }),
      catchError(error => {
        this.logger.error('Failed to fetch items', error);
        return throwError(() => error);
      }),
      finalize(() => this.loading.next(false))
    );
  }

  getOne(id: any): Observable<ApiResponse<T>> {
    this.loading.next(true);
    return this.httpClient.get<ApiResponse<T>>(`${this.baseUrl}/${id}`).pipe(
      tap(response => {
        if (response.data) {
          this.item.next(response.data);
        }
      }),
      catchError(error => {
        this.logger.error(`Failed to fetch item ${id}`, error);
        return throwError(() => error);
      }),
      finalize(() => this.loading.next(false))
    );
  }

  create(item: Partial<T>): Observable<ApiResponse<T>> {
    this.loading.next(true);
    return this.httpClient.post<ApiResponse<T>>(this.baseUrl, item).pipe(
      tap(response => {
        this.logger.info('Item created successfully');
        this.refreshList();
      }),
      catchError(error => {
        this.logger.error('Failed to create item', error);
        return throwError(() => error);
      }),
      finalize(() => this.loading.next(false))
    );
  }

  update(id: any, item: Partial<T>): Observable<ApiResponse<T>> {
    this.loading.next(true);
    return this.httpClient.put<ApiResponse<T>>(`${this.baseUrl}/${id}`, item).pipe(
      tap(response => {
        this.logger.info('Item updated successfully');
        if (response.data) {
          this.item.next(response.data);
        }
        this.refreshList();
      }),
      catchError(error => {
        this.logger.error(`Failed to update item ${id}`, error);
        return throwError(() => error);
      }),
      finalize(() => this.loading.next(false))
    );
  }

  delete(id: string | number): Observable<any> {
    this.loading.next(true);
    return this.httpClient.delete(`${this.baseUrl}/${id}`).pipe(
      tap(() => {
        this.logger.info('Item deleted successfully');
        const currentItems = this.items.value;
        const updatedItems = currentItems.filter(item => item[this.idKey] !== id);
        this.items.next(updatedItems);
      }),
      catchError(error => {
        this.logger.error(`Failed to delete item ${id}`, error);
        return throwError(() => error);
      }),
      finalize(() => this.loading.next(false))
    );
  }

  // Utility methods
  refreshList(): void {
    const currentPagination = this.pagination.value;
    this.get({
      page: currentPagination.current_page,
      per_page: currentPagination.per_page
    }).subscribe();
  }

  resetState(): void {
    this.item.next(null);
    this.items.next([]);
    this.loading.next(false);
    this.pagination.next({
      current_page: 1,
      per_page: 10,
      total: 0,
      last_page: 1
    });
  }
}
EOF

# Create permission.service.ts
cat > app/shared/services/permission.service.ts << 'EOF'
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  private permissions = new BehaviorSubject<string[]>([]);
  private roles = new BehaviorSubject<string[]>([]);

  get permissions$(): Observable<string[]> {
    return this.permissions.asObservable();
  }

  get roles$(): Observable<string[]> {
    return this.roles.asObservable();
  }

  setPermissions(permissions: string[]): void {
    this.permissions.next(permissions);
  }

  setRoles(roles: string[]): void {
    this.roles.next(roles);
  }

  hasPermission(permission: string | string[]): Observable<boolean> {
    const permissionsToCheck = Array.isArray(permission) ? permission : [permission];
    
    return this.permissions$.pipe(
      map(userPermissions => {
        return permissionsToCheck.some(p => userPermissions.includes(p));
      })
    );
  }

  hasRole(role: string | string[]): Observable<boolean> {
    const rolesToCheck = Array.isArray(role) ? role : [role];
    
    return this.roles$.pipe(
      map(userRoles => {
        return rolesToCheck.some(r => userRoles.includes(r));
      })
    );
  }

  checkMultiplePermissions(permissionMap: { [key: string]: string | string[] }): Observable<{ [key: string]: boolean }> {
    return this.permissions$.pipe(
      map(userPermissions => {
        const result: { [key: string]: boolean } = {};
        
        Object.entries(permissionMap).forEach(([key, permissions]) => {
          const permsToCheck = Array.isArray(permissions) ? permissions : [permissions];
          result[key] = permsToCheck.some(p => userPermissions.includes(p));
        });
        
        return result;
      })
    );
  }
}
EOF

# Create loading.service.ts (needed by loading interceptor)
cat > app/shared/services/loading.service.ts << 'EOF'
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private loadingCount = 0;

  get loading$() {
    return this.loadingSubject.asObservable();
  }

  show(): void {
    this.loadingCount++;
    this.loadingSubject.next(true);
  }

  hide(): void {
    this.loadingCount = Math.max(0, this.loadingCount - 1);
    if (this.loadingCount === 0) {
      this.loadingSubject.next(false);
    }
  }

  reset(): void {
    this.loadingCount = 0;
    this.loadingSubject.next(false);
  }
}
EOF

echo "✅ Shared services created"

# =============================================================================
# SHARED MODELS
# =============================================================================

# Create base.interface.ts
cat > app/shared/models/base.interface.ts << 'EOF'
export interface BaseEntity {
  id: string | number;
  created_at?: string;
  updated_at?: string;
}

export interface TimestampedEntity extends BaseEntity {
  created_at: string;
  updated_at: string;
}

export interface NamedEntity extends BaseEntity {
  name: string;
  description?: string;
}

export interface SoftDeletableEntity extends TimestampedEntity {
  deleted_at?: string;
}
EOF

# Create api-response.interface.ts
cat > app/shared/models/api-response.interface.ts << 'EOF'
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
  meta?: any;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    details?: any;
  };
  errors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export type ApiResult<T> = ApiSuccessResponse<T> | ApiErrorResponse;
EOF

# Create pagination.interface.ts
cat > app/shared/models/pagination.interface.ts << 'EOF'
export interface PaginationMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number;
  to: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
  links?: {
    first: string;
    last: string;
    prev?: string;
    next?: string;
  };
}

export interface PaginationParams {
  page?: number;
  per_page?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}
EOF

echo "✅ Shared models created"

# =============================================================================
# CONSTANTS
# =============================================================================

# Create api-endpoints.ts
cat > app/shared/constants/api-endpoints.ts << 'EOF'
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: 'auth/login',
    REGISTER: 'auth/register',
    REFRESH: 'auth/refresh',
    LOGOUT: 'auth/logout',
    PROFILE: 'auth/profile'
  },
  USERS: {
    BASE: 'users',
    PROFILE: (id: string) => `users/${id}/profile`,
    PERMISSIONS: (id: string) => `users/${id}/permissions`
  },
  CANDIDATES: {
    BASE: 'candidates',
    PROFILE: (id: string) => `candidates/${id}/profile`,
    RESUME: (id: string) => `candidates/${id}/resume`,
    KANBAN: 'candidates/kanban'
  },
  JOBS: {
    BASE: 'jobs',
    MATCHES: (id: string) => `jobs/${id}/matches`,
    PUBLISH: (id: string) => `jobs/${id}/publish`
  },
  COMMON: {
    UPLOAD: 'upload',
    SEARCH: 'search',
    EXPORT: 'export'
  }
} as const;
EOF

# Create app.constants.ts
cat > app/shared/constants/app.constants.ts << 'EOF'
export const APP_CONSTANTS = {
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 10,
    PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
    MAX_PAGE_SIZE: 100
  },
  
  VALIDATION: {
    MIN_PASSWORD_LENGTH: 8,
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif'],
    ALLOWED_DOCUMENT_TYPES: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
  },
  
  TIMEOUTS: {
    API_TIMEOUT: 30000, // 30 seconds
    TOAST_TIMEOUT: 5000, // 5 seconds
    DEBOUNCE_TIME: 300   // 300ms
  },
  
  STORAGE_KEYS: {
    AUTH_TOKEN: 'auth_token',
    USER_PREFERENCES: 'user_preferences',
    THEME: 'theme',
    LANGUAGE: 'language'
  }
} as const;
EOF

# Create status-codes.ts
cat > app/shared/constants/status-codes.ts << 'EOF'
export const STATUS_CODES = {
  CANDIDATE: {
    SOURCED: 'sourced',
    SCREENING: 'screening',
    INTERVIEWING: 'interviewing',
    OFFER: 'offer',
    HIRED: 'hired',
    REJECTED: 'rejected'
  },
  
  JOB: {
    DRAFT: 'draft',
    ACTIVE: 'active',
    ON_HOLD: 'on_hold',
    FILLED: 'filled',
    CANCELLED: 'cancelled'
  },
  
  INTERVIEW: {
    SCHEDULED: 'scheduled',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
  },
  
  APPLICATION: {
    PENDING: 'pending',
    REVIEWING: 'reviewing',
    SHORTLISTED: 'shortlisted',
    REJECTED: 'rejected'
  }
} as const;

export const STATUS_LABELS = {
  CANDIDATE: {
    [STATUS_CODES.CANDIDATE.SOURCED]: 'Sourced',
    [STATUS_CODES.CANDIDATE.SCREENING]: 'Screening',
    [STATUS_CODES.CANDIDATE.INTERVIEWING]: 'Interviewing',
    [STATUS_CODES.CANDIDATE.OFFER]: 'Offer Stage',
    [STATUS_CODES.CANDIDATE.HIRED]: 'Hired',
    [STATUS_CODES.CANDIDATE.REJECTED]: 'Rejected'
  },
  
  JOB: {
    [STATUS_CODES.JOB.DRAFT]: 'Draft',
    [STATUS_CODES.JOB.ACTIVE]: 'Active',
    [STATUS_CODES.JOB.ON_HOLD]: 'On Hold',
    [STATUS_CODES.JOB.FILLED]: 'Filled',
    [STATUS_CODES.JOB.CANCELLED]: 'Cancelled'
  }
} as const;
EOF

echo "✅ Constants created"

# =============================================================================
# UTILS
# =============================================================================

# Create date.utils.ts
cat > app/shared/utils/date.utils.ts << 'EOF'
export class DateUtils {
  static formatDate(date: string | Date, format: string = 'MMM dd, yyyy'): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Simple formatting - in real app, use date-fns or moment.js
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    };
    
    return dateObj.toLocaleDateString('en-US', options);
  }
  
  static formatDateTime(date: string | Date): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    };
    
    return dateObj.toLocaleDateString('en-US', options);
  }
  
  static timeAgo(date: string | Date): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInMs = now.getTime() - dateObj.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} days ago`;
    
    return this.formatDate(dateObj);
  }
  
  static isToday(date: string | Date): boolean {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const today = new Date();
    
    return dateObj.toDateString() === today.toDateString();
  }
  
  static addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }
}
EOF

# Create validation.utils.ts
cat > app/shared/utils/validation.utils.ts << 'EOF'
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export class ValidationUtils {
  static email(control: AbstractControl): ValidationErrors | null {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    if (!control.value) return null;
    
    return emailRegex.test(control.value) ? null : { email: true };
  }
  
  static minLength(length: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      
      return control.value.length >= length ? null : { 
        minLength: { 
          requiredLength: length, 
          actualLength: control.value.length 
        } 
      };
    };
  }
  
  static maxLength(length: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      
      return control.value.length <= length ? null : { 
        maxLength: { 
          requiredLength: length, 
          actualLength: control.value.length 
        } 
      };
    };
  }
  
  static phoneNumber(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    
    // Simple phone validation - adjust regex based on requirements
    const phoneRegex = /^[+]?[\d\s\-\(\)]{10,}$/;
    
    return phoneRegex.test(control.value) ? null : { phoneNumber: true };
  }
  
  static matchFields(field1: string, field2: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value1 = control.get(field1)?.value;
      const value2 = control.get(field2)?.value;
      
      return value1 === value2 ? null : { matchFields: true };
    };
  }
  
  static fileSize(maxSizeInMB: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const file = control.value as File;
      
      if (!file) return null;
      
      const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
      
      return file.size <= maxSizeInBytes ? null : { 
        fileSize: { 
          maxSize: maxSizeInMB, 
          actualSize: Math.round(file.size / 1024 / 1024 * 100) / 100 
        } 
      };
    };
  }
  
  static fileType(allowedTypes: string[]): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const file = control.value as File;
      
      if (!file) return null;
      
      return allowedTypes.includes(file.type) ? null : { 
        fileType: { 
          allowedTypes, 
          actualType: file.type 
        } 
      };
    };
  }
}
EOF

# Create format.utils.ts
cat > app/shared/utils/format.utils.ts << 'EOF'
export class FormatUtils {
  static currency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }
  
  static number(value: number, options?: Intl.NumberFormatOptions): string {
    return new Intl.NumberFormat('en-US', options).format(value);
  }
  
  static percentage(value: number, decimals: number = 1): string {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value / 100);
  }
  
  static fileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  static truncate(text: string, length: number = 50): string {
    if (!text) return '';
    return text.length > length ? text.substring(0, length) + '...' : text;
  }
  
  static initials(firstName: string, lastName: string): string {
    const first = firstName?.charAt(0)?.toUpperCase() || '';
    const last = lastName?.charAt(0)?.toUpperCase() || '';
    return first + last;
  }
  
  static slug(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  
  static capitalize(text: string): string {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  }
  
  static camelToTitle(camelCase: string): string {
    return camelCase
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }
}
EOF

echo "✅ Utils created"

# =============================================================================
# ENVIRONMENTS
# =============================================================================

# Create environment.ts
cat > environments/environment.ts << 'EOF'
import { AppConfig } from '../app/core/models/app-config.interface';

export const environment: AppConfig = {
  production: false,
  apiURL: {
    root: 'http://localhost:8000/api',
    auth: 'http://localhost:8000/auth',
    uploads: 'http://localhost:8000/uploads'
  },
  features: {
    aiEnabled: true,
    analytics: false,
    debugging: true,
    multiTenant: true
  },
  app: {
    name: 'iHRM Development',
    version: '1.0.0-dev',
    description: 'Intelligent Human Resource Management System'
  },
  external: {
    sentry: {
      dsn: '' // Add your Sentry DSN for error tracking
    },
    analytics: {
      google_analytics_id: '' // Add your GA ID
    }
  }
};
EOF

# Create environment.prod.ts
cat > environments/environment.prod.ts << 'EOF'
import { AppConfig } from '../app/core/models/app-config.interface';

export const environment: AppConfig = {
  production: true,
  apiURL: {
    root: 'https://api.ihrm.com/api',
    auth: 'https://api.ihrm.com/auth',
    uploads: 'https://api.ihrm.com/uploads'
  },
  features: {
    aiEnabled: true,
    analytics: true,
    debugging: false,
    multiTenant: true
  },
  app: {
    name: 'iHRM',
    version: '1.0.0',
    description: 'Intelligent Human Resource Management System'
  },
  external: {
    sentry: {
      dsn: 'YOUR_SENTRY_DSN_HERE'
    },
    analytics: {
      google_analytics_id: 'YOUR_GA_ID_HERE'
    }
  }
};
EOF

echo "✅ Environment files created"

# =============================================================================
# APP CONFIG FILES
# =============================================================================

# Create app.config.ts
cat > app/app.config.ts << 'EOF'
import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { routes } from './app.routes';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { loadingInterceptor } from './core/interceptors/loading.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([
        errorInterceptor,
        loadingInterceptor
      ])
    ),
    provideAnimationsAsync()
  ]
};
EOF

# Create app.routes.ts
cat > app/app.routes.ts << 'EOF'
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./modules/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  // Add more routes as modules are created
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];
EOF

echo "✅ App configuration files created"

echo ""
echo "🎉 Phase 1: Core Foundation completed successfully!"
echo ""
echo "📂 Created directory structure:"
echo "   ✅ Core models, services, and interceptors"
echo "   ✅ Shared services, models, constants, and utils"
echo "   ✅ Environment configurations"
echo "   ✅ App configuration and routing"
echo ""
echo "🚀 Next steps:"
echo "   1. Run: ng serve"
echo "   2. Create authentication module (Phase 2)"
echo "   3. Create basic UI components (Phase 3)"
echo ""
echo "💡 Foundation provides:"
echo "   • Generic CRUD service for any entity"
echo "   • Global error handling and notifications"
echo "   • Logging and configuration services"
echo "   • Validation and formatting utilities"
echo "   • Consistent API response handling"