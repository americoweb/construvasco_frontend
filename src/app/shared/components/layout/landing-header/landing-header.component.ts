import { Component, Input, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../../../core/services/cart.service';
import { CartPopupComponent } from '../cart-popup/cart-popup.component';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { AuthModalService } from '../../auth/auth-modal.service';
import { UserProfileDropdownComponent } from '../user-profile-dropdown/user-profile-dropdown.component';
import { LoginModalComponent } from '../../auth/login-modal/login-modal.component';
import { RegisterModalComponent } from '../../auth/register-modal/register-modal.component';
import { Subscription, takeUntil, Subject } from 'rxjs';
import { NavigationEnd } from '@angular/router';

@Component({
    selector: 'app-landing-header',
    templateUrl: './landing-header.component.html',
    styleUrls: ['./landing-header.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        RouterLink,
        FormsModule,
        CartPopupComponent,
        UserProfileDropdownComponent,
        LoginModalComponent,
        RegisterModalComponent
    ]
})
export class LandingHeaderComponent implements OnInit, OnDestroy {
    @Input() cartItemCount: number = 0;
    @Input() orderHistoryCount: number = 0;

    navItemClasses = "text-slate-600 hover:text-slate-900 transition-colors font-semibold text-xs tracking-[0.14em] uppercase";
    isHeaderLoading = true;
    isScrolled = false;
    currentUrl = '';
    isCartOpen = false;
    isAuthenticated = false;
    currentModal: 'login' | 'register' | null = null;
    isMobileMenuOpen = false;
    
    // Search
    searchQuery = '';
    mobileSearchQuery = '';
    
    // Phone and WhatsApp configuration
    phoneNumber = '+258846579067';
    whatsappNumber = '258846579067';
    
    private cartSubscription?: Subscription;
    private authSubscription?: Subscription;
    private modalSubscription?: Subscription;
    private _unsubscribeAll = new Subject<void>();
    private headerLoadingTimeout?: ReturnType<typeof setTimeout>;
    private scrollHandler?: () => void;

    constructor(
        private cartService: CartService,
        private authService: AuthService,
        private authModalService: AuthModalService,
        private router: Router,
        private cdr: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        this.currentUrl = this.router.url || '';

        this.headerLoadingTimeout = setTimeout(() => {
            this.isHeaderLoading = false;
            this.cdr.markForCheck();
        }, 700);

        // Subscribe to cart count if not provided as input
        if (this.cartItemCount === 0) {
            this.cartSubscription = this.cartService.getCartCount()
                .pipe(takeUntil(this._unsubscribeAll))
                .subscribe(count => {
                    this.cartItemCount = count;
                    this.cdr.markForCheck();
                });
        }

        // Subscribe to authentication state
        this.authSubscription = this.authService.authenticated$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(isAuth => {
                this.isAuthenticated = isAuth;
                this.cdr.markForCheck();
            });

        // Subscribe to modal state
        this.modalSubscription = this.authModalService.currentModal$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(modal => {
                this.currentModal = modal;
                this.toggleBodyScrollLock(!!modal);
                this.cdr.markForCheck();
            });

        this.scrollHandler = () => {
            const nextScrolled = window.scrollY > 24;
            if (nextScrolled !== this.isScrolled) {
                this.isScrolled = nextScrolled;
                this.cdr.markForCheck();
            }
        };
        window.addEventListener('scroll', this.scrollHandler, { passive: true });
        this.scrollHandler();

        this.router.events
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((event) => {
                if (event instanceof NavigationEnd) {
                    this.currentUrl = event.urlAfterRedirects || event.url || '';
                    this.cdr.markForCheck();
                }
            });
    }

    get useSolidHeader(): boolean {
        return this.isScrolled || !this.isHomeRoute();
    }

    private isHomeRoute(): boolean {
        const path = (this.currentUrl || '').split('?')[0];
        return path === '/' || path === '';
    }

    ngOnDestroy(): void {
        if (this.headerLoadingTimeout) {
            clearTimeout(this.headerLoadingTimeout);
        }
        if (this.scrollHandler) {
            window.removeEventListener('scroll', this.scrollHandler);
        }
        this.toggleBodyScrollLock(false);
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    private toggleBodyScrollLock(lock: boolean): void {
        if (typeof document === 'undefined') return;
        document.body.style.overflow = lock ? 'hidden' : '';
    }

    openCart(): void {
        this.isCartOpen = true;
    }

    closeCart(): void {
        this.isCartOpen = false;
    }

    openLogin(): void {
        this.authModalService.openLogin();
    }

    openRegister(): void {
        this.authModalService.openRegister();
    }

    closeModal(): void {
        this.authModalService.close();
    }

    switchToRegister(): void {
        this.authModalService.openRegister();
    }

    switchToLogin(): void {
        this.authModalService.openLogin();
    }

    toggleMobileMenu(): void {
        this.isMobileMenuOpen = !this.isMobileMenuOpen;
    }

    callPhone(): void {
        window.location.href = `tel:${this.phoneNumber}`;
    }

    openWhatsApp(context: string = 'help'): void {
        const messages: { [key: string]: string } = {
            help: 'Olá! Preciso de ajuda',
            product: 'Olá! Gostaria de saber mais sobre um produto',
            cart: `Olá! Tenho ${this.cartItemCount} itens no carrinho e gostaria de finalizar o pedido`
        };
        
        const message = encodeURIComponent(messages[context] || messages.help);
        const url = `https://wa.me/${this.whatsappNumber}?text=${message}`;
        window.open(url, '_blank');
    }

    onSearch(event?: KeyboardEvent): void {
        if (event && event.key !== 'Enter') {
            return;
        }
        const query = this.searchQuery.trim();
        if (query) {
            this.router.navigate(['/produtos'], {
                queryParams: { busca: query } 
            });
        }
    }

    onMobileSearch(event?: KeyboardEvent): void {
        if (event && event.key !== 'Enter') {
            return;
        }
        const query = this.mobileSearchQuery.trim();
        if (query) {
            this.router.navigate(['/produtos'], {
                queryParams: { busca: query } 
            });
            this.toggleMobileMenu(); // Close mobile menu after search
        }
    }

    goToRoute(path: string): void {
        this.router.navigate([path]);
        this.isMobileMenuOpen = false;
    }
}

