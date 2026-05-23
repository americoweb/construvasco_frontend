import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from '../../core/services/config.service';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import {
  ApiDataResponse,
  ConstructionProject,
  CustomerDashboard,
  PaginatedResponse,
  ProjectRequest,
  Quote,
} from './construction.types';

@Injectable({ providedIn: 'root' })
export class CustomerPortalService {
  constructor(
    private http: HttpClient,
    private config: ConfigService
  ) {}

  dashboard(): Observable<ApiDataResponse<CustomerDashboard>> {
    return this.http.get<ApiDataResponse<CustomerDashboard>>(
      this.config.getApiUrl(API_ENDPOINTS.CUSTOMER.DASHBOARD)
    );
  }

  listRequests(): Observable<PaginatedResponse<ProjectRequest>> {
    return this.http.get<PaginatedResponse<ProjectRequest>>(
      this.config.getApiUrl(API_ENDPOINTS.CUSTOMER.PROJECT_REQUESTS)
    );
  }

  getRequest(id: number | string): Observable<ApiDataResponse<ProjectRequest>> {
    return this.http.get<ApiDataResponse<ProjectRequest>>(
      this.config.getApiUrl(API_ENDPOINTS.CUSTOMER.PROJECT_REQUEST(id))
    );
  }

  getQuote(id: number | string): Observable<ApiDataResponse<Quote>> {
    return this.http.get<ApiDataResponse<Quote>>(
      this.config.getApiUrl(API_ENDPOINTS.CUSTOMER.QUOTE(id))
    );
  }

  acceptQuote(id: number | string): Observable<ApiDataResponse<{ quote: Quote; project: ConstructionProject }>> {
    return this.http.post<ApiDataResponse<{ quote: Quote; project: ConstructionProject }>>(
      this.config.getApiUrl(API_ENDPOINTS.CUSTOMER.QUOTE_ACCEPT(id)),
      {}
    );
  }

  rejectQuote(id: number | string, reason?: string): Observable<ApiDataResponse<Quote>> {
    return this.http.post<ApiDataResponse<Quote>>(
      this.config.getApiUrl(API_ENDPOINTS.CUSTOMER.QUOTE_REJECT(id)),
      { reason }
    );
  }

  listProjects(): Observable<PaginatedResponse<ConstructionProject>> {
    return this.http.get<PaginatedResponse<ConstructionProject>>(
      this.config.getApiUrl(API_ENDPOINTS.CUSTOMER.PROJECTS)
    );
  }

  getProject(id: number | string): Observable<ApiDataResponse<ConstructionProject>> {
    return this.http.get<ApiDataResponse<ConstructionProject>>(
      this.config.getApiUrl(API_ENDPOINTS.CUSTOMER.PROJECT(id))
    );
  }
}
