import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ConfigService } from '../../../core/services/config.service';
import { API_ENDPOINTS } from '../../../shared/constants/api-endpoints';
import { ApiResponse } from '../../../core/models/api.types';

export interface AISuggestionRequest {
  goal: string;
  budget: number;
  logo_base64?: string;
  logo_mime_type?: string;
  reference_image_base64?: string;
  reference_image_mime_type?: string;
  max_suggestions?: number;
  include_bundles?: boolean;
}

export interface ProductSuggestion {
  name: string;
  design_prompt: string;
  theme?: string;
  text_to_print?: string;
  color_style?: string;
  price: number;
  quantity: number;
  total_price: number;
  formatted_price: string;
  formatted_total: string;
  mockup_url: string;
  product_id: number;
}

export interface Suggestion {
  type: string;
  title: string;
  products: ProductSuggestion[];
  estimated_total: number;
  formatted_total: string;
  cta: string;
  bundle_theme?: string;
  product_count: number;
  is_bundle: boolean;
}

export interface AISuggestionsResponse {
  data: {
    suggestions: Suggestion[];
    total_suggestions: number;
    has_bundles: boolean;
  };
  goal: string;
  budget: number;
}

export interface Product {
  id: number;
  uuid: string;
  name: string;
  slug: string;
  price: number;
  price_formatted: string;
  min_quantity: number;
  image_url: string | null;
  status: string;
  is_featured: boolean;
  is_available: boolean;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image_url?: string | null;
  icon?: string;
  is_active: boolean;
  parent_id?: number | null;
}

export interface Testimonial {
  id: number;
  client_name: string;
  client_position?: string;
  client_company?: string;
  client_photo?: string | null;
  rating: number;
  comment: string;
  is_active: boolean;
  product_id?: number;
  created_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class HomeService {
  constructor(
    private http: HttpClient,
    private configService: ConfigService
  ) {}

  /**
   * Get AI-powered product suggestions
   */
  getAISuggestions(request: AISuggestionRequest): Observable<AISuggestionsResponse> {
    const url = this.configService.getApiUrl(API_ENDPOINTS.AI.SUGGESTIONS);
    return this.http.post<AISuggestionsResponse>(url, request).pipe(
      catchError(error => {
        console.error('Error fetching AI suggestions:', error);
        throw error;
      })
    );
  }

  /**
   * Get active products (public endpoint)
   */
  getActiveProducts(): Observable<ApiResponse<Product[]>> {
    const url = this.configService.getApiUrl(API_ENDPOINTS.PRODUCTS.PUBLIC_ACTIVE);
    return this.http.get<ApiResponse<Product[]>>(url).pipe(
      catchError(error => {
        console.error('Error fetching active products:', error);
        throw error;
      })
    );
  }

  /**
   * Get featured products (public endpoint)
   */
  getFeaturedProducts(): Observable<ApiResponse<Product[]>> {
    const url = this.configService.getApiUrl(API_ENDPOINTS.PRODUCTS.PUBLIC_FEATURED);
    return this.http.get<ApiResponse<Product[]>>(url).pipe(
      catchError(error => {
        console.error('Error fetching featured products:', error);
        throw error;
      })
    );
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
   * Get root (parent) categories (public endpoint)
   */
  getRootCategories(): Observable<ApiResponse<Category[]>> {
    const url = this.configService.getApiUrl(API_ENDPOINTS.CATEGORIES.PUBLIC_ROOT);
    return this.http.get<ApiResponse<Category[]>>(url).pipe(
      catchError(error => {
        console.error('Error fetching root categories:', error);
        throw error;
      })
    );
  }

  /**
   * Get testimonials (public endpoint)
   */
  getTestimonials(): Observable<ApiResponse<Testimonial[]>> {
    const url = this.configService.getApiUrl(API_ENDPOINTS.TESTIMONIALS.PUBLIC_LIST);
    return this.http.get<ApiResponse<Testimonial[]>>(url).pipe(
      catchError(error => {
        console.error('Error fetching testimonials:', error);
        throw error;
      })
    );
  }

  /**
   * Convert file to base64
   */
  fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix (e.g., "data:image/png;base64,")
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  }
}

