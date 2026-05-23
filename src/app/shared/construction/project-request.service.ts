import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from '../../core/services/config.service';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import {
  ApiDataResponse,
  PaginatedResponse,
  ProjectRequest,
  StoreQuotePayload,
  Quote,
} from './construction.types';

@Injectable({ providedIn: 'root' })
export class ProjectRequestService {
  constructor(
    private http: HttpClient,
    private config: ConfigService
  ) {}

  listManager(params?: Record<string, string | number>): Observable<PaginatedResponse<ProjectRequest>> {
    return this.http.get<PaginatedResponse<ProjectRequest>>(
      this.config.getApiUrl(API_ENDPOINTS.MANAGER.PROJECT_REQUESTS),
      { params: params as Record<string, string> }
    );
  }

  getManager(id: number | string): Observable<ApiDataResponse<ProjectRequest>> {
    return this.http.get<ApiDataResponse<ProjectRequest>>(
      this.config.getApiUrl(API_ENDPOINTS.MANAGER.PROJECT_REQUEST(id))
    );
  }

  approve(id: number | string): Observable<ApiDataResponse<ProjectRequest>> {
    return this.http.post<ApiDataResponse<ProjectRequest>>(
      this.config.getApiUrl(API_ENDPOINTS.MANAGER.PROJECT_REQUEST_APPROVE(id)),
      {}
    );
  }

  reject(id: number | string, reason?: string): Observable<ApiDataResponse<ProjectRequest>> {
    return this.http.post<ApiDataResponse<ProjectRequest>>(
      this.config.getApiUrl(API_ENDPOINTS.MANAGER.PROJECT_REQUEST_REJECT(id)),
      { reason }
    );
  }

  storeQuote(id: number | string, payload: StoreQuotePayload): Observable<ApiDataResponse<Quote>> {
    return this.http.post<ApiDataResponse<Quote>>(
      this.config.getApiUrl(API_ENDPOINTS.MANAGER.PROJECT_REQUEST_QUOTES(id)),
      payload
    );
  }
}
