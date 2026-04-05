import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil } from 'rxjs';
import { PermissionMatrixService } from '../../../../shared/services/permission-matrix.service';
import { ButtonComponent } from 'app/shared/components';
import { CardComponent } from 'app/shared/components';
import { BadgeComponent } from 'app/shared/components';
import { 
  PermissionMatrix, 
  Permission, 
  UserPermissions,
  UpdateUserPermissionsRequest 
} from '../../../../shared/interfaces/permission.interface';
import { TenantUser } from '../../../../core/auth/models/user.interface';

export interface UserPermissionsDialogData {
  user: TenantUser;
}

@Component({
  selector: 'app-user-permissions-dialog',
  templateUrl: './user-permissions-dialog.component.html',
  styleUrls: ['./user-permissions-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatIconModule,
    ButtonComponent,
    CardComponent,
    BadgeComponent
  ]
})
export class UserPermissionsDialogComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  loading = false;
  saving = false;
  error: string | null = null;
  
  matrix: PermissionMatrix | null = null;
  categories: string[] = [];
  userPermissions: UserPermissions | null = null;
  
  selectedPermissions: { [category: string]: string[] } = {};
  customGrantedPermissions: string[] = [];
  customDeniedPermissions: string[] = [];
  
  expandedCategories: { [category: string]: boolean } = {};

  constructor(
    public dialogRef: MatDialogRef<UserPermissionsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: UserPermissionsDialogData,
    private permissionService: PermissionMatrixService
  ) {}

  ngOnInit(): void {
    this.loadPermissionData();
    this.initializeUserCustomPermissions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadPermissionData(): void {
    this.loading = true;
    this.error = null;

    // Load permission matrix
    this.permissionService.getMatrix()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (matrix) => {
          this.matrix = matrix;
          this.categories = matrix.categories;
          this.initializeSelectedPermissions();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading permission matrix:', error);
          this.error = 'Erro ao carregar permissões';
          this.loading = false;
        }
      });
  }

  initializeSelectedPermissions(): void {
    if (!this.matrix) return;

    this.categories.forEach(category => {
      const categoryPermissions = this.matrix!.permissions[category] || [];
      this.selectedPermissions[category] = categoryPermissions.map(p => p.name);
      this.expandedCategories[category] = false;
    });
  }

  toggleCategory(category: string): void {
    this.expandedCategories[category] = !this.expandedCategories[category];
  }

  hasPermission(permissionName: string): boolean {
    if (!this.userPermissions) return false;
    return this.userPermissions.permissions.includes(permissionName);
  }

  isPermissionGranted(permissionName: string): boolean {
    return this.customGrantedPermissions.includes(permissionName);
  }

  isPermissionDenied(permissionName: string): boolean {
    return this.customDeniedPermissions.includes(permissionName);
  }

  togglePermission(permissionName: string): void {
    const isGranted = this.isPermissionGranted(permissionName);
    const isDenied = this.isPermissionDenied(permissionName);

    if (isGranted) {
      // Remove from granted
      this.customGrantedPermissions = this.customGrantedPermissions.filter(p => p !== permissionName);
    } else if (isDenied) {
      // Remove from denied and add to granted
      this.customDeniedPermissions = this.customDeniedPermissions.filter(p => p !== permissionName);
      this.customGrantedPermissions.push(permissionName);
    } else {
      // Add to granted
      this.customGrantedPermissions.push(permissionName);
    }
  }

  denyPermission(permissionName: string): void {
    const isGranted = this.isPermissionGranted(permissionName);
    const isDenied = this.isPermissionDenied(permissionName);

    if (isGranted) {
      // Remove from granted and add to denied
      this.customGrantedPermissions = this.customGrantedPermissions.filter(p => p !== permissionName);
      this.customDeniedPermissions.push(permissionName);
    } else if (!isDenied) {
      // Add to denied
      this.customDeniedPermissions.push(permissionName);
    }
  }

  removeCustomPermission(permissionName: string): void {
    this.customGrantedPermissions = this.customGrantedPermissions.filter(p => p !== permissionName);
    this.customDeniedPermissions = this.customDeniedPermissions.filter(p => p !== permissionName);
  }

  getPermissionDisplayName(permissionName: string): string {
    return this.permissionService.getPermissionDisplayName(permissionName);
  }

  getCategoryDisplayName(category: string): string {
    return this.permissionService.getCategoryDisplayName(category);
  }

  getCategoryPermissions(category: string): Permission[] {
    if (!this.matrix) return [];
    return this.matrix.permissions[category] || [];
  }

  savePermissions(): void {
    this.saving = true;
    this.error = null;

    const payload: UpdateUserPermissionsRequest = {
      user_id: parseInt(this.data.user.id),
      granted_permissions: this.customGrantedPermissions,
      denied_permissions: this.customDeniedPermissions
    };

    this.permissionService.updateUserPermissions(
      payload.user_id,
      payload.granted_permissions,
      payload.denied_permissions
    )
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (response) => {
        this.saving = false;
        this.dialogRef.close({
          success: true,
          userPermissions: response.user_permissions
        });
      },
      error: (error) => {
        console.error('Error updating user permissions:', error);
        this.error = 'Erro ao salvar permissões';
        this.saving = false;
      }
    });
  }

  cancel(): void {
    this.dialogRef.close();
  }

  getEffectivePermissions(): string[] {
    if (!this.userPermissions) return [];
    
    // Start with role permissions
    let effectivePermissions = [...this.userPermissions.permissions];
    
    // Add granted permissions
    effectivePermissions = [...effectivePermissions, ...this.customGrantedPermissions];
    
    // Remove denied permissions
    effectivePermissions = effectivePermissions.filter(p => !this.customDeniedPermissions.includes(p));
    
    return [...new Set(effectivePermissions)]; // Remove duplicates
  }

  getPermissionStatus(permissionName: string): 'inherited' | 'granted' | 'denied' | 'none' {
    if (this.isPermissionDenied(permissionName)) {
      return 'denied';
    }
    if (this.isPermissionGranted(permissionName)) {
      return 'granted';
    }
    if (this.hasPermission(permissionName)) {
      return 'inherited';
    }
    return 'none';
  }

  getPermissionStatusColor(status: 'inherited' | 'granted' | 'denied' | 'none'): string {
    switch (status) {
      case 'inherited': return 'text-gray-600';
      case 'granted': return 'text-green-600';
      case 'denied': return 'text-red-600';
      case 'none': return 'text-gray-400';
      default: return 'text-gray-600';
    }
  }

  getPermissionStatusLabel(status: 'inherited' | 'granted' | 'denied' | 'none'): string {
    switch (status) {
      case 'inherited': return 'Herdado do papel';
      case 'granted': return 'Concedido';
      case 'denied': return 'Negado';
      case 'none': return 'Sem acesso';
      default: return '';
    }
  }

  initializeUserCustomPermissions(): void {
    // Initialize custom permissions from the user data
    if (this.data.user.raw_custom_permissions) {
      this.customGrantedPermissions = this.data.user.raw_custom_permissions.granted || [];
      this.customDeniedPermissions = this.data.user.raw_custom_permissions.denied || [];
    } else if (this.data.user.custom_permissions && Array.isArray(this.data.user.custom_permissions)) {
      // Fallback: if raw_custom_permissions is not available, use custom_permissions as granted
      this.customGrantedPermissions = [...this.data.user.custom_permissions];
      this.customDeniedPermissions = [];
    } else {
      this.customGrantedPermissions = [];
      this.customDeniedPermissions = [];
    }
    
    console.log('🔍 Initialized user custom permissions:', {
      userId: this.data.user.id,
      userName: this.data.user.name,
      granted: this.customGrantedPermissions,
      denied: this.customDeniedPermissions,
      rawCustomPermissions: this.data.user.raw_custom_permissions,
      customPermissions: this.data.user.custom_permissions
    });
  }
} 