export interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  is_active: boolean;
  settings: TenantSettings;
  features: string[];
  created_at: string;
  updated_at: string;
}

export interface TenantSettings {
  timezone: string;
  currency: string;
  language: string;
  branding?: {
    logo?: string;
    primary_color?: string;
    secondary_color?: string;
  };
  features: string[];
}

export interface TenantUser {
  user_id: string;
  tenant_id: string;
  role_id: string;
  role: string;
  permissions: string[];
  current_tenant: boolean;
  joined_at: string;
  status: 'active' | 'inactive' | 'suspended';
}

export interface TenantInvitation {
  id: string;
  tenant_id: string;
  email: string;
  role: string;
  permissions: string[];
  invited_by: string;
  expires_at: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  created_at: string;
}
