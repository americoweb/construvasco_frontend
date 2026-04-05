import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  private permissions = new BehaviorSubject<string[]>([]);
  private roles = new BehaviorSubject<string[]>([]);

  get permissions$(): Observable<string[]> {
    return this.permissions.asObservable();
  }

  get roles$(): Observable<string[]> {
    return this.roles.asObservable();
  }

  setPermissions(permissions: string[]): void {
    this.permissions.next(permissions);
  }

  setRoles(roles: string[]): void {
    this.roles.next(roles);
  }

  hasPermission(permission: string | string[]): Observable<boolean> {
    const permissionsToCheck = Array.isArray(permission) ? permission : [permission];
    
    return this.permissions$.pipe(
      map(userPermissions => {
        return permissionsToCheck.some(p => userPermissions.includes(p));
      })
    );
  }

  hasRole(role: string | string[]): Observable<boolean> {
    const rolesToCheck = Array.isArray(role) ? role : [role];
    
    return this.roles$.pipe(
      map(userRoles => {
        return rolesToCheck.some(r => userRoles.includes(r));
      })
    );
  }

  checkMultiplePermissions(permissionMap: { [key: string]: string | string[] }): Observable<{ [key: string]: boolean }> {
    return this.permissions$.pipe(
      map(userPermissions => {
        const result: { [key: string]: boolean } = {};
        
        Object.entries(permissionMap).forEach(([key, permissions]) => {
          const permsToCheck = Array.isArray(permissions) ? permissions : [permissions];
          result[key] = permsToCheck.some(p => userPermissions.includes(p));
        });
        
        return result;
      })
    );
  }
}
