import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ConfigService } from '../../../../core/services/config.service';
import { API_ENDPOINTS } from '../../../../shared/constants/api-endpoints';
import { ApiResponse } from '../../../../core/models/api.types';
import { Testimonial } from '../product.types';

@Injectable({
  providedIn: 'root'
})
export class TestimonialService {
  constructor(
    private http: HttpClient,
    private configService: ConfigService
  ) {}

  /**
   * Get all testimonials (public endpoint)
   */
  getTestimonials(productId?: number): Observable<ApiResponse<Testimonial[]>> {
    let url: string;
    if (productId) {
      url = this.configService.getApiUrl(API_ENDPOINTS.TESTIMONIALS.PUBLIC_FOR_PRODUCT(productId));
    } else {
      url = this.configService.getApiUrl(API_ENDPOINTS.TESTIMONIALS.PUBLIC_LIST);
    }
    return this.http.get<ApiResponse<Testimonial[]>>(url).pipe(
      catchError(error => {
        console.error('Error fetching testimonials:', error);
        throw error;
      })
    );
  }

  /**
   * Get testimonials for a specific product (public endpoint)
   */
  getTestimonialsForProduct(productId: number): Observable<ApiResponse<Testimonial[]>> {
    const url = this.configService.getApiUrl(API_ENDPOINTS.TESTIMONIALS.PUBLIC_FOR_PRODUCT(productId));
    return this.http.get<ApiResponse<Testimonial[]>>(url).pipe(
      catchError(error => {
        console.error('Error fetching testimonials for product:', error);
        throw error;
      })
    );
  }

  /**
   * Get a single testimonial by ID (public endpoint)
   */
  getTestimonial(id: number): Observable<ApiResponse<Testimonial>> {
    const url = this.configService.getApiUrl(API_ENDPOINTS.TESTIMONIALS.PUBLIC_GET(id));
    return this.http.get<ApiResponse<Testimonial>>(url).pipe(
      catchError(error => {
        console.error('Error fetching testimonial:', error);
        throw error;
      })
    );
  }
}

