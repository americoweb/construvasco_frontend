import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { BaseService } from '../../../../shared/services/base.service';
import { ConfigService } from '../../../../core/services/config.service';
import { LoggingService } from '../../../../core/services/logging.service';
import { ApiResponse } from '../../../../core/models/api.types';
import { API_ENDPOINTS } from '../../../../shared/constants/api-endpoints';
import { Staff, DesignerOption, CreateStaffPayload, UpdateStaffPayload } from './staff.types';

@Injectable({ providedIn: 'root' })
export class StaffService extends BaseService<Staff> {
  constructor(
    httpClient: HttpClient,
    configService: ConfigService,
    logger: LoggingService
  ) {
    super(httpClient, configService, logger, API_ENDPOINTS.STAFF.BASE);
  }

  getDesigners(): Observable<ApiResponse<DesignerOption[]>> {
    return this.httpClient.get<ApiResponse<DesignerOption[]>>(
      this.configService.getApiUrl(API_ENDPOINTS.STAFF.DESIGNERS)
    );
  }

  createStaff(payload: CreateStaffPayload): Observable<ApiResponse<Staff>> {
    this.loading.next(true);
    return this.httpClient
      .post<ApiResponse<Staff>>(this.baseUrl, payload)
      .pipe(this.handleError('createStaff'), this.finalizeLoading());
  }

  updateStaff(id: number, payload: UpdateStaffPayload): Observable<ApiResponse<Staff>> {
    this.loading.next(true);
    return this.httpClient
      .put<ApiResponse<Staff>>(
        this.configService.getApiUrl(API_ENDPOINTS.STAFF.UPDATE(id)),
        payload
      )
      .pipe(this.handleError('updateStaff'), this.finalizeLoading());
  }

  deleteStaff(id: number): Observable<any> {
    this.loading.next(true);
    return this.httpClient
      .delete(this.configService.getApiUrl(API_ENDPOINTS.STAFF.DELETE(id)))
      .pipe(this.handleError('deleteStaff'), this.finalizeLoading());
  }

  getStaff(id: number): Observable<ApiResponse<Staff>> {
    return this.httpClient.get<ApiResponse<Staff>>(
      this.configService.getApiUrl(API_ENDPOINTS.STAFF.GET(id))
    );
  }

  private handleError(operation: string) {
    return catchError((error) => {
      this.logger.error(`Failed to ${operation}`, error);
      return throwError(() => error);
    });
  }

  private finalizeLoading() {
    return finalize(() => this.loading.next(false));
  }
}
