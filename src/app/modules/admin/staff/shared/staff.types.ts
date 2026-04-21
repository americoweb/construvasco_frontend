export interface StaffRole {
  name: string;
  display_name: string;
}

export interface Staff {
  id: number;
  name: string;
  identifier: string;
  role: StaffRole | null;
  is_active: boolean;
  profile_photo_path: string | null;
  created_at: string;
}

export interface DesignerOption {
  id: number;
  name: string;
  identifier: string;
  profile_photo_path: string | null;
}

export interface CreateStaffPayload {
  name: string;
  identifier: string;
  role: string;
  password: string;
}

export interface UpdateStaffPayload {
  name?: string;
  role?: string;
  is_active?: boolean;
  password?: string;
}

export const STAFF_ROLES: { value: string; label: string }[] = [
  { value: 'admin',           label: 'Administrador' },
  { value: 'designer',        label: 'Designer' },
  { value: 'project_manager', label: 'Gestor de Projecto' },
  { value: 'finance_manager', label: 'Gestor Financeiro' },
  { value: 'team_member',     label: 'Membro de Equipa' },
  { value: 'viewer',          label: 'Visualizador' },
];
