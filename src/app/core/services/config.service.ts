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
    // Check if this is an auth endpoint
    if (endpoint && (endpoint.startsWith('auth/') || endpoint.startsWith('/auth/'))) {
      // Use apiURL.auth if specified, otherwise use apiURL.root
      // Both should point to the same base (apiURL.root)
      const baseUrl = this.config.apiURL.root;
      const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
      return `${baseUrl}/${cleanEndpoint}`;
    }
    
    const baseUrl = this.config.apiURL.root;
    if (!endpoint) return baseUrl;
    
    // Remove leading slash if present to avoid double slashes
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    return `${baseUrl}/${cleanEndpoint}`;
  }

  getFileUrl(path: string): string {
    // Get base URL without /api prefix (storage files are served from public directory)
    let baseUrl = this.config.apiURL.root;
    // Remove /api from the end if present
    if (baseUrl.endsWith('/api')) {
      baseUrl = baseUrl.slice(0, -4);
    } else if (baseUrl.endsWith('/api/')) {
      baseUrl = baseUrl.slice(0, -5);
    }
    // Ensure baseUrl doesn't end with a slash
    baseUrl = baseUrl.replace(/\/$/, '');
    // Remove leading slash from path if present
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `${baseUrl}/storage/${cleanPath}`;
  }

  isFeatureEnabled(feature: keyof AppConfig['features']): boolean {
    return this.config.features[feature] || false;
  }
}
