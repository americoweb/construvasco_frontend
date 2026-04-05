import { AppConfig } from '../app/core/models/app-config.interface';

export const environment: AppConfig = {
  production: false,
  apiURL: {
    //root: 'http://127.0.0.1:8000/api',
    root: 'https://api.amazing.co.mz/api',
    auth: 'http://127.0.0.1:8000/api', // Auth routes are under /api/auth
    uploads: 'http://127.0.0.1:8000/uploads'
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
    },
    google: {
      clientId: '813321049421-netg93qbr6piu29gdmr7tui99mvft99b.apps.googleusercontent.com'
    }
  },
  // Google Client ID for easier access (also available at external.google.clientId)
  googleClientId: '813321049421-netg93qbr6piu29gdmr7tui99mvft99b.apps.googleusercontent.com'
};
