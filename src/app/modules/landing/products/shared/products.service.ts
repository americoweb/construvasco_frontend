import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ConfigService } from '../../../../core/services/config.service';
import { API_ENDPOINTS } from '../../../../shared/constants/api-endpoints';
import { ApiResponse } from '../../../../core/models/api.types';
import { ProductListItem, ProductsQueryParams } from './products.types';
import { Category } from '../../../admin/categories/shared/category.types';

@Injectable({
  providedIn: 'root'
})
export class ProductsService {
  constructor(
    private http: HttpClient,
    private configService: ConfigService
  ) {}

  /**
   * Get all active products (public endpoint)
   */
  getProducts(params?: ProductsQueryParams): Observable<ApiResponse<ProductListItem[]>> {
    let httpParams = new HttpParams();
    
    if (params) {
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
      if (params.categoria) httpParams = httpParams.set('category', params.categoria);
      if (params.subcategoria) httpParams = httpParams.set('subcategory', params.subcategoria);
      if (params.busca) httpParams = httpParams.set('search', params.busca);
    }

    const url = this.configService.getApiUrl(API_ENDPOINTS.PRODUCTS.PUBLIC_ACTIVE);
    return this.http.get<ApiResponse<ProductListItem[]>>(url, { params: httpParams }).pipe(
      map(response => {
        // Transform products to ProductListItem format
        if (response.data) {
          response.data = response.data.map(product => this.transformProduct(product));
        }
        return response;
      }),
      catchError(error => {
        console.error('Error fetching products:', error);
        throw error;
      })
    );
  }

  /**
   * Get products by category slug
   */
  getProductsByCategory(categorySlug: string, params?: ProductsQueryParams): Observable<ApiResponse<ProductListItem[]>> {
    const queryParams: ProductsQueryParams = {
      ...params,
      categoria: categorySlug
    };
    return this.getProducts(queryParams);
  }

  /**
   * Search products
   */
  searchProducts(query: string, params?: ProductsQueryParams): Observable<ApiResponse<ProductListItem[]>> {
    const queryParams: ProductsQueryParams = {
      ...params,
      busca: query
    };
    return this.getProducts(queryParams);
  }

  /**
   * Get active categories (public endpoint)
   */
  getCategories(): Observable<ApiResponse<Category[]>> {
    const url = this.configService.getApiUrl(API_ENDPOINTS.CATEGORIES.PUBLIC_ACTIVE);
    return this.http.get<ApiResponse<Category[]>>(url).pipe(
      catchError(error => {
        console.error('Error fetching categories:', error);
        throw error;
      })
    );
  }

  /**
   * Transform product from API to ProductListItem
   */
  private transformProduct(product: any): ProductListItem {
    return {
      id: product.id,
      uuid: product.uuid,
      name: product.name,
      slug: product.slug,
      description: product.description,
      short_description: product.short_description || this.truncateDescription(product.description),
      price: product.price,
      price_formatted: product.price_formatted || this.formatPrice(product.price),
      base_price: product.price,
      min_quantity: product.min_quantity || product.minimum_quantity || 1,
      minimum_quantity: product.min_quantity || product.minimum_quantity || 1,
      image_url: product.image_url,
      base_image_url: product.base_image_url,
      category_id: product.category_id,
      category_name: product.category?.name,
      category_slug: product.category?.slug,
      lead_time_days: product.lead_time_days || 7,
      is_popular: product.is_popular || false,
      is_new: product.is_new || false,
      is_featured: product.is_featured || false,
      discount_percentage: product.discount_percentage,
      status: product.status,
      tags: product.tags || [],
      created_at: product.created_at,
      updated_at: product.updated_at
    };
  }

  /**
   * Truncate description to short description
   */
  private truncateDescription(description: string | null, maxLength: number = 100): string {
    if (!description) return '';
    if (description.length <= maxLength) return description;
    return description.substring(0, maxLength).trim() + '...';
  }

  /**
   * Format price in MZN
   */
  private formatPrice(price: number): string {
    return new Intl.NumberFormat('pt-MZ', {
      style: 'currency',
      currency: 'MZN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  }
}

