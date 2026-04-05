import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  PermissionMatrix,
  RolePermissions,
  UserPermissions,
  UpdateRolePermissionsRequest,
  UpdateUserPermissionsRequest
} from '../interfaces/permission.interface';

@Injectable({
  providedIn: 'root'
})
export class PermissionMatrixService {
  private apiUrl = `${environment.apiURL.root}/permissions`;

  constructor(private http: HttpClient) {}

  /**
   * Get the complete permission matrix
   */
  getMatrix(): Observable<PermissionMatrix> {
    return this.http.get<PermissionMatrix>(`${this.apiUrl}/matrix`);
  }

  /**
   * Get all permissions grouped by category
   */
  getPermissions(): Observable<{ permissions: { [category: string]: any[] }, categories: string[] }> {
    return this.http.get<{ permissions: { [category: string]: any[] }, categories: string[] }>(`${this.apiUrl}/`);
  }

  /**
   * Get all roles with their permissions
   */
  getRoles(): Observable<{ roles: any[] }> {
    return this.http.get<{ roles: any[] }>(`${this.apiUrl}/roles`);
  }

  /**
   * Get permissions for a specific role
   */
  getRolePermissions(roleId: number): Observable<RolePermissions> {
    return this.http.get<RolePermissions>(`${this.apiUrl}/roles/${roleId}/permissions`);
  }

  /**
   * Update permissions for a role
   */
  updateRolePermissions(roleId: number, permissions: string[]): Observable<any> {
    const payload: UpdateRolePermissionsRequest = { permissions };
    return this.http.put(`${this.apiUrl}/roles/${roleId}/permissions`, payload);
  }

  /**
   * Get user permissions for the current tenant
   */
  getUserPermissions(): Observable<UserPermissions> {
    return this.http.get<UserPermissions>(`${this.apiUrl}/user`);
  }

  /**
   * Update custom permissions for a user
   */
  updateUserPermissions(userId: number, grantedPermissions: string[], deniedPermissions: string[]): Observable<any> {
    const payload: UpdateUserPermissionsRequest = {
      user_id: userId,
      granted_permissions: grantedPermissions,
      denied_permissions: deniedPermissions
    };
    return this.http.put(`${this.apiUrl}/user`, payload);
  }

  /**
   * Check if a role has a specific permission
   */
  roleHasPermission(role: any, permissionName: string): boolean {
    return role.permissions.includes(permissionName);
  }

  /**
   * Check if a role has any permission from a category
   */
  roleHasCategoryPermission(role: any, category: string): boolean {
    return role.permissions.some((permission: string) => permission.startsWith(category + '.'));
  }

  /**
   * Get all permissions for a category
   */
  getCategoryPermissions(matrix: PermissionMatrix, category: string): string[] {
    const permissions = matrix.permissions[category] || [];
    return permissions.map(p => p.name);
  }

  /**
   * Get permission display name
   */
  getPermissionDisplayName(permissionName: string): string {
    const parts = permissionName.split('.');
    if (parts.length >= 2) {
      const action = parts[1];
      const resource = parts[0];
      
      const actionMap: { [key: string]: string } = {
        'view': 'Visualizar',
        'create': 'Criar',
        'edit': 'Editar',
        'delete': 'Excluir',
        'manage': 'Gerenciar',
        'approve': 'Aprovar',
        'reject': 'Rejeitar',
        'submit': 'Enviar',
        'export': 'Exportar',
        'publish': 'Publicar',
        'archive': 'Arquivar',
        'duplicate': 'Duplicar',
        'review': 'Revisar'
      };

      const resourceMap: { [key: string]: string } = {
        'tenants': 'Inquilinos',
        'users': 'Usuários',
        'forms': 'Formulários',
        'form_templates': 'Templates de Formulário',
        'form_instances': 'Instâncias de Formulário',
        'form_submissions': 'Submissões de Formulário',
        'form_analytics': 'Análises de Formulário',
        'form_workflow': 'Fluxo de Trabalho',
        'form_compliance': 'Conformidade',
        'projects': 'Projetos',
        'finance': 'Financeiro',
        'admin': 'Administração'
      };

      const actionText = actionMap[action] || action;
      const resourceText = resourceMap[resource] || resource;
      
      return `${actionText} ${resourceText}`;
    }
    
    return permissionName;
  }

  /**
   * Get category display name
   */
  getCategoryDisplayName(category: string): string {
    const categoryMap: { [key: string]: string } = {
      'tenants': 'Gerenciamento de Inquilinos',
      'users': 'Gerenciamento de Usuários',
      'forms': 'Sistema de Formulários',
      'projects': 'Gerenciamento de Projetos',
      'finance': 'Gerenciamento Financeiro',
      'admin': 'Administração do Sistema'
    };

    return categoryMap[category] || category;
  }
} 