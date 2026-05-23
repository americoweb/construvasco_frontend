import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from '../../core/services/config.service';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import { ApiDataResponse, ProjectRequest, StudioState } from './construction.types';

@Injectable({ providedIn: 'root' })
export class StudioService {
  constructor(
    private http: HttpClient,
    private config: ConfigService
  ) {}

  getState(): Observable<ApiDataResponse<StudioState>> {
    return this.http.get<ApiDataResponse<StudioState>>(
      this.config.getApiUrl(API_ENDPOINTS.CUSTOMER.STUDIO.STATE)
    );
  }

  resetDraft(): Observable<ApiDataResponse<StudioState>> {
    return this.http.post<ApiDataResponse<StudioState>>(
      this.config.getApiUrl(API_ENDPOINTS.CUSTOMER.STUDIO.RESET),
      {}
    );
  }

  saveDraft(
    id: number | string,
    payload: Partial<ProjectRequest>
  ): Observable<ApiDataResponse<ProjectRequest>> {
    return this.http.patch<ApiDataResponse<ProjectRequest>>(
      this.config.getApiUrl(API_ENDPOINTS.CUSTOMER.PROJECT_REQUEST(id)),
      payload
    );
  }
}
