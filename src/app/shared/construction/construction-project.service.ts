import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from '../../core/services/config.service';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import {
  ApiDataResponse,
  AssignableUser,
  ConstructionProject,
  PaginatedResponse,
} from './construction.types';

@Injectable({ providedIn: 'root' })
export class ConstructionProjectService {
  constructor(
    private http: HttpClient,
    private config: ConfigService
  ) {}

  listManager(): Observable<PaginatedResponse<ConstructionProject>> {
    return this.http.get<PaginatedResponse<ConstructionProject>>(
      this.config.getApiUrl(API_ENDPOINTS.MANAGER.PROJECTS)
    );
  }

  getManager(id: number | string): Observable<ApiDataResponse<ConstructionProject>> {
    return this.http.get<ApiDataResponse<ConstructionProject>>(
      this.config.getApiUrl(API_ENDPOINTS.MANAGER.PROJECT(id))
    );
  }

  getTechnician(id: number | string): Observable<ApiDataResponse<ConstructionProject>> {
    return this.http.get<ApiDataResponse<ConstructionProject>>(
      this.config.getApiUrl(API_ENDPOINTS.TECHNICIAN.PROJECT(id))
    );
  }

  getForRole(
    id: number | string,
    role: string
  ): Observable<ApiDataResponse<ConstructionProject>> {
    const normalized = role.toLowerCase();
    if (['technician', 'designer', 'tecnico', 'desenhista'].includes(normalized)) {
      return this.getTechnician(id);
    }
    return this.getManager(id);
  }

  assignManager(
    projectId: number | string,
    assignedTo: number,
    assignmentRole: 'main' | 'collaborator' = 'main'
  ): Observable<ApiDataResponse<unknown>> {
    return this.http.post<ApiDataResponse<unknown>>(
      this.config.getApiUrl(API_ENDPOINTS.MANAGER.ASSIGN_PROJECT(projectId)),
      { assigned_to: assignedTo, assignment_role: assignmentRole }
    );
  }

  assignAdmin(
    projectId: number | string,
    assignedTo: number,
    assignmentRole: 'main' | 'collaborator' = 'main'
  ): Observable<ApiDataResponse<unknown>> {
    return this.http.patch<ApiDataResponse<unknown>>(
      this.config.getApiUrl(API_ENDPOINTS.ADMIN.ASSIGN_PROJECT(projectId)),
      { assigned_to: assignedTo, assignment_role: assignmentRole }
    );
  }

  assignableUsers(): Observable<ApiDataResponse<AssignableUser[]>> {
    return this.http.get<ApiDataResponse<AssignableUser[]>>(
      this.config.getApiUrl(API_ENDPOINTS.MANAGER.ASSIGNABLE_USERS)
    );
  }
}
