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
  Order,
  OrderStatus,
  UpdateOrderStatusRequest,
  CancelOrderRequest,
  CreateOrderPayload
} from './order.types';

@Injectable({
  providedIn: 'root'
})
export class OrderService extends BaseService<Order> {
  constructor(
    httpClient: HttpClient,
    configService: ConfigService,
    logger: LoggingService
  ) {
    super(httpClient, configService, logger, API_ENDPOINTS.ORDERS.BASE);
  }

  /**
   * Create an order from the admin area (authenticated). Same body as public checkout order creation.
   */
  createManualOrder(payload: CreateOrderPayload): Observable<ApiResponse<Order>> {
    this.loading.next(true);
    return this.httpClient
      .post<ApiResponse<Order>>(this.configService.getApiUrl(API_ENDPOINTS.ORDERS.BASE), payload)
      .pipe(
        tap(() => this.logger.info('Manual order created')),
        tap(() => this.refreshList()),
        catchError((error) => {
          this.logger.error('Failed to create manual order', error);
          return throwError(() => error);
        }),
        finalize(() => this.loading.next(false))
      );
  }

  // Get order with full details (items and status history)
  getOrderWithDetails(id: number): Observable<ApiResponse<Order>> {
    return this.getOne(id).pipe(
      map(response => {
        // The backend should return order with items and status_history loaded
        return response;
      })
    );
  }

  // Update order status
  updateStatus(id: number, status: OrderStatus, notes?: string): Observable<ApiResponse<Order>> {
    this.loading.next(true);
    const payload: UpdateOrderStatusRequest = { status, notes };
    return this.httpClient.patch<ApiResponse<Order>>(
      this.configService.getApiUrl(API_ENDPOINTS.ORDERS.UPDATE_STATUS(id)),
      payload
    ).pipe(
      map(response => {
        if (response.data) {
          this.item.next(response.data);
          // Update in items list if present
          const currentItems = this.items.value;
          const index = currentItems.findIndex(o => o.id === id);
          if (index !== -1) {
            currentItems[index] = response.data;
            this.items.next([...currentItems]);
          }
        }
        return response;
      }),
      this.handleError('updateStatus'),
      this.finalizeLoading()
    );
  }

  // Confirm order
  confirm(id: number): Observable<ApiResponse<Order>> {
    this.loading.next(true);
    return this.httpClient.post<ApiResponse<Order>>(
      this.configService.getApiUrl(API_ENDPOINTS.ORDERS.CONFIRM(id)),
      {}
    ).pipe(
      map(response => {
        if (response.data) {
          this.item.next(response.data);
          this.updateItemInList(response.data);
        }
        return response;
      }),
      this.handleError('confirm'),
      this.finalizeLoading()
    );
  }

  // Mark order as in production
  markInProduction(id: number): Observable<ApiResponse<Order>> {
    this.loading.next(true);
    return this.httpClient.post<ApiResponse<Order>>(
      this.configService.getApiUrl(API_ENDPOINTS.ORDERS.IN_PRODUCTION(id)),
      {}
    ).pipe(
      map(response => {
        if (response.data) {
          this.item.next(response.data);
          this.updateItemInList(response.data);
        }
        return response;
      }),
      this.handleError('markInProduction'),
      this.finalizeLoading()
    );
  }

  // Mark order as shipped
  markShipped(id: number): Observable<ApiResponse<Order>> {
    this.loading.next(true);
    return this.httpClient.post<ApiResponse<Order>>(
      this.configService.getApiUrl(API_ENDPOINTS.ORDERS.SHIP(id)),
      {}
    ).pipe(
      map(response => {
        if (response.data) {
          this.item.next(response.data);
          this.updateItemInList(response.data);
        }
        return response;
      }),
      this.handleError('markShipped'),
      this.finalizeLoading()
    );
  }

  // Mark order as delivered
  markDelivered(id: number): Observable<ApiResponse<Order>> {
    this.loading.next(true);
    return this.httpClient.post<ApiResponse<Order>>(
      this.configService.getApiUrl(API_ENDPOINTS.ORDERS.DELIVER(id)),
      {}
    ).pipe(
      map(response => {
        if (response.data) {
          this.item.next(response.data);
          this.updateItemInList(response.data);
        }
        return response;
      }),
      this.handleError('markDelivered'),
      this.finalizeLoading()
    );
  }

  // Cancel order
  cancel(id: number, reason?: string): Observable<ApiResponse<Order>> {
    this.loading.next(true);
    const payload: CancelOrderRequest = { reason };
    return this.httpClient.post<ApiResponse<Order>>(
      this.configService.getApiUrl(API_ENDPOINTS.ORDERS.CANCEL(id)),
      payload
    ).pipe(
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

  // Mark order as paid
  markAsPaid(id: number): Observable<ApiResponse<Order>> {
    this.loading.next(true);
    return this.httpClient.post<ApiResponse<Order>>(
      this.configService.getApiUrl(API_ENDPOINTS.ORDERS.MARK_PAID(id)),
      {}
    ).pipe(
      map(response => {
        if (response.data) {
          this.item.next(response.data);
          this.updateItemInList(response.data);
        }
        return response;
      }),
      this.handleError('markAsPaid'),
      this.finalizeLoading()
    );
  }

  // Get pending orders
  getPendingOrders(): Observable<ApiResponse<Order[]>> {
    this.loading.next(true);
    return this.httpClient.get<ApiResponse<Order[]>>(
      this.configService.getApiUrl(API_ENDPOINTS.ORDERS.PENDING)
    ).pipe(
      map(response => {
        if (response.data) {
          this.items.next(response.data);
        }
        return response;
      }),
      this.handleError('getPendingOrders'),
      this.finalizeLoading()
    );
  }

  // Get active orders
  getActiveOrders(): Observable<ApiResponse<Order[]>> {
    this.loading.next(true);
    return this.httpClient.get<ApiResponse<Order[]>>(
      this.configService.getApiUrl(API_ENDPOINTS.ORDERS.ACTIVE)
    ).pipe(
      map(response => {
        if (response.data) {
          this.items.next(response.data);
        }
        return response;
      }),
      this.handleError('getActiveOrders'),
      this.finalizeLoading()
    );
  }

  // Get user orders (for customer account page)
  getUserOrders(page: number = 1, perPage: number = 15): Observable<ApiResponse<Order[]>> {
    this.loading.next(true);
    return this.httpClient.get<ApiResponse<Order[]>>(
      this.configService.getApiUrl(`${API_ENDPOINTS.ORDERS.USER_ORDERS}?page=${page}&per_page=${perPage}`)
    ).pipe(
      map(response => {
        if (response.data) {
          this.items.next(response.data);
        }
        return response;
      }),
      this.handleError('getUserOrders'),
      this.finalizeLoading()
    );
  }

  // Helper method to update item in list
  private updateItemInList(updatedOrder: Order): void {
    const currentItems = this.items.value;
    const index = currentItems.findIndex(o => o.id === updatedOrder.id);
    if (index !== -1) {
      currentItems[index] = updatedOrder;
      this.items.next([...currentItems]);
    }
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

