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
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest
} from './category.types';

@Injectable({
  providedIn: 'root'
})
export class CategoryService extends BaseService<Category> {
  constructor(
    httpClient: HttpClient,
    configService: ConfigService,
    logger: LoggingService
  ) {
    super(httpClient, configService, logger, API_ENDPOINTS.CATEGORIES.BASE);
  }

  getActive(): Observable<ApiResponse<Category[]>> {
    this.loading.next(true);
    return this.httpClient.get<ApiResponse<Category[]>>(
      this.configService.getApiUrl(API_ENDPOINTS.CATEGORIES.PUBLIC_ACTIVE)
    ).pipe(
      map(response => {
        if (response.data) {
          this.items.next(response.data);
        }
        return response;
      }),
      this.handleError('getActive'),
      this.finalizeLoading()
    );
  }

  getRoot(): Observable<ApiResponse<Category[]>> {
    this.loading.next(true);
    return this.httpClient.get<ApiResponse<Category[]>>(
      this.configService.getApiUrl(API_ENDPOINTS.CATEGORIES.PUBLIC_ROOT)
    ).pipe(
      map(response => {
        if (response.data) {
          this.items.next(response.data);
        }
        return response;
      }),
      this.handleError('getRoot'),
      this.finalizeLoading()
    );
  }

  uploadImageFile(categoryId: number, file: File): Observable<ApiResponse<Category>> {
    this.loading.next(true);
    const formData = new FormData();
    formData.append('image', file);

    return this.httpClient.post<ApiResponse<Category>>(
      this.configService.getApiUrl(API_ENDPOINTS.CATEGORIES.UPLOAD_IMAGE(categoryId)),
      formData
    ).pipe(
      map(response => {
        if (response.data) {
          // Update in items list if present
          const currentItems = this.items.value;
          const index = currentItems.findIndex(c => c.id === categoryId);
          if (index !== -1) {
            currentItems[index] = response.data;
            this.items.next([...currentItems]);
          }
          this.item.next(response.data);
        }
        return response;
      }),
      this.handleError('uploadImageFile'),
      this.finalizeLoading()
    );
  }

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

