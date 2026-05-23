import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from '../../core/services/config.service';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import { ApiDataResponse } from './construction.types';

export interface AiGenerationRecord {
  id: number;
  project_request_id?: number | null;
  type: string;
  prompt?: string | null;
  status: string;
  image_url?: string | null;
  parent_generation_id?: number | null;
}

@Injectable({ providedIn: 'root' })
export class AiGenerationService {
  constructor(
    private http: HttpClient,
    private config: ConfigService
  ) {}

  generate(payload: Record<string, unknown>): Observable<ApiDataResponse<AiGenerationRecord>> {
    return this.http.post<ApiDataResponse<AiGenerationRecord>>(
      this.config.getApiUrl(API_ENDPOINTS.AI.GENERATIONS),
      payload
    );
  }

  refine(id: number | string, feedback: string): Observable<ApiDataResponse<{ prompt: string }>> {
    return this.http.post<ApiDataResponse<{ prompt: string }>>(
      this.config.getApiUrl(API_ENDPOINTS.AI.REFINE(id)),
      { feedback }
    );
  }

  get(id: number | string): Observable<ApiDataResponse<AiGenerationRecord>> {
    return this.http.get<ApiDataResponse<AiGenerationRecord>>(
      this.config.getApiUrl(API_ENDPOINTS.AI.GENERATION(id))
    );
  }

  list(projectRequestId?: number): Observable<ApiDataResponse<AiGenerationRecord[]>> {
    const params = projectRequestId != null ? { project_request_id: String(projectRequestId) } : undefined;
    return this.http.get<ApiDataResponse<AiGenerationRecord[]>>(
      this.config.getApiUrl(API_ENDPOINTS.AI.GENERATIONS),
      { params }
    );
  }

  approve(requestId: number | string, generationId: number | string): Observable<ApiDataResponse<unknown>> {
    return this.http.post<ApiDataResponse<unknown>>(
      this.config.getApiUrl(API_ENDPOINTS.AI.APPROVE_GENERATION(requestId, generationId)),
      {}
    );
  }

  health(): Observable<ApiDataResponse<{ ok: boolean }>> {
    return this.http.get<ApiDataResponse<{ ok: boolean }>>(
      this.config.getApiUrl(API_ENDPOINTS.AI.HEALTH)
    );
  }
}
