import { AppConfig } from '../app/core/models/app-config.interface';

/** Local development — production values live in `environment.prod.ts` (swapped via `angular.json` fileReplacements on `ng build --configuration=production`). */
export const environment: AppConfig = {
  production: false,
  apiURL: {
    root: 'http://127.0.0.1:8000/api',
    auth: 'http://127.0.0.1:8000/api',
    uploads: 'http://127.0.0.1:8000/uploads'
  },
  features: {
    aiEnabled: true,
    analytics: false,
    debugging: true,
    multiTenant: true
  },
  app: {
    name: 'Amazing (local)',
    version: '1.0.0-dev',
    description: 'Amazing storefront — development'
  },
  external: {
    sentry: {
      dsn: ''
    },
    analytics: {
      google_analytics_id: ''
    },
    google: {
      clientId: '813321049421-netg93qbr6piu29gdmr7tui99mvft99b.apps.googleusercontent.com'
    }
  },
  googleClientId: '813321049421-netg93qbr6piu29gdmr7tui99mvft99b.apps.googleusercontent.com'
};
