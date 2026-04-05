import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { UserService } from '../../../../core/auth/services/user.service';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  
  constructor(private userService: UserService) {}
  
  checkMultiplePermissions(permissions: { [key: string]: string }): Observable<{ [key: string]: boolean }> {
    const results: { [key: string]: boolean } = {};
    
    Object.keys(permissions).forEach(key => {
      const permission = permissions[key];
      results[key] = this.userService.hasPermission(permission);
    });
    
    return of(results);
  }

  hasPermission(permission: string): Observable<boolean> {
    return of(this.userService.hasPermission(permission));
  }
}
