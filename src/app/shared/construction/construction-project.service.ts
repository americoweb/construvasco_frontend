import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from '../../core/services/config.service';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import {
  ApiDataResponse,
  AssignableUser,
  ConstructionProject,
  PaginatedResponse,
  PendingPaymentRow,
  ProjectDeliverable,
  ProjectPayment,
} from './construction.types';

export type ProjectApiRole = 'manager' | 'technician' | 'customer' | 'admin';

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

  listDeliverables(
    role: ProjectApiRole,
    projectId: number | string
  ): Observable<ApiDataResponse<ProjectDeliverable[]>> {
    return this.http.get<ApiDataResponse<ProjectDeliverable[]>>(
      this.config.getApiUrl(this.deliverablesListPath(role, projectId))
    );
  }

  uploadTechnicianDeliverable(
    projectId: number | string,
    form: FormData
  ): Observable<HttpEvent<ApiDataResponse<ProjectDeliverable>>> {
    return this.http.post<ApiDataResponse<ProjectDeliverable>>(
      this.config.getApiUrl(API_ENDPOINTS.TECHNICIAN.PROJECT_DELIVERABLES(projectId)),
      form,
      { reportProgress: true, observe: 'events' }
    );
  }

  approveDeliverable(
    projectId: number | string,
    deliverableId: number | string
  ): Observable<ApiDataResponse<ProjectDeliverable>> {
    return this.http.post<ApiDataResponse<ProjectDeliverable>>(
      this.config.getApiUrl(API_ENDPOINTS.MANAGER.PROJECT_DELIVERABLE_APPROVE(projectId, deliverableId)),
      {}
    );
  }

  rejectDeliverable(
    projectId: number | string,
    deliverableId: number | string,
    rejectionReason: string
  ): Observable<ApiDataResponse<ProjectDeliverable>> {
    return this.http.post<ApiDataResponse<ProjectDeliverable>>(
      this.config.getApiUrl(API_ENDPOINTS.MANAGER.PROJECT_DELIVERABLE_REJECT(projectId, deliverableId)),
      { rejection_reason: rejectionReason }
    );
  }

  markArchitectureDelivered(projectId: number | string): Observable<ApiDataResponse<ConstructionProject>> {
    return this.http.post<ApiDataResponse<ConstructionProject>>(
      this.config.getApiUrl(API_ENDPOINTS.MANAGER.MARK_ARCHITECTURE_DELIVERED(projectId)),
      {}
    );
  }

  downloadDeliverable(
    role: ProjectApiRole,
    projectId: number | string,
    deliverableId: number | string
  ): Observable<HttpResponse<Blob>> {
    return this.http.get(this.config.getApiUrl(this.deliverableDownloadPath(role, projectId, deliverableId)), {
      responseType: 'blob',
      observe: 'response',
    });
  }

  private deliverablesListPath(role: ProjectApiRole, projectId: number | string): string {
    if (role === 'technician') return API_ENDPOINTS.TECHNICIAN.PROJECT_DELIVERABLES(projectId);
    if (role === 'customer') return API_ENDPOINTS.CUSTOMER.PROJECT_DELIVERABLES(projectId);
    return API_ENDPOINTS.MANAGER.PROJECT_DELIVERABLES(projectId);
  }

  private deliverableDownloadPath(
    role: ProjectApiRole,
    projectId: number | string,
    deliverableId: number | string
  ): string {
    if (role === 'technician') {
      return API_ENDPOINTS.TECHNICIAN.PROJECT_DELIVERABLE_DOWNLOAD(projectId, deliverableId);
    }
    if (role === 'customer') {
      return API_ENDPOINTS.CUSTOMER.PROJECT_DELIVERABLE_DOWNLOAD(projectId, deliverableId);
    }
    return API_ENDPOINTS.MANAGER.PROJECT_DELIVERABLE_DOWNLOAD(projectId, deliverableId);
  }

  uploadPaymentProof(
    projectId: number | string,
    paymentId: number | string,
    form: FormData
  ): Observable<HttpEvent<ApiDataResponse<ProjectPayment>>> {
    return this.http.post<ApiDataResponse<ProjectPayment>>(
      this.config.getApiUrl(API_ENDPOINTS.CUSTOMER.PROJECT_PAYMENT_PROOF(projectId, paymentId)),
      form,
      { reportProgress: true, observe: 'events' }
    );
  }

  confirmPayment(projectId: number | string, paymentId: number | string): Observable<ApiDataResponse<ProjectPayment>> {
    return this.http.post<ApiDataResponse<ProjectPayment>>(
      this.config.getApiUrl(API_ENDPOINTS.MANAGER.PROJECT_PAYMENT_CONFIRM(projectId, paymentId)),
      {}
    );
  }

  rejectPayment(
    projectId: number | string,
    paymentId: number | string,
    rejectionReason: string
  ): Observable<ApiDataResponse<ProjectPayment>> {
    return this.http.post<ApiDataResponse<ProjectPayment>>(
      this.config.getApiUrl(API_ENDPOINTS.MANAGER.PROJECT_PAYMENT_REJECT(projectId, paymentId)),
      { rejection_reason: rejectionReason }
    );
  }

  downloadPaymentProof(projectId: number | string, paymentId: number | string): Observable<HttpResponse<Blob>> {
    return this.http.get(
      this.config.getApiUrl(API_ENDPOINTS.MANAGER.PROJECT_PAYMENT_PROOF_DOWNLOAD(projectId, paymentId)),
      { responseType: 'blob', observe: 'response' }
    );
  }

  listPendingPayments(): Observable<ApiDataResponse<PendingPaymentRow[]>> {
    return this.http.get<ApiDataResponse<PendingPaymentRow[]>>(
      this.config.getApiUrl(API_ENDPOINTS.MANAGER.PAYMENTS_PENDING)
    );
  }

  getManagerDashboard(): Observable<
    ApiDataResponse<{
      pending_payments_count?: number;
      pending_payments?: PendingPaymentRow[];
      pending_requests?: number;
      active_projects?: number;
    }>
  > {
    return this.http.get<
      ApiDataResponse<{
        pending_payments_count?: number;
        pending_payments?: PendingPaymentRow[];
        pending_requests?: number;
        active_projects?: number;
      }>
    >(this.config.getApiUrl(API_ENDPOINTS.MANAGER.DASHBOARD));
  }

  resolveApiRole(userRole: string): ProjectApiRole {
    const r = userRole.toLowerCase();
    if (['technician', 'designer', 'tecnico', 'desenhista'].includes(r)) return 'technician';
    if (r === 'customer' || r === 'cliente') return 'customer';
    if (r === 'admin') return 'admin';
    return 'manager';
  }
}
