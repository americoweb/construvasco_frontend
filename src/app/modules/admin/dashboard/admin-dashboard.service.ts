import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from '../../../core/services/config.service';
import { API_ENDPOINTS } from '../../../shared/constants/api-endpoints';
import { ApiResponse } from '../../../core/models/api.types';

export interface AdminDashboardStats {
  orders_total: number;
  orders_pending: number;
  orders_active: number;
  products_total: number;
  designs_total: number;
  categories_total: number;
}

@Injectable({
  providedIn: 'root'
})
export class AdminDashboardService {
  constructor(
    private http: HttpClient,
    private configService: ConfigService
  ) {}

  getStats(): Observable<ApiResponse<AdminDashboardStats>> {
    return this.http.get<ApiResponse<AdminDashboardStats>>(
      this.configService.getApiUrl(API_ENDPOINTS.ADMIN.DASHBOARD)
    );
  }
}
