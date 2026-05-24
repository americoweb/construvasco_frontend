import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ConfigService } from '../../../core/services/config.service';
import { API_ENDPOINTS } from '../../../shared/constants/api-endpoints';
import { ApiResponse } from '../../../core/models/api.types';
import { PendingPaymentRow } from '../../../shared/construction/construction.types';

/** Matches `AdminDashboardController` (construction domain). */
export interface AdminDashboardStats {
  projects_total: number;
  projects_active: number;
  milestones_pending: number;
  deliverables_submitted: number;
  assignments_active: number;
  payments_pending: number;
  pending_payments_count?: number;
}

export interface AdminDashboardLoadResult {
  data: AdminDashboardStats | null;
  pending_payments: PendingPaymentRow[];
}

export interface AdminProjectSummary {
  id: number;
  title?: string;
  name?: string;
  status?: string;
  updated_at?: string;
  created_at?: string;
  client?: { name?: string };
}

@Injectable({
  providedIn: 'root'
})
export class AdminDashboardService {
  constructor(
    private http: HttpClient,
    private configService: ConfigService
  ) {}

  getStats(role?: string): Observable<AdminDashboardLoadResult> {
    const r = (role ?? '').toLowerCase();
    if (r === 'technician' || r === 'designer' || r === 'tecnico') {
      return this.http
        .get<{ data: { assigned_projects: number } }>(
          this.configService.getApiUrl(API_ENDPOINTS.TECHNICIAN.DASHBOARD)
        )
        .pipe(
          map((res) => ({
            data: {
              projects_total: res.data?.assigned_projects ?? 0,
              projects_active: res.data?.assigned_projects ?? 0,
              milestones_pending: 0,
              deliverables_submitted: 0,
              assignments_active: res.data?.assigned_projects ?? 0,
              payments_pending: 0,
            },
            pending_payments: [],
          }))
        );
    }
    if (r === 'admin' || r === 'project_manager' || r === 'gestor') {
      return this.http
        .get<{
          data: {
            active_projects?: number;
            pending_payments_count?: number;
            pending_payments?: PendingPaymentRow[];
          };
        }>(this.configService.getApiUrl(API_ENDPOINTS.MANAGER.DASHBOARD))
        .pipe(
          map((res) => ({
            data: {
              projects_total: res.data?.active_projects ?? 0,
              projects_active: res.data?.active_projects ?? 0,
              milestones_pending: 0,
              deliverables_submitted: 0,
              assignments_active: 0,
              payments_pending: res.data?.pending_payments_count ?? 0,
              pending_payments_count: res.data?.pending_payments_count ?? 0,
            },
            pending_payments: res.data?.pending_payments ?? [],
          }))
        );
    }
    return this.http.get<ApiResponse<AdminDashboardStats>>(
      this.configService.getApiUrl(API_ENDPOINTS.ADMIN.DASHBOARD)
    ).pipe(
      map((res) => ({
        data: res.data ?? null,
        pending_payments: [],
      }))
    );
  }

  getRecentProjects(role?: string): Observable<{ data: AdminProjectSummary[] }> {
    const r = (role ?? '').toLowerCase();
    const url =
      r === 'technician' || r === 'designer' || r === 'tecnico'
        ? API_ENDPOINTS.TECHNICIAN.PROJECTS
        : API_ENDPOINTS.ADMIN.PROJECTS;
    return this.http.get<{ data: AdminProjectSummary[] }>(
      this.configService.getApiUrl(url)
    );
  }
}
