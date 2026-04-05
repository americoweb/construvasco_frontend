import { AppConfig } from '../app/core/models/app-config.interface';

/** Production — used when building with `--configuration=production` (CI / deploy). */
export const environment: AppConfig = {
  production: true,
  apiURL: {
    root: 'https://api.amazing.co.mz/api',
    auth: 'https://api.amazing.co.mz/api',
    uploads: 'https://api.amazing.co.mz/uploads'
  },
  features: {
    aiEnabled: true,
    analytics: true,
    debugging: false,
    multiTenant: true
  },
  app: {
    name: 'Amazing',
    version: '1.0.0',
    description: 'Amazing storefront'
  },
  external: {
    sentry: {
      dsn: 'YOUR_SENTRY_DSN_HERE'
    },
    analytics: {
      google_analytics_id: 'YOUR_GA_ID_HERE'
    },
    google: {
      clientId: '813321049421-netg93qbr6piu29gdmr7tui99mvft99b.apps.googleusercontent.com'
    }
  },
  googleClientId: '813321049421-netg93qbr6piu29gdmr7tui99mvft99b.apps.googleusercontent.com'
};
