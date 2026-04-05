import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError, finalize, map } from 'rxjs/operators';
import { Identifiable, ApiResponse, PaginationInfo } from '../../core/models/api.types';
import { ConfigService } from '../../core/services/config.service';
import { LoggingService } from '../../core/services/logging.service';

@Injectable({
  providedIn: 'root'
})
export class BaseService<T extends Identifiable> {
  public baseUrl: string;
  public item = new BehaviorSubject<T | null>(null);
  public items = new BehaviorSubject<T[]>([]);
  public loading = new BehaviorSubject<boolean>(false);
  public pagination = new BehaviorSubject<PaginationInfo>({
    current_page: 1,
    per_page: 10,
    total: 0,
    last_page: 1
  });

  constructor(
    protected httpClient: HttpClient,
    protected configService: ConfigService,
    protected logger: LoggingService,
    baseUrl: string,
    protected idKey: string = 'id'
  ) {
    this.baseUrl = this.configService.getApiUrl(baseUrl);
  }

  // Observable getters
  get item$(): Observable<T | null> {
    return this.item.asObservable();
  }

  get items$(): Observable<T[]> {
    return this.items.asObservable();
  }

  get loading$(): Observable<boolean> {
    return this.loading.asObservable();
  }

  get pagination$(): Observable<PaginationInfo> {
    return this.pagination.asObservable();
  }

  // CRUD operations
  get(params: any = {}): Observable<ApiResponse<T[]>> {
    this.loading.next(true);
    return this.httpClient.get<ApiResponse<T[]>>(this.baseUrl, { params }).pipe(
      tap(response => {
        this.items.next(response.data || response.items || []);
        if (response.meta) {
          this.pagination.next(response.meta);
        }
      }),
      catchError(error => {
        this.logger.error('Failed to fetch items', error);
        return throwError(() => error);
      }),
      finalize(() => this.loading.next(false))
    );
  }

  getOne(id: any): Observable<ApiResponse<T>> {
    this.loading.next(true);
    return this.httpClient.get<ApiResponse<T>>(`${this.baseUrl}/${id}`).pipe(
      tap(response => {
        if (response.data) {
          this.item.next(response.data);
        }
      }),
      catchError(error => {
        this.logger.error(`Failed to fetch item ${id}`, error);
        return throwError(() => error);
      }),
      finalize(() => this.loading.next(false))
    );
  }

  create(item: Partial<T>): Observable<ApiResponse<T>> {
    this.loading.next(true);
    return this.httpClient.post<ApiResponse<T>>(this.baseUrl, item).pipe(
      tap(response => {
        this.logger.info('Item created successfully');
        this.refreshList();
      }),
      catchError(error => {
        this.logger.error('Failed to create item', error);
        return throwError(() => error);
      }),
      finalize(() => this.loading.next(false))
    );
  }

  update(id: any, item: Partial<T>): Observable<ApiResponse<T>> {
    this.loading.next(true);
    return this.httpClient.put<ApiResponse<T>>(`${this.baseUrl}/${id}`, item).pipe(
      tap(response => {
        this.logger.info('Item updated successfully');
        if (response.data) {
          this.item.next(response.data);
        }
        this.refreshList();
      }),
      catchError(error => {
        this.logger.error(`Failed to update item ${id}`, error);
        return throwError(() => error);
      }),
      finalize(() => this.loading.next(false))
    );
  }

  delete(id: string | number): Observable<any> {
    this.loading.next(true);
    return this.httpClient.delete(`${this.baseUrl}/${id}`).pipe(
      tap(() => {
        this.logger.info('Item deleted successfully');
        const currentItems = this.items.value;
        const updatedItems = currentItems.filter(item => item[this.idKey] !== id);
        this.items.next(updatedItems);
      }),
      catchError(error => {
        this.logger.error(`Failed to delete item ${id}`, error);
        return throwError(() => error);
      }),
      finalize(() => this.loading.next(false))
    );
  }

  // Utility methods
  refreshList(): void {
    const currentPagination = this.pagination.value;
    this.get({
      page: currentPagination.current_page,
      per_page: currentPagination.per_page
    }).subscribe();
  }

  resetState(): void {
    this.item.next(null);
    this.items.next([]);
    this.loading.next(false);
    this.pagination.next({
      current_page: 1,
      per_page: 10,
      total: 0,
      last_page: 1
    });
  }
}
