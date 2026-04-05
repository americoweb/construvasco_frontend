import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil } from 'rxjs';
import { PermissionMatrixService } from '../../../shared/services/permission-matrix.service';
import { 
  PermissionMatrix, 
  Role, 
  Permission, 
  PermissionMatrixState,
  PermissionCategory 
} from '../../../shared/interfaces/permission.interface'; 
import { ButtonComponent } from 'app/shared/components';

@Component({
  selector: 'app-permissions',
  templateUrl: './permissions.component.html',
  styleUrls: ['./permissions.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    ButtonComponent
  ]
})
export class PermissionsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  state: PermissionMatrixState = {
    loading: false,
    error: null,
    matrix: null,
    selectedRole: null,
    editingRole: null,
    showUserPermissions: false,
    selectedUser: null
  };

  categories: PermissionCategory[] = [];
  roles: Role[] = [];
  selectedPermissions: { [roleId: number]: string[] } = {};

  constructor(private permissionService: PermissionMatrixService) {}

  ngOnInit(): void {
    this.loadPermissionMatrix();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadPermissionMatrix(): void {
    this.state.loading = true;
    this.state.error = null;

    this.permissionService.getMatrix()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (matrix: PermissionMatrix) => {
          this.state.matrix = matrix;
          this.roles = matrix.roles;
          this.categories = this.buildCategories(matrix);
          this.initializeSelectedPermissions();
          this.state.loading = false;
        },
        error: (error) => {
          this.state.error = 'Erro ao carregar matriz de permissões';
          this.state.loading = false;
          console.error('Error loading permission matrix:', error);
        }
      });
  }

  buildCategories(matrix: PermissionMatrix): PermissionCategory[] {
    return matrix.categories.map(category => ({
      name: category,
      permissions: matrix.permissions[category] || [],
      expanded: false
    }));
  }

  initializeSelectedPermissions(): void {
    this.roles.forEach(role => {
      this.selectedPermissions[role.id] = [...role.permissions];
    });
  }

  toggleCategory(category: PermissionCategory): void {
    category.expanded = !category.expanded;
  }

  selectRole(role: Role): void {
    this.state.selectedRole = role;
    this.state.editingRole = { ...role };
  }

  isRoleSelected(role: Role): boolean {
    return this.state.selectedRole?.id === role.id;
  }

  hasPermission(role: Role, permissionName: string): boolean {
    return this.selectedPermissions[role.id]?.includes(permissionName) || false;
  }

  togglePermission(role: Role, permissionName: string): void {
    if (role.is_system) {
      return; // Cannot modify system roles
    }

    const rolePermissions = this.selectedPermissions[role.id] || [];
    const index = rolePermissions.indexOf(permissionName);
    
    if (index > -1) {
      rolePermissions.splice(index, 1);
    } else {
      rolePermissions.push(permissionName);
    }
    
    this.selectedPermissions[role.id] = rolePermissions;
  }

  hasCategoryPermission(role: Role, category: string): boolean {
    const categoryPermissions = this.permissionService.getCategoryPermissions(this.state.matrix!, category);
    return categoryPermissions.some(permission => this.hasPermission(role, permission));
  }

  toggleCategoryPermissions(role: Role, category: string, checked: boolean): void {
    if (role.is_system) {
      return; // Cannot modify system roles
    }

    const categoryPermissions = this.permissionService.getCategoryPermissions(this.state.matrix!, category);
    const rolePermissions = this.selectedPermissions[role.id] || [];

    if (checked) {
      // Add all category permissions
      categoryPermissions.forEach(permission => {
        if (!rolePermissions.includes(permission)) {
          rolePermissions.push(permission);
        }
      });
    } else {
      // Remove all category permissions
      categoryPermissions.forEach(permission => {
        const index = rolePermissions.indexOf(permission);
        if (index > -1) {
          rolePermissions.splice(index, 1);
        }
      });
    }

    this.selectedPermissions[role.id] = rolePermissions;
  }

  saveRolePermissions(role: Role): void {
    if (role.is_system) {
      return;
    }

    const permissions = this.selectedPermissions[role.id] || [];
    
    this.permissionService.updateRolePermissions(role.id, permissions)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Update the role with new permissions
          const updatedRole = this.roles.find(r => r.id === role.id);
          if (updatedRole) {
            updatedRole.permissions = permissions;
            updatedRole.permission_count = permissions.length;
          }
          
          this.state.selectedRole = null;
          this.state.editingRole = null;
          
          // Show success message (you can implement a toast service)
          console.log('Role permissions updated successfully');
        },
        error: (error) => {
          console.error('Error updating role permissions:', error);
          // Reset to original permissions
          this.selectedPermissions[role.id] = [...role.permissions];
        }
      });
  }

  cancelEdit(): void {
    if (this.state.selectedRole) {
      this.selectedPermissions[this.state.selectedRole.id] = [...this.state.selectedRole.permissions];
    }
    this.state.selectedRole = null;
    this.state.editingRole = null;
  }

  getPermissionDisplayName(permissionName: string): string {
    return this.permissionService.getPermissionDisplayName(permissionName);
  }

  getCategoryDisplayName(category: string): string {
    return this.permissionService.getCategoryDisplayName(category);
  }

  getRolePermissionCount(role: Role): number {
    return this.selectedPermissions[role.id]?.length || 0;
  }

  isRoleModified(role: Role): boolean {
    const originalPermissions = role.permissions;
    const currentPermissions = this.selectedPermissions[role.id] || [];
    
    if (originalPermissions.length !== currentPermissions.length) {
      return true;
    }
    
    return originalPermissions.some(permission => !currentPermissions.includes(permission)) ||
           currentPermissions.some(permission => !originalPermissions.includes(permission));
  }

  canEditRole(role: Role): boolean {
    return !role.is_system;
  }
}