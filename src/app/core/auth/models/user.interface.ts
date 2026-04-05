export interface User {
  id: string;
  name: string;
  identifier: string; // email or whatsapp
  type: 'email' | 'whatsapp';
  email?: string; // For compatibility
  profile_photo_path?: string;
  avatar_url?: string; // Full URL for avatar image
  avatar?: string; // Alias for profile_photo_path
  is_active?: boolean;
  verified_at?: string;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
  
  // Profile data from settings
  phone?: string;
  whatsapp?: string;
  company?: string;
  job_title?: string;
  bio?: string;
  settings?: any;
  
  current_tenant_context?: TenantContext;
}

export interface TenantContext {
  tenant_id: string;
  role: string;
  permissions: string[];
  is_owner: boolean;
  custom_permissions: {
    granted: string[];
    denied: string[];
  };
}

export interface UserProfile {
  name?: string;
  phone?: string;
  whatsapp?: string;
  company?: string;
  job_title?: string;
  bio?: string;
  avatar?: string;
  settings?: any;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  errors?: any;
}

export interface AuthMeResponse {
  user: User;
  current_tenant?: any;
  tenant_context?: any;
}

export interface TenantRole {
  id: string;
  name: string;
  display_name: string;
}

export interface TenantUser {
  id: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  email: string;
  profile_photo_path?: string;
  last_login_at?: string;
  is_active?: boolean;
  tenant_role?: TenantRole;
  tenant_status?: string;
  custom_permissions?: string[];
  raw_custom_permissions?: {
    granted?: string[];
    denied?: string[];
  };
  joined_at?: string;
  pivot?: {
    role_id: string;
    status: string;
    joined_at: string;
    permissions?: string;
  };
}

export interface TenantInvitation {
  id: string;
  tenant_id: string;
  identifier: string;
  type: 'email' | 'whatsapp';
  role: string;
  inviter_id: string;
  token: string;
  status: 'pending' | 'accepted' | 'cancelled';
  accepted_at?: string;
  created_at: string;
  updated_at: string;
  inviter?: User;
}
