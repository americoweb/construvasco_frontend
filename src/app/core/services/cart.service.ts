import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { ConfigService } from './config.service';
import { API_ENDPOINTS } from '../../shared/constants/api-endpoints';
import { ApiResponse } from '../models/api.types';

export interface CartItem {
  id: number;
  uuid: string;
  product_id: number;
  design_id: number | null;
  product: {
    id: number;
    name: string;
    slug: string;
    image_url: string | null;
    min_quantity: number;
  };
  color: {
    id: number;
    name: string;
    hex_code: string;
  };
  print_area: {
    id: number;
    name: string;
  };
  design_prompt: string | null;
  mockup_url: string | null;
  quantity: number;
  unit_price: number;
  formatted_unit_price: string;
  total_price: number;
  formatted_total: string;
  created_at: string;
  updated_at: string;
}

export interface Cart {
  id: number;
  uuid: string;
  user_id: number | null;
  session_id: string | null;
  item_count: number;
  total_items: number;
  subtotal: number;
  formatted_subtotal: string;
  currency: string;
  is_empty: boolean;
  is_expired: boolean;
  expires_at: string | null;
  items: CartItem[];
  created_at: string;
  updated_at: string;
}

export interface AddToCartRequest {
  product_id: number;
  design_id?: number | null;
  product_color_id: number;
  product_print_area_id: number;
  quantity: number;
  unit_price: number;
  design_prompt?: string | null;
  mockup_url?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartSubject = new BehaviorSubject<Cart | null>(null);
  public cart$ = this.cartSubject.asObservable();

  private sessionIdKey = 'cart_session_id';

  constructor(
    private http: HttpClient,
    private configService: ConfigService
  ) {
    // Load cart on service initialization
    this.loadCart();
  }

  /**
   * Get or generate session ID
   */
  getSessionId(): string {
    let sessionId = localStorage.getItem(this.sessionIdKey);
    if (!sessionId) {
      // Generate a simple session ID (in production, this should come from backend)
      sessionId = this.generateSessionId();
      localStorage.setItem(this.sessionIdKey, sessionId);
    }
    return sessionId;
  }

  /**
   * Generate a simple session ID
   */
  private generateSessionId(): string {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Get or create cart
   */
  getCart(sessionId?: string): Observable<ApiResponse<Cart>> {
    const session = sessionId || this.getSessionId();
    const url = this.configService.getApiUrl(API_ENDPOINTS.CART.GET);
    const params = new HttpParams().set('session_id', session);

    return this.http.get<ApiResponse<Cart>>(url, { params }).pipe(
      tap(response => {
        if (response.data) {
          this.cartSubject.next(response.data);
        }
      }),
      catchError(error => {
        console.error('Error fetching cart:', error);
        throw error;
      })
    );
  }

  /**
   * Load cart (called on service init)
   */
  private loadCart(): void {
    this.getCart().subscribe({
      next: () => {},
      error: () => {
        // Cart doesn't exist yet, that's okay
        this.cartSubject.next(null);
      }
    });
  }

  /**
   * Add item to cart
   */
  addItem(itemData: AddToCartRequest): Observable<ApiResponse<any>> {
    const url = this.configService.getApiUrl(API_ENDPOINTS.CART.ADD_ITEM);
    const sessionId = this.getSessionId();
    
    const requestBody = {
      ...itemData,
      session_id: sessionId
    };

    return this.http.post<ApiResponse<any>>(url, requestBody).pipe(
      tap(() => {
        // Reload cart after adding item
        this.getCart().subscribe();
      }),
      catchError(error => {
        console.error('Error adding item to cart:', error);
        throw error;
      })
    );
  }

  /**
   * Update item quantity in cart
   */
  updateItem(itemId: number, quantity: number): Observable<ApiResponse<CartItem>> {
    const url = this.configService.getApiUrl(API_ENDPOINTS.CART.UPDATE_ITEM(itemId));
    const requestBody = { quantity };

    return this.http.put<ApiResponse<CartItem>>(url, requestBody).pipe(
      tap(() => {
        // Reload cart after updating item
        this.getCart().subscribe();
      }),
      catchError(error => {
        console.error('Error updating cart item:', error);
        throw error;
      })
    );
  }

  /**
   * Remove item from cart
   */
  removeItem(itemId: number): Observable<ApiResponse<void>> {
    const url = this.configService.getApiUrl(API_ENDPOINTS.CART.REMOVE_ITEM(itemId));

    return this.http.delete<ApiResponse<void>>(url).pipe(
      tap(() => {
        // Reload cart after removing item
        this.getCart().subscribe();
      }),
      catchError(error => {
        console.error('Error removing cart item:', error);
        throw error;
      })
    );
  }

  /**
   * Get cart item count
   */
  getCartCount(): Observable<number> {
    return new Observable(observer => {
      this.cart$.subscribe(cart => {
        observer.next(cart?.item_count || 0);
      });
    });
  }

  /**
   * Get current cart value
   */
  getCurrentCart(): Cart | null {
    return this.cartSubject.value;
  }

  /**
   * Clear cart from memory (doesn't delete on server)
   */
  clearCartCache(): void {
    this.cartSubject.next(null);
  }
}

