import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from '../../core/services/config.service';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import { ApiDataResponse } from './construction.types';

export interface CreditBalance {
  balance: number;
}

export interface CreditTransaction {
  id: number;
  type: string;
  amount: number;
  balance_after: number;
  notes?: string | null;
  created_at: string;
}

export interface CreditPackage {
  id: number;
  name: string;
  credits_amount: number;
  price_mt: number;
}

@Injectable({ providedIn: 'root' })
export class CreditsService {
  constructor(
    private http: HttpClient,
    private config: ConfigService
  ) {}

  getBalance(): Observable<ApiDataResponse<CreditBalance>> {
    return this.http.get<ApiDataResponse<CreditBalance>>(
      this.config.getApiUrl(API_ENDPOINTS.CUSTOMER.CREDITS.BALANCE)
    );
  }

  getHistory(): Observable<ApiDataResponse<CreditTransaction[]>> {
    return this.http.get<ApiDataResponse<CreditTransaction[]>>(
      this.config.getApiUrl(API_ENDPOINTS.CUSTOMER.CREDITS.HISTORY)
    );
  }

  getPackages(): Observable<ApiDataResponse<CreditPackage[]>> {
    return this.http.get<ApiDataResponse<CreditPackage[]>>(
      this.config.getApiUrl(API_ENDPOINTS.CUSTOMER.CREDITS.PACKAGES)
    );
  }

  grantManual(
    userId: number | string,
    amount: number,
    notes: string
  ): Observable<ApiDataResponse<{ user_id: number; balance: number }>> {
    return this.http.post<ApiDataResponse<{ user_id: number; balance: number }>>(
      this.config.getApiUrl(API_ENDPOINTS.ADMIN.CREDITS.GRANT(userId)),
      { amount, notes }
    );
  }

  getBalanceFor(userId: number | string): Observable<
    ApiDataResponse<{ user_id: number; balance: number; history: CreditTransaction[] }>
  > {
    return this.http.get<
      ApiDataResponse<{ user_id: number; balance: number; history: CreditTransaction[] }>
    >(this.config.getApiUrl(API_ENDPOINTS.ADMIN.CREDITS.BALANCE(userId)));
  }
}
