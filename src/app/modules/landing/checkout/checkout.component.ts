import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription, Subject } from 'rxjs';
import { switchMap, catchError, finalize, takeUntil } from 'rxjs/operators';
import { of, Observable } from 'rxjs';
import { CartService, Cart } from '../../../core/services/cart.service';
import { CheckoutService, ProcessCheckoutRequest, CheckoutResult } from '../../../core/services/checkout.service';
import { PaymentService } from '../../../core/services/payment.service';
import { ConfigService } from '../../../core/services/config.service';
import { ApiResponse } from '../../../core/models/api.types';
import { LandingHeaderComponent } from '../../../shared/components/layout/landing-header/landing-header.component';
import { NotificationService } from '../../../shared/components/feedback/notification.service';
import { AuthService } from '../../../core/auth/services/auth.service';
import { UserService } from '../../../core/auth/services/user.service';
import { AuthModalService } from '../../../shared/components/auth/auth-modal.service';
import { User } from '../../../core/auth/models/user.interface';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-checkout-page',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LandingHeaderComponent,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatRadioModule,
    MatSelectModule
  ]
})
export class CheckoutPageComponent implements OnInit, OnDestroy {
  @ViewChild('fileInput') fileInput: ElementRef;
  
  cart: Cart | null = null;
  checkoutForm: FormGroup;
  paymentForm: FormGroup;
  isProcessing = false;
  isProcessingPayment = false;
  currentStep: 'form' | 'payment' | 'success' = 'form';
  orderResult: CheckoutResult | null = null;
  error: string | null = null;
  cartItemCount: number = 0;
  isAuthenticated = false;
  user: User | null = null;
  showLoginPrompt = false;
  userAddresses: any[] = [];
  
  // Payment method selection
  selectedPaymentMethod: 'mpesa' | 'emola' | 'proofUpload' = 'mpesa';
  
  // File upload related properties
  selectedFile: File | null = null;
  selectedFileName: string | null = null;
  isFileValid: boolean = false;
  fileError: string | null = null;
  maxFileSize: number = 10 * 1024 * 1024; // 10MB in bytes
  
  private cartSubscription?: Subscription;
  private _unsubscribeAll = new Subject<void>();

  constructor(
    private cartService: CartService,
    private checkoutService: CheckoutService,
    private paymentService: PaymentService,
    private configService: ConfigService,
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private notificationService: NotificationService,
    private authService: AuthService,
    private userService: UserService,
    private authModalService: AuthModalService
  ) {
    this.checkoutForm = this.fb.group({
      shipping_name: ['', [Validators.required, Validators.maxLength(255)]],
      shipping_address: ['', [Validators.required, Validators.maxLength(500)]],
      shipping_city: ['Maputo', [Validators.maxLength(100)]],
      shipping_state: ['Maputo', [Validators.maxLength(100)]],
      shipping_postal_code: ['', [Validators.maxLength(20)]],
      shipping_country: ['Moçambique', [Validators.maxLength(100)]],
      shipping_phone: ['', [Validators.maxLength(20)]],
      shipping_whatsapp: ['', [Validators.required, Validators.pattern(/^(84|85|86|87)[0-9]{7}$/)]],
      billing_name: [''],
      billing_email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
      notes: ['', [Validators.maxLength(1000)]]
    });

    // Payment form
    this.paymentForm = this.fb.group({
      paymentMethod: ['mpesa', Validators.required],
      phoneNumber: ['', [
        Validators.pattern(/^(84|85|86|87)\d{7}$/),
        this.validatePhoneNumberByMethod.bind(this)
      ]],
      reference: [''],
      transferDate: [''],
      notes: ['']
    });

    // Set billing_name to shipping_name by default
    this.checkoutForm.get('shipping_name')?.valueChanges.subscribe(name => {
      if (!this.checkoutForm.get('billing_name')?.value) {
        this.checkoutForm.patchValue({ billing_name: name }, { emitEvent: false });
      }
    });

    // Apply conditional validation based on payment method
    this.paymentForm.get('paymentMethod')?.valueChanges.subscribe(method => {
      this.selectedPaymentMethod = method;
      this.fileError = null;
      this.error = null;
      
      if (method === 'mpesa' || method === 'emola') {
        this.paymentForm.get('phoneNumber')?.setValidators([
          Validators.required,
          Validators.pattern(/^(84|85|86|87)\d{7}$/),
          this.validatePhoneNumberByMethod.bind(this)
        ]);
        this.removeFile();
      } else {
        // For proof upload, phone is not required
        this.paymentForm.get('phoneNumber')?.clearValidators();
        this.paymentForm.get('phoneNumber')?.updateValueAndValidity();
        
        // Set validators for proof upload fields
        this.paymentForm.get('reference')?.setValidators([Validators.required]);
        this.paymentForm.get('transferDate')?.setValidators([Validators.required]);
      }
      
      this.paymentForm.get('phoneNumber')?.updateValueAndValidity();
      this.paymentForm.get('reference')?.updateValueAndValidity();
      this.paymentForm.get('transferDate')?.updateValueAndValidity();
    });
  }

  ngOnInit(): void {
    // Subscribe to authentication state
    this.authService.authenticated$
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(isAuth => {
        this.isAuthenticated = isAuth;
        if (isAuth) {
          this.loadUserData();
        } else {
          this.user = null;
        }
      });

    // Subscribe to user data
    this.userService.user$
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(user => {
        this.user = user;
        if (user && this.isAuthenticated) {
          // Check if addresses are in user settings
          if (user.settings?.addresses && Array.isArray(user.settings.addresses)) {
            this.userAddresses = user.settings.addresses;
          }
          
          // Use setTimeout to avoid change detection loop
          setTimeout(() => {
            this.prefillFormFromUser();
            // Prefill address if addresses are available
            if (this.userAddresses.length > 0) {
              this.prefillAddressFromSaved();
            }
          }, 0);
        }
      });

    // Subscribe to cart changes
    this.cartSubscription = this.cartService.cart$
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(cart => {
        this.cart = cart;
        if (!cart || cart.is_empty) {
          // Redirect to home if cart is empty
          this.router.navigate(['/']);
        }
      });

    // Subscribe to cart count
    this.cartService.getCartCount()
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(count => {
        this.cartItemCount = count;
        // Show login prompt if cart has items and user is not authenticated
        if (count > 0 && !this.isAuthenticated) {
          this.showLoginPrompt = true;
        }
      });

    // Load cart
    this.loadCart();
  }

  loadUserData(): void {
    if (this.isAuthenticated) {
      this.userService.getCurrentUser()
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe();
      
      // Load user addresses
      this.loadUserAddresses();
    }
  }

  loadUserAddresses(): void {
    if (this.isAuthenticated) {
      // First check if addresses are already in user.settings
      if (this.user?.settings?.addresses && Array.isArray(this.user.settings.addresses)) {
        this.userAddresses = this.user.settings.addresses;
        if (this.userAddresses.length > 0) {
          this.prefillAddressFromSaved();
        }
        return;
      }
      
      // Otherwise, load from API
      this.userService.getAddresses()
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe({
          next: (addresses) => {
            this.userAddresses = addresses || [];
            // Prefill address if available
            if (this.userAddresses.length > 0) {
              this.prefillAddressFromSaved();
            }
          },
          error: (error) => {
            console.error('Failed to load addresses:', error);
            this.userAddresses = [];
          }
        });
    }
  }

  prefillFormFromUser(): void {
    if (this.user && this.isAuthenticated && this.checkoutForm) {
      // Only patch if values are different to avoid infinite loops
      const currentName = this.checkoutForm.get('shipping_name')?.value;
      const currentEmail = this.checkoutForm.get('billing_email')?.value;
      
      if (currentName !== (this.user.name || '') || currentEmail !== (this.user.email || this.user.identifier || '')) {
        this.checkoutForm.patchValue({
          shipping_name: this.user.name || '',
          billing_name: this.user.name || '',
          billing_email: this.user.email || this.user.identifier || '',
          shipping_phone: this.user.phone || '',
          shipping_whatsapp: this.user.whatsapp || this.user.phone || ''
        }, { emitEvent: false }); // Don't emit events to avoid triggering subscriptions
      }
    }
  }

  prefillAddressFromSaved(): void {
    if (!this.checkoutForm) {
      console.log('Checkout form not ready yet');
      return;
    }

    if (this.userAddresses.length === 0) {
      console.log('No addresses available to prefill');
      return;
    }

    // Find primary address or use first address
    const primaryAddress = this.userAddresses.find(addr => addr.is_primary) || this.userAddresses[0];
    
    if (primaryAddress) {
      console.log('Prefilling address from saved:', primaryAddress);
      
      // Always prefill - user can edit if needed
      this.checkoutForm.patchValue({
        shipping_address: primaryAddress.address || '',
        shipping_city: primaryAddress.city || '',
        shipping_state: primaryAddress.province || 'Maputo'
      }, { emitEvent: false });
    }
  }

  openLogin(): void {
    this.authModalService.openLogin();
  }

  dismissLoginPrompt(): void {
    this.showLoginPrompt = false;
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
    if (this.cartSubscription) {
      this.cartSubscription.unsubscribe();
    }
  }

  loadCart(): void {
    this.cartService.getCart()
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe({
        next: () => {},
        error: () => {
          // Redirect to home if cart can't be loaded
          this.router.navigate(['/']);
        }
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

    // Just move to payment step - don't process checkout yet
    // Checkout will be processed when user clicks the payment button
    this.error = null;
    this.currentStep = 'payment';
  }

  processPayment(): void {
    // Validate payment form
    if (this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      this.error = 'Por favor, preencha todos os campos de pagamento corretamente.';
      return;
    }

    // For proof upload, validate file
    if (this.selectedPaymentMethod === 'proofUpload' && !this.isFileValid) {
      this.fileError = 'Por favor, selecione um comprovativo de pagamento válido.';
      this.error = 'Por favor, selecione um comprovativo de pagamento válido.';
      return;
    }

    if (!this.cart || this.cart.is_empty) {
      this.error = 'O carrinho está vazio.';
      return;
    }

    // If order doesn't exist yet, process checkout first
    if (!this.orderResult) {
      this.processCheckoutAndPayment();
    } else {
      // Order already exists, just process payment
      this.isProcessingPayment = true;
      this.error = null;
      this.fileError = null;

      const formValues = this.paymentForm.value;
      
      // Handle based on payment method
      if (this.selectedPaymentMethod === 'proofUpload') {
        this.processProofUpload();
      } else {
        this.processMobilePayment();
      }
    }
  }

  processCheckoutAndPayment(): void {
    this.isProcessingPayment = true;
    this.error = null;
    this.fileError = null;

    const formValues = this.paymentForm.value;
    
    // For proof upload, we can create order first since payment is reviewed later
    if (this.selectedPaymentMethod === 'proofUpload') {
      this.processCheckoutThenProofUpload();
      return;
    }

    // For M-Pesa/Emola: Process payment FIRST, then create order only if payment succeeds
    const formData = this.checkoutForm.value;
    
    // Ensure phone number includes +258 prefix for backend
    let phoneNumber = formValues.phoneNumber;
    if (phoneNumber && !phoneNumber.startsWith('+258')) {
      phoneNumber = phoneNumber.replace(/^\+?258/, '');
      phoneNumber = '+258' + phoneNumber;
    }
    
    // Get amount from cart
    const amount = this.cart?.subtotal || 0;
    
    // Show notification IMMEDIATELY when user clicks payment button (before API call)
    const paymentMethodName = this.selectedPaymentMethod === 'mpesa' ? 'M-Pesa' : 'eMola';
    this.notificationService.warning(
      `A processar pagamento... Por favor, verifique o seu telefone e insira o PIN ${paymentMethodName} quando solicitado.`,
      'Pagamento Iniciado',
      {
        duration: 10000, // Show for 10 seconds
        dismissible: true
      }
    );
    
    const paymentData = {
      amount: amount,
      phone: phoneNumber,
      reference: `CART_${this.cart!.uuid}` // Use cart reference until order is created
    };

    const paymentObservable = this.selectedPaymentMethod === 'mpesa' 
      ? this.paymentService.payWithMpesa(paymentData)
      : this.paymentService.payWithEmola(paymentData);

    // Process payment first
    paymentObservable.pipe(
      switchMap(paymentResponse => {
        // Check if STK Push was successfully initiated
        // The payment gateway returns success when STK Push is sent to user's phone
        // User still needs to enter PIN on their phone to complete payment
        const hasErrors = paymentResponse?.errors && paymentResponse.errors.length > 0;
        const isStkPushSent = paymentResponse?.success === true || 
                              (paymentResponse?.success !== false && !hasErrors);
        
        if (!isStkPushSent) {
          const errorMessage = paymentResponse?.message || 
                              paymentResponse?.errors?.[0]?.message || 
                              paymentResponse?.data?.message ||
                              'Falha ao enviar solicitação de pagamento. Por favor, tente novamente.';
          throw new Error(errorMessage);
        }

        // Note: For M-Pesa/Emola, we create the order immediately after STK Push is sent
        // The actual payment confirmation happens via webhook/callback from payment gateway
        // User should check their phone and enter PIN
        
        // Create order after STK Push is sent (payment will be confirmed via webhook)
        return this.createOrderAfterPayment(paymentResponse);
      }),
      catchError(error => {
        // Payment failed - don't create order
        this.isProcessingPayment = false;
        
        // Handle timeout errors gracefully
        const errorMessage = error.error?.message || error.message || '';
        if (errorMessage.includes('timeout') || errorMessage.includes('demorou muito') || error.status === 504) {
          this.error = errorMessage || 'O gateway de pagamento demorou muito para responder. Por favor, verifique o seu telefone - o pagamento pode ter sido processado.';
          this.notificationService.warning(
            'O pagamento pode ter sido processado. Por favor, verifique o seu telefone para confirmação. Se não recebeu nenhuma notificação, tente novamente.',
            'Timeout no Pagamento',
            { duration: 15000 }
          );
        } else {
          this.error = errorMessage || 'Erro ao processar pagamento. Por favor, tente novamente.';
          this.notificationService.error(
            this.error,
            'Erro no Pagamento',
            { duration: 0 } // Persistent error
          );
        }
        
        console.error('Payment error:', error);
        return of(null);
      }),
      finalize(() => {
        // Finalize is called after success or error
      })
    ).subscribe({
      next: (orderResponse) => {
        if (orderResponse) {
          this.orderResult = orderResponse.data;
          this.currentStep = 'success';
          // Reload cart to clear it
          setTimeout(() => {
            this.cartService.getCart().subscribe();
          }, 1000);
        }
      }
    });
  }

  processCheckoutThenProofUpload(): void {
    const formData = this.checkoutForm.value;
    
    // Ensure WhatsApp number includes +258 prefix for backend
    let whatsappNumber = formData.shipping_whatsapp;
    if (whatsappNumber && !whatsappNumber.startsWith('+258')) {
      whatsappNumber = whatsappNumber.replace(/^\+?258/, '');
      whatsappNumber = '+258' + whatsappNumber;
    }
    
    const checkoutData: ProcessCheckoutRequest = {
      cart_uuid: this.cart!.uuid,
      shipping_name: formData.shipping_name,
      shipping_address: formData.shipping_address,
      shipping_city: formData.shipping_city || 'Maputo',
      shipping_state: formData.shipping_state || 'Maputo',
      shipping_postal_code: formData.shipping_postal_code?.trim() || undefined,
      shipping_country: formData.shipping_country || 'Moçambique',
      shipping_phone: formData.shipping_phone?.trim() || undefined,
      shipping_whatsapp: whatsappNumber,
      billing_name: formData.billing_name || formData.shipping_name,
      billing_email: formData.billing_email,
      notes: formData.notes?.trim() || undefined,
      payment_method: 'proof_upload', // Payment proof uploads wait for confirmation
      payment_reference: this.paymentForm.value.reference || undefined
    };

    // For proof upload, create order first, then upload proof
    this.checkoutService.processCheckout(checkoutData).subscribe({
      next: (response) => {
        this.orderResult = response.data;
        // Now process proof upload
        this.processProofUpload();
      },
      error: (err) => {
        this.isProcessingPayment = false;
        this.error = err.error?.message || 'Erro ao processar checkout. Por favor, tente novamente.';
        console.error('Checkout error:', err);
      }
    });
  }

  createOrderAfterPayment(paymentResponse: any): Observable<ApiResponse<CheckoutResult>> {
    const formData = this.checkoutForm.value;
    const paymentFormValues = this.paymentForm.value;
    
    // Ensure WhatsApp number includes +258 prefix for backend
    let whatsappNumber = formData.shipping_whatsapp;
    if (whatsappNumber && !whatsappNumber.startsWith('+258')) {
      whatsappNumber = whatsappNumber.replace(/^\+?258/, '');
      whatsappNumber = '+258' + whatsappNumber;
    }
    
    // Map frontend payment method to backend format
    const paymentMethod = paymentFormValues.paymentMethod === 'mpesa' ? 'mpesa' 
                        : paymentFormValues.paymentMethod === 'emola' ? 'emola' 
                        : 'proof_upload';
    
    const checkoutData: ProcessCheckoutRequest = {
      cart_uuid: this.cart!.uuid,
      shipping_name: formData.shipping_name,
      shipping_address: formData.shipping_address,
      shipping_city: formData.shipping_city || 'Maputo',
      shipping_state: formData.shipping_state || 'Maputo',
      shipping_postal_code: formData.shipping_postal_code?.trim() || undefined,
      shipping_country: formData.shipping_country || 'Moçambique',
      shipping_phone: formData.shipping_phone?.trim() || undefined,
      shipping_whatsapp: whatsappNumber,
      billing_name: formData.billing_name || formData.shipping_name,
      billing_email: formData.billing_email,
      notes: formData.notes?.trim() || undefined,
      payment_method: paymentMethod,
      payment_reference: paymentResponse?.data?.payment_reference || paymentResponse?.data?.reference || `CART_${this.cart!.uuid}`,
      payment_transaction_id: paymentResponse?.data?.transaction_id || paymentResponse?.data?.id || null
    };

    return this.checkoutService.processCheckout(checkoutData);
  }

  processMobilePayment(): void {
    if (!this.orderResult) return;

    const formValues = this.paymentForm.value;
    // Ensure phone number includes +258 prefix for backend
    let phoneNumber = formValues.phoneNumber;
    if (phoneNumber && !phoneNumber.startsWith('+258')) {
      // If user typed with +258, remove it first, then add it back
      phoneNumber = phoneNumber.replace(/^\+?258/, '');
      phoneNumber = '+258' + phoneNumber;
    }
    
    // Show notification IMMEDIATELY when user clicks payment button (before API call)
    const paymentMethodName = this.selectedPaymentMethod === 'mpesa' ? 'M-Pesa' : 'eMola';
    this.notificationService.warning(
      `A processar pagamento... Por favor, verifique o seu telefone e insira o PIN ${paymentMethodName} quando solicitado.`,
      'Pagamento Iniciado',
      {
        duration: 10000, // Show for 10 seconds
        dismissible: true
      }
    );
    
    const paymentData = {
      amount: this.orderResult.total_amount,
      phone: phoneNumber,
      reference: `ORDER_${this.orderResult.order_number}`
    };

    const paymentObservable = this.selectedPaymentMethod === 'mpesa' 
      ? this.paymentService.payWithMpesa(paymentData)
      : this.paymentService.payWithEmola(paymentData);

    paymentObservable.pipe(
      switchMap(response => {
        // Handle successful payment response
        this.currentStep = 'success';
        // Reload cart to clear it
        setTimeout(() => {
          this.cartService.getCart().subscribe();
        }, 1000);
        return of(response);
      }),
      catchError(error => {
        // Handle payment error
        this.error = error.error?.message || 'Erro ao processar pagamento. Por favor, tente novamente.';
        console.error('Payment error:', error);
        return of(null);
      }),
      finalize(() => {
        this.isProcessingPayment = false;
      })
    ).subscribe();
  }

  processProofUpload(): void {
    if (!this.orderResult || !this.selectedFile) {
      this.isProcessingPayment = false;
      this.fileError = 'Por favor, selecione um ficheiro.';
      this.error = 'Por favor, selecione um ficheiro.';
      return;
    }

    const formValues = this.paymentForm.value;
    
    // Create form data for file upload
    const formData = new FormData();
    formData.append('payment_proof', this.selectedFile);
    formData.append('amount', this.orderResult.total_amount.toString());
    formData.append('reference', formValues.reference || `ORDER_${this.orderResult.order_number}`);
    formData.append('transfer_date', formValues.transferDate ? new Date(formValues.transferDate).toISOString() : '');
    formData.append('notes', formValues.notes || '');
    
    this.paymentService.payWithProofUpload(formData).pipe(
      switchMap(response => {
        // Handle successful upload
        this.currentStep = 'success';
        // Reload cart to clear it
        setTimeout(() => {
          this.cartService.getCart().subscribe();
        }, 1000);
        return of(response);
      }),
      catchError(error => {
        // Handle payment error
        this.error = error.error?.message || 'Erro ao enviar o comprovativo. Por favor, tente novamente.';
        console.error('Payment proof upload error:', error);
        return of(null);
      }),
      finalize(() => {
        this.isProcessingPayment = false;
      })
    ).subscribe();
  }

  // Custom validator to check phone number prefix based on payment method
  validatePhoneNumberByMethod(control: any): { [key: string]: any } | null {
    if (!control.value) {
      return null;
    }

    const phoneNumber = control.value;
    const paymentMethod = this.paymentForm?.get('paymentMethod')?.value;

    if (paymentMethod === 'mpesa' && !phoneNumber.match(/^(84|85)\d+$/)) {
      return { invalidMpesaNumber: true };
    }

    if (paymentMethod === 'emola' && !phoneNumber.match(/^(86|87)\d+$/)) {
      return { invalidEmolaNumber: true };
    }

    return null;
  }

  getPhoneErrorMessage(): string {
    const phoneControl = this.paymentForm.get('phoneNumber');
    if (!phoneControl) return '';
    
    if (phoneControl.hasError('required')) {
      return 'Número de telefone é obrigatório';
    }
    
    if (phoneControl.hasError('pattern')) {
      return 'Formato inválido. Deve começar com 84, 85, 86 ou 87 seguido de 7 dígitos';
    }
    
    if (phoneControl.hasError('invalidMpesaNumber')) {
      return 'Para Mpesa, o número deve começar com 84 ou 85';
    }
    
    if (phoneControl.hasError('invalidEmolaNumber')) {
      return 'Para Emola, o número deve começar com 86 ou 87';
    }
    
    return '';
  }

  // File upload handling methods
  onFileSelected(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    
    if (inputElement.files && inputElement.files.length) {
      const file = inputElement.files[0];
      this.selectedFile = file;
      this.selectedFileName = file.name;
      
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        this.fileError = 'Formato inválido. Apenas JPG, PNG e PDF são aceites.';
        this.isFileValid = false;
        return;
      }
      
      // Validate file size
      if (file.size > this.maxFileSize) {
        this.fileError = 'O tamanho do ficheiro excede 10MB.';
        this.isFileValid = false;
        return;
      }
      
      // Reset error if file is valid
      this.fileError = null;
      this.isFileValid = true;
    }
  }

  removeFile(): void {
    this.selectedFile = null;
    this.selectedFileName = null;
    this.isFileValid = false;
    this.fileError = null;
    
    // Reset file input element
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  onBackToHome(): void {
    this.router.navigate(['/']);
  }

  formatWhatsApp(value: string): void {
    // Remove all non-digits
    let digits = value.replace(/\D/g, '');
    
    // Remove +258 prefix if present to normalize
    if (digits.startsWith('258')) {
      digits = digits.substring(3);
    }
    
    // Remove leading 0 if present
    if (digits.startsWith('0')) {
      digits = digits.substring(1);
    }
    
    // Limit to 9 digits (84/85/86/87 + 7 digits)
    if (digits.length > 9) {
      digits = digits.substring(0, 9);
    }
    
    // Store only the 9 digits, we'll add +258 when sending to backend
    this.checkoutForm.patchValue({ shipping_whatsapp: digits }, { emitEvent: false });
  }

  formatPaymentPhone(value: string): void {
    // Remove all non-digits
    let digits = value.replace(/\D/g, '');
    
    // Remove +258 prefix if present to normalize
    if (digits.startsWith('258')) {
      digits = digits.substring(3);
    }
    
    // Remove leading 0 if present
    if (digits.startsWith('0')) {
      digits = digits.substring(1);
    }
    
    // Limit to 9 digits (84/85/86/87 + 7 digits)
    if (digits.length > 9) {
      digits = digits.substring(0, 9);
    }
    
    // Format: 84XXXXXXX or 85XXXXXXX (for M-Pesa) or 86XXXXXXX or 87XXXXXXX (for Emola)
    // Don't add +258 prefix, just show the 9 digits
    this.paymentForm.patchValue({ phoneNumber: digits }, { emitEvent: false });
  }

  getPhonePlaceholder(): string {
    if (this.selectedPaymentMethod === 'mpesa') {
      return '84XXXXXXX ou 85XXXXXXX';
    } else if (this.selectedPaymentMethod === 'emola') {
      return '86XXXXXXX ou 87XXXXXXX';
    }
    return '84XXXXXXX ou 85XXXXXXX';
  }

  getPhoneHelperText(): string {
    if (this.selectedPaymentMethod === 'mpesa') {
      return 'Digite o número M-Pesa (ex: 841234567 ou 851234567)';
    } else if (this.selectedPaymentMethod === 'emola') {
      return 'Digite o número Emola (ex: 861234567 ou 871234567)';
    }
    return 'Digite o número de telefone';
  }

  /**
   * Opens a chat with the business line and pre-fills the order reference (same number as landing footer).
   */
  getPostPaymentWhatsAppHref(): string {
    const orderNo = this.orderResult?.order_number ?? '';
    const msg = encodeURIComponent(
      `Olá, equipa Construvasco. Concluí o pagamento do pedido ${orderNo}. Podem confirmar e indicar o próximo passo?`
    );
    const businessLine = '258846579067';
    return `https://wa.me/${businessLine}?text=${msg}`;
  }
}

