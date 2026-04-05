import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';
import { API_ENDPOINTS } from '../../shared/constants/api-endpoints';
import { ApiResponse } from '../models/api.types';

export interface PaymentRequest {
  amount: number;
  phone: string;
  reference?: string;
}

export interface ProofUploadRequest {
  amount: number;
  reference?: string;
  bank_account?: string;
  transfer_date?: string;
  notes?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  constructor(
    private http: HttpClient,
    private configService: ConfigService
  ) {}

  /**
   * Process payment via M-Pesa
   * @param data Payment request data
   */
  payWithMpesa(data: PaymentRequest): Observable<ApiResponse<any>> {
    const url = this.configService.getApiUrl(API_ENDPOINTS.PAYMENTS.MPESA);
    return this.http.post<ApiResponse<any>>(url, data);
  }

  /**
   * Process payment via Emola
   * @param data Payment request data
   */
  payWithEmola(data: PaymentRequest): Observable<ApiResponse<any>> {
    const url = this.configService.getApiUrl(API_ENDPOINTS.PAYMENTS.EMOLA);
    return this.http.post<ApiResponse<any>>(url, data);
  }

  /**
   * Upload payment proof for manual review
   * @param formData FormData containing file and payment information
   */
  payWithProofUpload(formData: FormData): Observable<ApiResponse<any>> {
    const url = this.configService.getApiUrl(API_ENDPOINTS.PAYMENTS.PROOF_UPLOAD);
    return this.http.post<ApiResponse<any>>(url, formData);
  }
}

