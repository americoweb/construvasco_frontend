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
