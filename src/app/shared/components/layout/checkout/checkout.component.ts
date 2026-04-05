import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CartService, Cart } from '../../../../core/services/cart.service';
import { CheckoutService, ProcessCheckoutRequest, CheckoutResult } from '../../../../core/services/checkout.service';
import { ConfigService } from '../../../../core/services/config.service';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class CheckoutComponent implements OnInit, OnDestroy {
  @Input() isOpen: boolean = false;
  @Output() close = new EventEmitter<void>();
  @Output() orderCompleted = new EventEmitter<CheckoutResult>();

  cart: Cart | null = null;
  checkoutForm: FormGroup;
  isProcessing = false;
  isProcessingPayment = false;
  currentStep: 'form' | 'payment' | 'success' = 'form';
  orderResult: CheckoutResult | null = null;
  error: string | null = null;
  private cartSubscription?: Subscription;

  constructor(
    private cartService: CartService,
    private checkoutService: CheckoutService,
    private configService: ConfigService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.checkoutForm = this.fb.group({
      shipping_name: ['', [Validators.required, Validators.maxLength(255)]],
      shipping_address: ['', [Validators.required, Validators.maxLength(500)]],
      shipping_city: ['Maputo', [Validators.maxLength(100)]],
      shipping_state: ['Maputo', [Validators.maxLength(100)]],
      shipping_postal_code: ['', [Validators.maxLength(20)]],
      shipping_country: ['Moçambique', [Validators.maxLength(100)]],
      shipping_phone: ['', [Validators.maxLength(20)]],
      shipping_whatsapp: ['', [Validators.required, Validators.pattern(/^\+258[0-9]{9}$/)]],
      billing_name: [''],
      billing_email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
      notes: ['', [Validators.maxLength(1000)]]
    });

    // Set billing_name to shipping_name by default
    this.checkoutForm.get('shipping_name')?.valueChanges.subscribe(name => {
      if (!this.checkoutForm.get('billing_name')?.value) {
        this.checkoutForm.patchValue({ billing_name: name }, { emitEvent: false });
      }
    });
  }

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
    this.cartService.getCart().subscribe({
      next: () => {},
      error: () => {}
    });
  }

  getFullImageUrl(path: string | null): string {
    if (!path) {
      return 'https://via.placeholder.com/150x150?text=No+Image';
    }
    
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    
    return this.configService.getFileUrl(path);
  }

  getItemImage(item: any): string {
    if (item.mockup_url) {
      return this.getFullImageUrl(item.mockup_url);
    }
    if (item.product?.image_url) {
      return this.getFullImageUrl(item.product.image_url);
    }
    return 'https://via.placeholder.com/150x150?text=No+Image';
  }

  onContinue(): void {
    if (this.checkoutForm.invalid) {
      this.checkoutForm.markAllAsTouched();
      this.error = 'Por favor, preencha todos os campos obrigatórios corretamente.';
      return;
    }

    if (!this.cart || this.cart.is_empty) {
      this.error = 'O carrinho está vazio.';
      return;
    }

    this.error = null;
    this.isProcessing = true;

    const formData = this.checkoutForm.value;
    const checkoutData: ProcessCheckoutRequest = {
      cart_uuid: this.cart.uuid,
      shipping_name: formData.shipping_name,
      shipping_address: formData.shipping_address,
      shipping_city: formData.shipping_city || 'Maputo',
      shipping_state: formData.shipping_state || 'Maputo',
      shipping_country: formData.shipping_country || 'Moçambique',
      shipping_whatsapp: formData.shipping_whatsapp,
      billing_name: formData.billing_name || formData.shipping_name,
      billing_email: formData.billing_email,
      notes: formData.notes?.trim() || undefined
    };

    const postalCode = formData.shipping_postal_code?.toString().trim();
    if (postalCode) {
      checkoutData.shipping_postal_code = postalCode;
    }

    const phone = formData.shipping_phone?.toString().trim();
    if (phone) {
      checkoutData.shipping_phone = phone;
    }

    this.checkoutService.processCheckout(checkoutData).subscribe({
      next: (response) => {
        this.isProcessing = false;
        this.orderResult = response.data;
        this.currentStep = 'payment';
        this.processPayment();
      },
      error: (err) => {
        this.isProcessing = false;
        this.error = err.error?.message || 'Erro ao processar checkout. Por favor, tente novamente.';
        console.error('Checkout error:', err);
      }
    });
  }

  processPayment(): void {
    if (!this.orderResult) return;

    this.isProcessingPayment = true;
    this.error = null;

    // Simulate M-Pesa payment
    this.checkoutService.simulateMpesaPayment(this.orderResult.order_id, this.orderResult.total_amount).subscribe({
      next: (response) => {
        this.isProcessingPayment = false;
        this.currentStep = 'success';
        this.orderCompleted.emit(this.orderResult!);
        
        // Reload cart to clear it
        setTimeout(() => {
          this.cartService.getCart().subscribe();
        }, 1000);
      },
      error: (err) => {
        this.isProcessingPayment = false;
        this.error = 'Erro ao processar pagamento. Por favor, tente novamente.';
        console.error('Payment error:', err);
      }
    });
  }

  onClose(): void {
    if (this.currentStep === 'success') {
      // Navigate to home after successful checkout
      this.router.navigate(['/']);
    }
    this.close.emit();
    // Reset form and state
    this.currentStep = 'form';
    this.orderResult = null;
    this.error = null;
    this.checkoutForm.reset();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('checkout-backdrop')) {
      if (this.currentStep === 'success') {
        this.onClose();
      } else if (!this.isProcessing && !this.isProcessingPayment) {
        this.onClose();
      }
    }
  }

  formatWhatsApp(value: string): void {
    // Auto-format WhatsApp number
    let formatted = value.replace(/\D/g, '');
    if (formatted.startsWith('258')) {
      formatted = '+' + formatted;
    } else if (formatted.startsWith('0')) {
      formatted = '+258' + formatted.substring(1);
    } else if (formatted.length > 0 && !formatted.startsWith('258')) {
      formatted = '+258' + formatted;
    }
    this.checkoutForm.patchValue({ shipping_whatsapp: formatted }, { emitEvent: false });
  }
}

