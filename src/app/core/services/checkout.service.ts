import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';
import { API_ENDPOINTS } from '../../shared/constants/api-endpoints';
import { ApiResponse } from '../models/api.types';

export interface CheckoutSummary {
  cart_uuid: string;
  items: Array<{
    id: string;
    product_name: string;
    color_name: string;
    print_area_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    formatted_unit_price: string;
    formatted_total: string;
    mockup_url: string | null;
    min_quantity: number;
  }>;
  subtotal: number;
  formatted_subtotal: string;
  total_items: number;
  shipping_options: Array<{
    id: string;
    name: string;
    cost: number;
    formatted_cost: string;
    estimated_days: number;
  }>;
}

export interface ProcessCheckoutRequest {
  cart_id?: number;
  cart_uuid?: string;
  shipping_name: string;
  shipping_address: string;
  shipping_city?: string;
  shipping_state?: string;
  shipping_postal_code?: string;
  shipping_country?: string;
  shipping_phone?: string;
  shipping_whatsapp: string;
  billing_name?: string;
  billing_email: string;
  notes?: string;
  discount_amount?: number;
  payment_method?: 'mpesa' | 'emola' | 'proof_upload';
  payment_reference?: string;
  payment_transaction_id?: string;
}

export interface CheckoutResult {
  order_id: string;
  order_number: string;
  status: string;
  status_label: string;
  payment_status: string;
  payment_status_label: string;
  subtotal: number;
  shipping_cost: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  formatted_total: string;
  currency: string;
  shipping: {
    name: string;
    address: string;
    city: string;
    state: string;
    country: string;
    whatsapp: string;
  };
  billing_email: string;
  items_count: number;
  items: Array<{
    product_name: string;
    color_name: string;
    print_area_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    mockup_url: string | null;
  }>;
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class CheckoutService {
  constructor(
    private http: HttpClient,
    private configService: ConfigService
  ) {}

  getSummary(cartUuid: string): Observable<ApiResponse<CheckoutSummary>> {
    const url = this.configService.getApiUrl(API_ENDPOINTS.CHECKOUT.SUMMARY(cartUuid));
    return this.http.get<ApiResponse<CheckoutSummary>>(url);
  }

  getShippingOptions(cartUuid: string): Observable<ApiResponse<any>> {
    const url = this.configService.getApiUrl(API_ENDPOINTS.CHECKOUT.SHIPPING(cartUuid));
    return this.http.get<ApiResponse<any>>(url);
  }

  validateData(data: Partial<ProcessCheckoutRequest>): Observable<ApiResponse<{ valid: boolean; errors?: any }>> {
    const url = this.configService.getApiUrl(API_ENDPOINTS.CHECKOUT.VALIDATE);
    return this.http.post<ApiResponse<{ valid: boolean; errors?: any }>>(url, data);
  }

  processCheckout(data: ProcessCheckoutRequest): Observable<ApiResponse<CheckoutResult>> {
    const url = this.configService.getApiUrl(API_ENDPOINTS.CHECKOUT.PROCESS);
    return this.http.post<ApiResponse<CheckoutResult>>(url, data);
  }

  /**
   * Simulate M-Pesa payment (for MVP)
   * In production, this would integrate with actual M-Pesa API
   */
  simulateMpesaPayment(orderId: string, amount: number): Observable<ApiResponse<{ success: boolean; transaction_id: string }>> {
    // Simulate payment processing delay
    return new Observable(observer => {
      setTimeout(() => {
        observer.next({
          data: {
            success: true,
            transaction_id: `MPESA_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`
          }
        } as ApiResponse<{ success: boolean; transaction_id: string }>);
        observer.complete();
      }, 2000); // 2 second delay to simulate payment processing
    });
  }
}

