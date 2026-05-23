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
    /** When false, public landing/shop routes are disabled; app opens on login + interior. */
    publicSiteEnabled: boolean;
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
    google?: {
      clientId?: string;
    };
  };
  googleClientId?: string;
}
