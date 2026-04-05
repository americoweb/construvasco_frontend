export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  settings: TenantSettings;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  features: string[];
}

export interface TenantSettings {
  theme?: string;
  features: string[];
  branding?: {
    primary_color?: string;
    logo_url?: string;
    favicon_url?: string;
  };
  timezone: string;
  currency: string;
  language: string;
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
