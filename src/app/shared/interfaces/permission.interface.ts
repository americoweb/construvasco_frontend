export interface Permission {
  id: number;
  name: string;
  category: string;
  description: string;
  guard_name: string;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: number;
  name: string;
  display_name: string;
  description: string;
  is_system: boolean;
  permissions: string[];
  permission_count?: number;
}

export interface PermissionMatrix {
  permissions: { [category: string]: Permission[] };
  roles: Role[];
  categories: string[];
}

export interface RolePermissions {
  role: Role;
  permissions: string[];
}

export interface UserPermissions {
  permissions: string[];
  role: Role | null;
  custom_permissions: {
    granted: string[];
    denied: string[];
  };
  tenant_user: {
    role_id: number;
    permissions: string | null;
  };
}

export interface UpdateRolePermissionsRequest {
  permissions: string[];
}

export interface UpdateUserPermissionsRequest {
  user_id: number;
  granted_permissions: string[];
  denied_permissions: string[];
}

export interface PermissionCategory {
  name: string;
  permissions: Permission[];
  expanded: boolean;
}

export interface PermissionMatrixState {
  loading: boolean;
  error: string | null;
  matrix: PermissionMatrix | null;
  selectedRole: Role | null;
  editingRole: Role | null;
  showUserPermissions: boolean;
  selectedUser: any | null;
} 