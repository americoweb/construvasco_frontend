import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError, finalize, switchMap } from 'rxjs/operators';
import { BaseService } from '../../../../shared/services/base.service';
import { ConfigService } from '../../../../core/services/config.service';
import { LoggingService } from '../../../../core/services/logging.service';
import { ApiResponse } from '../../../../core/models/api.types';
import { API_ENDPOINTS } from '../../../../shared/constants/api-endpoints';
import {
  Product,
  ProductColor,
  ProductPrintArea,
  ProductSize,
  ProductSizeRestriction,
  CreateProductRequest,
  UpdateProductRequest,
  CreateProductColorRequest,
  UpdateProductColorRequest,
  CreateProductPrintAreaRequest,
  UpdateProductPrintAreaRequest,
  CreateProductSizeRequest,
  UpdateProductSizeRequest,
  CreateProductSizeRestrictionRequest,
  ProductStatus
} from './product.types';

@Injectable({
  providedIn: 'root'
})
export class ProductService extends BaseService<Product> {
  constructor(
    httpClient: HttpClient,
    configService: ConfigService,
    logger: LoggingService
  ) {
    super(httpClient, configService, logger, API_ENDPOINTS.PRODUCTS.BASE);
  }

  // Get product with full details (colors and print areas)
  getProductWithDetails(id: number): Observable<ApiResponse<Product>> {
    return this.getOne(id).pipe(
      map(response => {
        // The backend should return product with colors and print_areas loaded
        return response;
      })
    );
  }

  // Toggle featured status
  toggleFeatured(id: number): Observable<ApiResponse<Product>> {
    this.loading.next(true);
    return this.httpClient.post<ApiResponse<Product>>(
      this.configService.getApiUrl(API_ENDPOINTS.PRODUCTS.TOGGLE_FEATURED(id)),
      {}
    ).pipe(
      map(response => {
        if (response.data) {
          this.item.next(response.data);
          // Update in items list if present
          const currentItems = this.items.value;
          const index = currentItems.findIndex(p => p.id === id);
          if (index !== -1) {
            currentItems[index] = response.data;
            this.items.next([...currentItems]);
          }
        }
        return response;
      }),
      this.handleError('toggleFeatured'),
      this.finalizeLoading()
    );
  }

  // Color management methods
  getProductColors(productId: number): Observable<ApiResponse<ProductColor[]>> {
    this.loading.next(true);
    return this.httpClient.get<ApiResponse<ProductColor[]>>(
      this.configService.getApiUrl(API_ENDPOINTS.PRODUCTS.COLORS(productId))
    ).pipe(
      this.handleError('getProductColors'),
      this.finalizeLoading()
    );
  }

  createColor(productId: number, color: CreateProductColorRequest): Observable<ApiResponse<ProductColor>> {
    this.loading.next(true);
    return this.httpClient.post<ApiResponse<ProductColor>>(
      this.configService.getApiUrl(API_ENDPOINTS.PRODUCTS.COLORS(productId)),
      color
    ).pipe(
      this.handleError('createColor'),
      this.finalizeLoading()
    );
  }

  updateColor(productId: number, colorId: number, color: UpdateProductColorRequest): Observable<ApiResponse<ProductColor>> {
    this.loading.next(true);
    return this.httpClient.put<ApiResponse<ProductColor>>(
      this.configService.getApiUrl(API_ENDPOINTS.PRODUCTS.COLOR_UPDATE(productId, colorId)),
      color
    ).pipe(
      this.handleError('updateColor'),
      this.finalizeLoading()
    );
  }

  deleteColor(productId: number, colorId: number): Observable<ApiResponse<any>> {
    this.loading.next(true);
    return this.httpClient.delete<ApiResponse<any>>(
      this.configService.getApiUrl(API_ENDPOINTS.PRODUCTS.COLOR_DELETE(productId, colorId))
    ).pipe(
      this.handleError('deleteColor'),
      this.finalizeLoading()
    );
  }

  updateColorStock(productId: number, colorId: number, quantity: number): Observable<ApiResponse<ProductColor>> {
    this.loading.next(true);
    return this.httpClient.patch<ApiResponse<ProductColor>>(
      this.configService.getApiUrl(API_ENDPOINTS.PRODUCTS.COLOR_STOCK(productId, colorId)),
      { quantity }
    ).pipe(
      this.handleError('updateColorStock'),
      this.finalizeLoading()
    );
  }

  // Print area management methods
  getProductPrintAreas(productId: number): Observable<ApiResponse<ProductPrintArea[]>> {
    this.loading.next(true);
    return this.httpClient.get<ApiResponse<ProductPrintArea[]>>(
      this.configService.getApiUrl(API_ENDPOINTS.PRODUCTS.PRINT_AREAS(productId))
    ).pipe(
      this.handleError('getProductPrintAreas'),
      this.finalizeLoading()
    );
  }

  createPrintArea(productId: number, area: CreateProductPrintAreaRequest): Observable<ApiResponse<ProductPrintArea>> {
    this.loading.next(true);
    return this.httpClient.post<ApiResponse<ProductPrintArea>>(
      this.configService.getApiUrl(API_ENDPOINTS.PRODUCTS.PRINT_AREAS(productId)),
      area
    ).pipe(
      this.handleError('createPrintArea'),
      this.finalizeLoading()
    );
  }

  updatePrintArea(productId: number, areaId: number, area: UpdateProductPrintAreaRequest): Observable<ApiResponse<ProductPrintArea>> {
    this.loading.next(true);
    return this.httpClient.put<ApiResponse<ProductPrintArea>>(
      this.configService.getApiUrl(API_ENDPOINTS.PRODUCTS.PRINT_AREA_UPDATE(productId, areaId)),
      area
    ).pipe(
      this.handleError('updatePrintArea'),
      this.finalizeLoading()
    );
  }

  deletePrintArea(productId: number, areaId: number): Observable<ApiResponse<any>> {
    this.loading.next(true);
    return this.httpClient.delete<ApiResponse<any>>(
      this.configService.getApiUrl(API_ENDPOINTS.PRODUCTS.PRINT_AREA_DELETE(productId, areaId))
    ).pipe(
      this.handleError('deletePrintArea'),
      this.finalizeLoading()
    );
  }

  // Size management methods
  getProductSizes(productId: number): Observable<ApiResponse<ProductSize[]>> {
    this.loading.next(true);
    return this.httpClient.get<ApiResponse<ProductSize[]>>(
      this.configService.getApiUrl(API_ENDPOINTS.PRODUCTS.SIZES(productId))
    ).pipe(
      this.handleError('getProductSizes'),
      this.finalizeLoading()
    );
  }

  createSize(productId: number, size: CreateProductSizeRequest): Observable<ApiResponse<ProductSize>> {
    this.loading.next(true);
    return this.httpClient.post<ApiResponse<ProductSize>>(
      this.configService.getApiUrl(API_ENDPOINTS.PRODUCTS.SIZES(productId)),
      size
    ).pipe(
      this.handleError('createSize'),
      this.finalizeLoading()
    );
  }

  updateSize(productId: number, sizeId: number, size: UpdateProductSizeRequest): Observable<ApiResponse<ProductSize>> {
    this.loading.next(true);
    return this.httpClient.put<ApiResponse<ProductSize>>(
      this.configService.getApiUrl(API_ENDPOINTS.PRODUCTS.SIZE_UPDATE(productId, sizeId)),
      size
    ).pipe(
      this.handleError('updateSize'),
      this.finalizeLoading()
    );
  }

  deleteSize(productId: number, sizeId: number): Observable<ApiResponse<any>> {
    this.loading.next(true);
    return this.httpClient.delete<ApiResponse<any>>(
      this.configService.getApiUrl(API_ENDPOINTS.PRODUCTS.SIZE_DELETE(productId, sizeId))
    ).pipe(
      this.handleError('deleteSize'),
      this.finalizeLoading()
    );
  }

  getProductSizeRestrictions(productId: number): Observable<ApiResponse<ProductSizeRestriction | null>> {
    this.loading.next(true);
    return this.httpClient.get<ApiResponse<ProductSizeRestriction | null>>(
      this.configService.getApiUrl(API_ENDPOINTS.PRODUCTS.SIZE_RESTRICTIONS(productId))
    ).pipe(
      this.handleError('getProductSizeRestrictions'),
      this.finalizeLoading()
    );
  }

  createOrUpdateSizeRestrictions(productId: number, restrictions: CreateProductSizeRestrictionRequest): Observable<ApiResponse<ProductSizeRestriction>> {
    this.loading.next(true);
    // First try to get existing restrictions
    return this.getProductSizeRestrictions(productId).pipe(
      switchMap(response => {
        if (response.data && response.data.id) {
          // Update existing
          return this.httpClient.put<ApiResponse<ProductSizeRestriction>>(
            this.configService.getApiUrl(`${API_ENDPOINTS.PRODUCTS.BASE}/${productId}/size-restrictions/${response.data.id}`),
            restrictions
          ).pipe(
            this.handleError('updateSizeRestrictions'),
            this.finalizeLoading()
          );
        } else {
          // Create new
          return this.httpClient.post<ApiResponse<ProductSizeRestriction>>(
            this.configService.getApiUrl(API_ENDPOINTS.PRODUCTS.SIZE_RESTRICTIONS(productId)),
            restrictions
          ).pipe(
            this.handleError('createSizeRestrictions'),
            this.finalizeLoading()
          );
        }
      })
    );
  }

  // Image upload methods
  uploadImageFile(productId: number, file: File): Observable<ApiResponse<Product>> {
    this.loading.next(true);
    const formData = new FormData();
    formData.append('image', file);

    return this.httpClient.post<ApiResponse<Product>>(
      this.configService.getApiUrl(API_ENDPOINTS.PRODUCTS.UPLOAD_IMAGE(productId)),
      formData
    ).pipe(
      map(response => {
        if (response.data) {
          // Update in items list if present
          const currentItems = this.items.value;
          const index = currentItems.findIndex(p => p.id === productId);
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

  uploadBaseImageFile(productId: number, file: File): Observable<ApiResponse<Product>> {
    this.loading.next(true);
    const formData = new FormData();
    formData.append('image', file);

    return this.httpClient.post<ApiResponse<Product>>(
      this.configService.getApiUrl(API_ENDPOINTS.PRODUCTS.UPLOAD_BASE_IMAGE(productId)),
      formData
    ).pipe(
      map(response => {
        if (response.data) {
          // Update in items list if present
          const currentItems = this.items.value;
          const index = currentItems.findIndex(p => p.id === productId);
          if (index !== -1) {
            currentItems[index] = response.data;
            this.items.next([...currentItems]);
          }
          this.item.next(response.data);
        }
        return response;
      }),
      this.handleError('uploadBaseImageFile'),
      this.finalizeLoading()
    );
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

