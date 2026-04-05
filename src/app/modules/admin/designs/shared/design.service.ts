import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError, finalize } from 'rxjs/operators';
import { BaseService } from '../../../../shared/services/base.service';
import { ConfigService } from '../../../../core/services/config.service';
import { LoggingService } from '../../../../core/services/logging.service';
import { ApiResponse } from '../../../../core/models/api.types';
import { API_ENDPOINTS } from '../../../../shared/constants/api-endpoints';
import {
  Design,
  DesignRefinement,
  UpdateDesignRequest
} from './design.types';

@Injectable({
  providedIn: 'root'
})
export class DesignService extends BaseService<Design> {
  constructor(
    httpClient: HttpClient,
    configService: ConfigService,
    logger: LoggingService
  ) {
    super(httpClient, configService, logger, API_ENDPOINTS.DESIGNS.BASE);
  }

  // Get design with full details (product, color, print area, refinements)
  getDesignWithDetails(id: number): Observable<ApiResponse<Design>> {
    return this.getOne(id).pipe(
      map(response => {
        // The backend should return design with all relations loaded
        return response;
      })
    );
  }

  // Get design refinements
  getDesignRefinements(designId: number): Observable<ApiResponse<DesignRefinement[]>> {
    this.loading.next(true);
    return this.httpClient.get<ApiResponse<DesignRefinement[]>>(
      this.configService.getApiUrl(API_ENDPOINTS.DESIGNS.REFINEMENTS(designId))
    ).pipe(
      this.handleError('getDesignRefinements'),
      this.finalizeLoading()
    );
  }

  // Update design
  updateDesign(id: number, data: UpdateDesignRequest): Observable<ApiResponse<Design>> {
    return this.update(id, data);
  }

  // Delete design
  deleteDesign(id: number): Observable<ApiResponse<any>> {
    return this.delete(id);
  }

  // Generate mockup from existing design (auto-includes logo/reference)
  generateMockup(designId: number): Observable<ApiResponse<Design>> {
    this.loading.next(true);
    return this.httpClient.post<ApiResponse<Design>>(
      this.configService.getApiUrl(API_ENDPOINTS.DESIGNS.GENERATE_MOCKUP(designId)),
      {}
    ).pipe(
      this.handleError('generateMockup'),
      this.finalizeLoading()
    );
  }

  // Download logo file
  downloadLogo(designId: number): Observable<Blob> {
    return this.httpClient.get(
      this.configService.getApiUrl(API_ENDPOINTS.DESIGNS.DOWNLOAD_LOGO(designId)),
      { responseType: 'blob' }
    );
  }

  // Download reference image file
  downloadReferenceImage(designId: number): Observable<Blob> {
    return this.httpClient.get(
      this.configService.getApiUrl(API_ENDPOINTS.DESIGNS.DOWNLOAD_REFERENCE(designId)),
      { responseType: 'blob' }
    );
  }

  // Get all design files for printing
  getDesignFilesForPrinting(designId: number): Observable<ApiResponse<any>> {
    return this.httpClient.get<ApiResponse<any>>(
      this.configService.getApiUrl(API_ENDPOINTS.DESIGNS.FILES_FOR_PRINTING(designId))
    ).pipe(
      this.handleError('getDesignFilesForPrinting')
    );
  }

  // Helper method to trigger file download
  downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  // Helper methods for error handling
  private handleError<T>(operation: string) {
    return (source: Observable<T>) => {
      return source.pipe(
        map(response => {
          this.logger.info(`${operation} completed successfully`);
          return response;
        }),
        catchError(error => {
          this.logger.error(`Failed to ${operation}`, error);
          throw error;
        })
      );
    };
  }

  private finalizeLoading() {
    return (source: Observable<any>) => {
      return source.pipe(
        finalize(() => this.loading.next(false))
      );
    };
  }
}

