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
  Tag,
  CreateTagRequest,
  UpdateTagRequest
} from './tag.types';

@Injectable({
  providedIn: 'root'
})
export class TagService extends BaseService<Tag> {
  constructor(
    httpClient: HttpClient,
    configService: ConfigService,
    logger: LoggingService
  ) {
    super(httpClient, configService, logger, API_ENDPOINTS.TAGS.BASE);
  }

  getAll(): Observable<ApiResponse<Tag[]>> {
    this.loading.next(true);
    return this.httpClient.get<ApiResponse<Tag[]>>(
      this.configService.getApiUrl(API_ENDPOINTS.TAGS.PUBLIC_ALL)
    ).pipe(
      map(response => {
        if (response.data) {
          this.items.next(response.data);
        }
        return response;
      }),
      this.handleError('getAll'),
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

