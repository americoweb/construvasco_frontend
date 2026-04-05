import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CartService, Cart, CartItem } from '../../../../core/services/cart.service';
import { ConfigService } from '../../../../core/services/config.service';

@Component({
  selector: 'app-cart-popup',
  templateUrl: './cart-popup.component.html',
  styleUrls: ['./cart-popup.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class CartPopupComponent implements OnInit, OnDestroy {
  @Input() isOpen: boolean = false;
  @Output() close = new EventEmitter<void>();

  cart: Cart | null = null;
  isLoading = false;
  updatingItems = new Set<number>();
  removingItems = new Set<number>();
  private cartSubscription?: Subscription;

  constructor(
    private cartService: CartService,
    private configService: ConfigService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Subscribe to cart changes
    this.cartSubscription = this.cartService.cart$.subscribe(cart => {
      this.cart = cart;
    });

    // Load cart if not already loaded
    if (!this.cart) {
      this.loadCart();
    }
  }

  ngOnDestroy(): void {
    if (this.cartSubscription) {
      this.cartSubscription.unsubscribe();
    }
  }

  loadCart(): void {
    this.isLoading = true;
    this.cartService.getCart().subscribe({
      next: () => {
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  getFullImageUrl(path: string | null): string {
    if (!path) {
      // Return a data URI for a simple placeholder to avoid external requests and infinite loops
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
    }
    
    // If it's already a full URL, return as is
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    
    // Convert relative path to full URL
    return this.configService.getFileUrl(path);
  }

  getItemImage(item: CartItem): string {
    // Prefer mockup URL, then product image
    if (item.mockup_url) {
      return this.getFullImageUrl(item.mockup_url);
    }
    if (item.product.image_url) {
      return this.getFullImageUrl(item.product.image_url);
    }
    // Return a data URI for a simple placeholder to avoid external requests and infinite loops
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    // Prevent infinite loop by checking if already set to data URI
    if (!img.src.startsWith('data:')) {
      img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
    }
  }

  onQuantityChange(item: CartItem, newQuantity: number): void {
    if (newQuantity < item.product.min_quantity) {
      newQuantity = item.product.min_quantity;
    }

    if (newQuantity === item.quantity) {
      return;
    }

    this.updatingItems.add(item.id);
    this.cartService.updateItem(item.id, newQuantity).subscribe({
      next: () => {
        this.updatingItems.delete(item.id);
      },
      error: (err) => {
        console.error('Error updating item quantity:', err);
        this.updatingItems.delete(item.id);
        // Reload cart to get correct state
        this.loadCart();
      }
    });
  }

  onQuantityDecrease(item: CartItem): void {
    if (item.quantity > item.product.min_quantity) {
      this.onQuantityChange(item, item.quantity - 1);
    }
  }

  onQuantityIncrease(item: CartItem): void {
    this.onQuantityChange(item, item.quantity + 1);
  }

  onRemoveItem(item: CartItem): void {
    if (confirm('Tem certeza que deseja remover este item do carrinho?')) {
      this.removingItems.add(item.id);
      this.cartService.removeItem(item.id).subscribe({
        next: () => {
          this.removingItems.delete(item.id);
        },
        error: (err) => {
          console.error('Error removing item:', err);
          this.removingItems.delete(item.id);
          // Reload cart to get correct state
          this.loadCart();
        }
      });
    }
  }

  onCheckout(): void {
    // Close cart popup and navigate to checkout page
    this.closePopup();
    this.router.navigate(['/checkout']);
  }

  onContinueShopping(): void {
    this.closePopup();
  }

  closePopup(): void {
    this.close.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    // Close if clicking on the backdrop (not the panel itself)
    if ((event.target as HTMLElement).classList.contains('cart-popup-backdrop')) {
      this.closePopup();
    }
  }
}

