import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError, finalize, tap } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { BaseService } from '../../../../shared/services/base.service';
import { ConfigService } from '../../../../core/services/config.service';
import { LoggingService } from '../../../../core/services/logging.service';
import { ApiResponse } from '../../../../core/models/api.types';
import { API_ENDPOINTS } from '../../../../shared/constants/api-endpoints';
import {
  JobCard,
  JobCardStatus,
  JobCardPriority,
  CreateJobCardPayload,
  UpdateJobCardStatusPayload,
  UpdatePriorityPayload,
  AddFeedbackPayload,
  JobCardFeedback,
  JobCardFile,
  JobCardFileType,
  JobCardKanbanBoard
} from './job-card.types';

@Injectable({
  providedIn: 'root'
})
export class JobCardService extends BaseService<JobCard> {
  constructor(
    httpClient: HttpClient,
    configService: ConfigService,
    logger: LoggingService
  ) {
    super(httpClient, configService, logger, API_ENDPOINTS.JOB_CARDS.BASE);
  }

  // -------------------------------------------------------------------------
  // Listing
  // -------------------------------------------------------------------------

  getKanbanBoard(): Observable<ApiResponse<JobCardKanbanBoard>> {
    this.loading.next(true);
    return this.httpClient
      .get<ApiResponse<JobCardKanbanBoard>>(
        this.configService.getApiUrl(API_ENDPOINTS.JOB_CARDS.KANBAN)
      )
      .pipe(
        this.handleError('getKanbanBoard'),
        this.finalizeLoading()
      );
  }

  // -------------------------------------------------------------------------
  // CRUD
  // -------------------------------------------------------------------------

  createJobCard(payload: CreateJobCardPayload): Observable<ApiResponse<JobCard>> {
    this.loading.next(true);
    return this.httpClient
      .post<ApiResponse<JobCard>>(
        this.configService.getApiUrl(API_ENDPOINTS.JOB_CARDS.BASE),
        payload
      )
      .pipe(
        tap(() => this.refreshList()),
        this.handleError('createJobCard'),
        this.finalizeLoading()
      );
  }

  getJobCardDetail(id: number): Observable<ApiResponse<JobCard>> {
    return this.getOne(id);
  }

  // -------------------------------------------------------------------------
  // Status
  // -------------------------------------------------------------------------

  updateStatus(id: number, status: JobCardStatus, notes?: string): Observable<ApiResponse<JobCard>> {
    this.loading.next(true);
    const payload: UpdateJobCardStatusPayload = { status, notes };
    return this.httpClient
      .patch<ApiResponse<JobCard>>(
        this.configService.getApiUrl(API_ENDPOINTS.JOB_CARDS.UPDATE_STATUS(id)),
        payload
      )
      .pipe(
        map(response => {
          if (response.data) {
            this.item.next(response.data);
            this.updateItemInList(response.data);
          }
          return response;
        }),
        this.handleError('updateStatus'),
        this.finalizeLoading()
      );
  }

  cancel(id: number, reason?: string): Observable<ApiResponse<JobCard>> {
    this.loading.next(true);
    return this.httpClient
      .post<ApiResponse<JobCard>>(
        this.configService.getApiUrl(API_ENDPOINTS.JOB_CARDS.CANCEL(id)),
        { reason }
      )
      .pipe(
        map(response => {
          if (response.data) {
            this.item.next(response.data);
            this.updateItemInList(response.data);
          }
          return response;
        }),
        this.handleError('cancel'),
        this.finalizeLoading()
      );
  }

  // -------------------------------------------------------------------------
  // Priority
  // -------------------------------------------------------------------------

  updatePriority(id: number, payload: UpdatePriorityPayload): Observable<ApiResponse<JobCard>> {
    this.loading.next(true);
    return this.httpClient
      .patch<ApiResponse<JobCard>>(
        this.configService.getApiUrl(API_ENDPOINTS.JOB_CARDS.UPDATE_PRIORITY(id)),
        payload
      )
      .pipe(
        map(response => {
          if (response.data) {
            this.item.next(response.data);
            this.updateItemInList(response.data);
          }
          return response;
        }),
        this.handleError('updatePriority'),
        this.finalizeLoading()
      );
  }

  removeOverride(id: number): Observable<ApiResponse<JobCard>> {
    this.loading.next(true);
    return this.httpClient
      .delete<ApiResponse<JobCard>>(
        this.configService.getApiUrl(API_ENDPOINTS.JOB_CARDS.REMOVE_OVERRIDE(id))
      )
      .pipe(
        map(response => {
          if (response.data) {
            this.item.next(response.data);
            this.updateItemInList(response.data);
          }
          return response;
        }),
        this.handleError('removeOverride'),
        this.finalizeLoading()
      );
  }

  // -------------------------------------------------------------------------
  // Team
  // -------------------------------------------------------------------------

  assignDesigner(id: number, designerId: number): Observable<ApiResponse<JobCard>> {
    this.loading.next(true);
    return this.httpClient
      .post<ApiResponse<JobCard>>(
        this.configService.getApiUrl(API_ENDPOINTS.JOB_CARDS.ASSIGN_DESIGNER(id)),
        { designer_id: designerId }
      )
      .pipe(
        map(response => {
          if (response.data) { this.item.next(response.data); }
          return response;
        }),
        this.handleError('assignDesigner'),
        this.finalizeLoading()
      );
  }

  // -------------------------------------------------------------------------
  // Feedback
  // -------------------------------------------------------------------------

  addFeedback(id: number, payload: AddFeedbackPayload): Observable<ApiResponse<JobCardFeedback>> {
    this.loading.next(true);
    return this.httpClient
      .post<ApiResponse<JobCardFeedback>>(
        this.configService.getApiUrl(API_ENDPOINTS.JOB_CARDS.ADD_FEEDBACK(id)),
        payload
      )
      .pipe(
        this.handleError('addFeedback'),
        this.finalizeLoading()
      );
  }

  // -------------------------------------------------------------------------
  // Files
  // -------------------------------------------------------------------------

  uploadFile(
    jobCardId: number,
    file: File,
    type: JobCardFileType,
    notes?: string,
    version?: number
  ): Observable<ApiResponse<JobCardFile>> {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('type', type);
    if (notes)   fd.append('notes', notes);
    if (version) fd.append('version', String(version));

    return this.httpClient
      .post<ApiResponse<JobCardFile>>(
        this.configService.getApiUrl(API_ENDPOINTS.JOB_CARDS.FILES(jobCardId)),
        fd
      )
      .pipe(this.handleError('uploadFile'));
  }

  deleteFile(jobCardId: number, fileId: number): Observable<any> {
    return this.httpClient
      .delete(
        this.configService.getApiUrl(API_ENDPOINTS.JOB_CARDS.FILE_DELETE(jobCardId, fileId))
      )
      .pipe(this.handleError('deleteFile'));
  }

  // -------------------------------------------------------------------------
  // Design workspace
  // -------------------------------------------------------------------------

  generateDesign(
    jobCardId: number,
    payload: { prompt?: string; logo_file_id?: number | null; reference_file_id?: number | null }
  ): Observable<ApiResponse<{ image_data: string; image_url: string; file: JobCardFile; prompt: string }>> {
    return this.httpClient
      .post<ApiResponse<any>>(
        this.configService.getApiUrl(API_ENDPOINTS.JOB_CARDS.DESIGN_GENERATE(jobCardId)),
        payload
      )
      .pipe(this.handleError('generateDesign'));
  }

  exportDesignPdf(jobCardId: number, fileId: number): Observable<Blob> {
    const url = this.configService.getApiUrl(
      API_ENDPOINTS.JOB_CARDS.DESIGN_EXPORT_PDF(jobCardId)
    ) + `?file_id=${fileId}`;
    return this.httpClient
      .get(url, { responseType: 'blob' })
      .pipe(this.handleError('exportDesignPdf') as any);
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  private updateItemInList(updated: JobCard): void {
    const current = this.items.value;
    const idx = current.findIndex(j => j.id === updated.id);
    if (idx !== -1) {
      current[idx] = updated;
      this.items.next([...current]);
    }
  }

  private handleError<T>(operation: string) {
    return (source: Observable<T>) =>
      source.pipe(
        map(response => {
          this.logger.info(`${operation} completed`);
          return response;
        }),
        catchError(error => {
          this.logger.error(`Failed to ${operation}`, error);
          throw error;
        })
      );
  }

  private finalizeLoading() {
    return (source: Observable<any>) =>
      source.pipe(finalize(() => this.loading.next(false)));
  }
}
