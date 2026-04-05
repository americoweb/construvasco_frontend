import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ConfigService } from '../../../core/services/config.service';
import { API_ENDPOINTS } from '../../../shared/constants/api-endpoints';
import { ApiResponse } from '../../../core/models/api.types';
import {
  ProductDetail,
  ProductColor,
  ProductPrintArea,
  ProductSize,
  ProductSizeRestriction,
  PriceCalculationRequest,
  PriceCalculationResponse,
  GenerateMockupRequest,
  GenerateMockupResponse,
  Design,
  CreateDesignRequest
} from './product.types';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  constructor(
    private http: HttpClient,
    private configService: ConfigService
  ) {}

  /**
   * Get product by slug (public endpoint)
   */
  getProductBySlug(slug: string): Observable<ApiResponse<ProductDetail>> {
    const url = this.configService.getApiUrl(API_ENDPOINTS.PRODUCTS.PUBLIC_GET_BY_SLUG(slug));
    return this.http.get<ApiResponse<ProductDetail>>(url).pipe(
      catchError(error => {
        console.error('Error fetching product by slug:', error);
        throw error;
      })
    );
  }

  /**
   * Get product by ID (public endpoint)
   */
  getProductById(id: number): Observable<ApiResponse<ProductDetail>> {
    const url = this.configService.getApiUrl(API_ENDPOINTS.PRODUCTS.PUBLIC_GET(id));
    return this.http.get<ApiResponse<ProductDetail>>(url).pipe(
      catchError(error => {
        console.error('Error fetching product by ID:', error);
        throw error;
      })
    );
  }

  /**
   * Get product colors (public endpoint)
   */
  getProductColors(productId: number): Observable<ApiResponse<ProductColor[]>> {
    const url = this.configService.getApiUrl(API_ENDPOINTS.PRODUCTS.PUBLIC_COLORS(productId));
    return this.http.get<ApiResponse<ProductColor[]>>(url).pipe(
      catchError(error => {
        console.error('Error fetching product colors:', error);
        throw error;
      })
    );
  }

  /**
   * Get product print areas (public endpoint)
   */
  getProductPrintAreas(productId: number): Observable<ApiResponse<ProductPrintArea[]>> {
    const url = this.configService.getApiUrl(API_ENDPOINTS.PRODUCTS.PUBLIC_PRINT_AREAS(productId));
    return this.http.get<ApiResponse<ProductPrintArea[]>>(url).pipe(
      catchError(error => {
        console.error('Error fetching product print areas:', error);
        throw error;
      })
    );
  }

  /**
   * Get product sizes (public endpoint)
   */
  getProductSizes(productId: number): Observable<ApiResponse<ProductSize[]>> {
    const url = this.configService.getApiUrl(API_ENDPOINTS.PRODUCTS.PUBLIC_SIZES(productId));
    return this.http.get<ApiResponse<ProductSize[]>>(url).pipe(
      catchError(error => {
        console.error('Error fetching product sizes:', error);
        throw error;
      })
    );
  }

  /**
   * Get product size restrictions (public endpoint)
   */
  getProductSizeRestrictions(productId: number): Observable<ApiResponse<ProductSizeRestriction | null>> {
    const url = this.configService.getApiUrl(API_ENDPOINTS.PRODUCTS.PUBLIC_SIZE_RESTRICTIONS(productId));
    return this.http.get<ApiResponse<ProductSizeRestriction | null>>(url).pipe(
      catchError(error => {
        console.error('Error fetching product size restrictions:', error);
        throw error;
      })
    );
  }

  /**
   * Calculate price for product with size/dimensions (public endpoint)
   */
  calculatePrice(productId: number, request: PriceCalculationRequest): Observable<ApiResponse<PriceCalculationResponse>> {
    const url = this.configService.getApiUrl(API_ENDPOINTS.PRODUCTS.PUBLIC_CALCULATE_PRICE(productId));
    return this.http.post<ApiResponse<PriceCalculationResponse>>(url, request).pipe(
      catchError(error => {
        console.error('Error calculating price:', error);
        throw error;
      })
    );
  }

  /**
   * Generate mockup via AI
   */
  generateMockup(request: GenerateMockupRequest): Observable<GenerateMockupResponse> {
    const url = this.configService.getApiUrl(API_ENDPOINTS.AI.MOCKUP);
    return this.http.post<GenerateMockupResponse>(url, request).pipe(
      catchError(error => {
        console.error('Error generating mockup:', error);
        throw error;
      })
    );
  }

  /**
   * Create design record
   */
  createDesign(request: CreateDesignRequest): Observable<ApiResponse<Design>> {
    const url = this.configService.getApiUrl(API_ENDPOINTS.DESIGNS.PUBLIC_CREATE);
    return this.http.post<ApiResponse<Design>>(url, request).pipe(
      catchError(error => {
        console.error('Error creating design:', error);
        throw error;
      })
    );
  }

  /**
   * Get design by ID
   */
  getDesign(id: number): Observable<ApiResponse<Design>> {
    const url = this.configService.getApiUrl(API_ENDPOINTS.DESIGNS.PUBLIC_GET(id));
    return this.http.get<ApiResponse<Design>>(url).pipe(
      catchError(error => {
        console.error('Error fetching design:', error);
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

  /**
   * Upload logo file to design
   */
  uploadLogoToDesign(designId: number, logoFile: File): Observable<ApiResponse<Design>> {
    const url = this.configService.getApiUrl(API_ENDPOINTS.DESIGNS.PUBLIC_UPLOAD_LOGO(designId));
    const formData = new FormData();
    formData.append('image', logoFile);
    return this.http.post<ApiResponse<Design>>(url, formData).pipe(
      catchError(error => {
        console.error('Error uploading logo to design:', error);
        throw error;
      })
    );
  }

  /**
   * Upload reference image file to design
   */
  uploadReferenceImageToDesign(designId: number, referenceFile: File): Observable<ApiResponse<Design>> {
    const url = this.configService.getApiUrl(API_ENDPOINTS.DESIGNS.PUBLIC_UPLOAD_REFERENCE(designId));
    const formData = new FormData();
    formData.append('image', referenceFile);
    return this.http.post<ApiResponse<Design>>(url, formData).pipe(
      catchError(error => {
        console.error('Error uploading reference image to design:', error);
        throw error;
      })
    );
  }
}

