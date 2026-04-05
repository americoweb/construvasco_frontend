import { Component, ViewEncapsulation, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';
import { HomeService, AISuggestionsResponse, Product, Suggestion, Category, Testimonial } from './home.service';
import { CartService } from '../../../core/services/cart.service';
import { ConfigService } from '../../../core/services/config.service';
import { LandingHeaderComponent } from '../../../shared/components/layout/landing-header/landing-header.component';
import { LandingFooterComponent } from '../../../shared/components/layout/landing-footer/landing-footer.component';

declare var YT: any;

@Component({
    selector: 'landing-home',
    templateUrl: './home.component.html',
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        LandingHeaderComponent,
        LandingFooterComponent
    ],
})
export class LandingHomeComponent implements OnInit, AfterViewInit, OnDestroy {
    goal = '';
    budget = '';
    customGoal = '';
    customBudget = '';
    showCustomGoal = false;
    showCustomBudget = false;
    logoFile: File | null = null;
    logoPreview: string | null = null;
    suggestions: AISuggestionsResponse | null = null;
    isLoading = false;
    error: string | null = null;
    
    // Common goals
    commonGoals = [
        'Brindes para evento de empresa',
        'Promoção de produto',
        'Brinde corporativo',
        'Evento de lançamento',
        'Feira ou exposição',
        'Aniversário da empresa',
        'Campanha de marketing',
        'Presente para clientes',
        'Material para equipe',
        'Outro (especificar)'
    ];
    
    // Budget ranges
    budgetRanges = [
        { label: 'Até 5K MT', value: 5000 },
        { label: '5K - 15K MT', value: 15000 },
        { label: '15K - 50K MT', value: 50000 },
        { label: '50K+ MT', value: 100000 },
        { label: 'Valor personalizado', value: 'custom' }
    ];
    
    products: Product[] = [];
    featuredProducts: Product[] = [];
    categories: Category[] = [];
    readonly maxCategoriesToShow = 6; // Limit number of categories displayed
    testimonials: Testimonial[] = [];
    isLoadingProducts = false;
    isLoadingCategories = false;
    isLoadingTestimonials = false;
    isLoadingFeatured = false;
    currentYear = new Date().getFullYear();
    cartItemCount: number = 0;
    showAIModal = false;
    showAIAssistant = false;
    aiStep = 1;
    whatsappNumber = '258846579067'; // Default placeholder, should be configured
    portfolioImages: string[] = []; // Portfolio images for carousel
    currentSlide = 0; // Current slide index (in terms of visible groups)
    private carouselInterval: any; // Auto-play interval
    private visibleImagesCount = 4; // Number of images visible at once (default for desktop)
    failedCategoryImages = new Set<number>(); // Track categories with failed image loads
    showWhatsAppPrompt = false;
    userInteracted = false;
    selectedProduct: Product | null = null;
    showHelpMenu = false;
    private ytPlayer: any;
    private checkInterval: any;

    constructor(
        private homeService: HomeService,
        private router: Router,
        private cartService: CartService,
        private configService: ConfigService,
        private sanitizer: DomSanitizer
    ) {}

    ngOnInit(): void {
        this.loadProducts();
        this.loadFeaturedProducts();
        this.loadCategories();
        this.loadTestimonials();
        this.loadPortfolioImages();
        this.loadYouTubeAPI();
        // Subscribe to cart count
        this.cartService.getCartCount().subscribe(count => {
            this.cartItemCount = count;
        });
        
        // Track user interaction
        this.trackUserInteraction();
        
        // Show WhatsApp prompt after 30 seconds if no interaction
        setTimeout(() => {
            if (!this.userInteracted) {
                this.showWhatsAppPrompt = true;
            }
        }, 30000);
    }
    
    ngAfterViewInit(): void {
        // Wait a bit for iframe to load, then initialize player
        setTimeout(() => {
            this.initializeYouTubePlayer();
        }, 1000);
        // Update visible images count based on screen size
        this.updateVisibleImagesCount();
        window.addEventListener('resize', () => this.updateVisibleImagesCount());
    }

    ngOnDestroy(): void {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }
        if (this.carouselInterval) {
            clearInterval(this.carouselInterval);
        }
        if (this.ytPlayer) {
            try {
                this.ytPlayer.destroy();
            } catch (e) {
                console.error('Error destroying YouTube player:', e);
            }
        }
    }
    
    private trackUserInteraction(): void {
        // Track clicks, scrolls, etc.
        document.addEventListener('click', () => {
            this.userInteracted = true;
            this.showWhatsAppPrompt = false;
        }, { once: true });
        
        document.addEventListener('scroll', () => {
            this.userInteracted = true;
        }, { once: true });
    }

    private loadYouTubeAPI(): void {
        if ((window as any).YT && (window as any).YT.Player) {
            return; // API already loaded
        }

        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    private initializeYouTubePlayer(): void {
        if (typeof YT === 'undefined' || !YT.Player) {
            // Wait for API to load
            (window as any).onYouTubeIframeAPIReady = () => {
                this.createPlayer();
            };
            return;
        }

        this.createPlayer();
    }

    private createPlayer(): void {
        const container = document.getElementById('youtube-player');
        if (!container) {
            return;
        }

        try {
            this.ytPlayer = new YT.Player('youtube-player', {
                videoId: 'lgYbOKV5zI4',
                playerVars: {
                    autoplay: 1,
                    loop: 1,
                    playlist: 'lgYbOKV5zI4',
                    mute: 1,
                    controls: 0,
                    showinfo: 0,
                    rel: 0,
                    iv_load_policy: 3,
                    modestbranding: 1,
                    playsinline: 1,
                    enablejsapi: 1
                },
                events: {
                    'onReady': (event: any) => {
                        event.target.mute();
                        event.target.playVideo();
                        this.startTimeCheck();
                    },
                    'onStateChange': (event: any) => {
                        if (event.data === YT.PlayerState.PLAYING) {
                            this.startTimeCheck();
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error creating YouTube player:', error);
        }
    }

    private startTimeCheck(): void {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }

        this.checkInterval = setInterval(() => {
            if (this.ytPlayer && this.ytPlayer.getCurrentTime) {
                try {
                    const currentTime = this.ytPlayer.getCurrentTime();
                    if (currentTime >= 29) {
                        this.ytPlayer.seekTo(0, true);
                    }
                } catch (error) {
                    // Player might not be ready yet
                }
            }
        }, 500); // Check every 500ms
    }

    onGoalSelect(selectedGoal: string): void {
        if (selectedGoal === 'Outro (especificar)') {
            this.showCustomGoal = true;
            this.goal = '';
        } else {
            this.goal = selectedGoal;
            this.showCustomGoal = false;
            this.customGoal = '';
        }
    }

    onBudgetSelect(selectedBudget: number | string): void {
        if (selectedBudget === 'custom') {
            this.showCustomBudget = true;
            this.budget = '';
        } else {
            this.budget = selectedBudget.toString();
            this.showCustomBudget = false;
            this.customBudget = '';
        }
    }

    handleLogoFileChange(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (file) {
            this.logoFile = file;
            const reader = new FileReader();
            reader.onloadend = () => {
                this.logoPreview = reader.result as string;
            };
            reader.readAsDataURL(file);
        }
    }

    removeLogo(): void {
        this.logoFile = null;
        this.logoPreview = null;
    }

    async handleGetSuggestion(event: Event): Promise<void> {
        event.preventDefault();
        
        // Use custom values if shown, otherwise use selected values
        const finalGoal = this.showCustomGoal ? this.customGoal : this.goal;
        const finalBudget = this.showCustomBudget ? this.customBudget : this.budget;
        
        if (!finalGoal || !finalBudget) {
            this.error = 'Por favor, preencha o objetivo e o orçamento.';
            return;
        }
        this.isLoading = true;
        this.error = null;
        this.suggestions = null;
        
        try {
            let logoImage: { data: string; mimeType: string; } | undefined = undefined;
            if (this.logoFile) {
                const logoBase64 = await this.homeService.fileToBase64(this.logoFile);
                logoImage = { data: logoBase64, mimeType: this.logoFile.type };
            }

            const request: any = {
                goal: finalGoal,
                budget: Number(finalBudget),
                max_suggestions: 5,
                include_bundles: true
            };

            if (logoImage) {
                request.logo_base64 = logoImage.data;
                request.logo_mime_type = logoImage.mimeType;
            }

            this.homeService.getAISuggestions(request).subscribe({
                next: (response) => {
                    this.suggestions = response;
                    this.isLoading = false;
                },
                error: (err) => {
                    this.error = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.';
                    this.isLoading = false;
                }
            });
        } catch (err) {
            this.error = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.';
            this.isLoading = false;
        }
    }

    clearSuggestion(): void {
        this.suggestions = null;
        this.error = null;
        this.goal = '';
        this.budget = '';
        this.customGoal = '';
        this.customBudget = '';
        this.showCustomGoal = false;
        this.showCustomBudget = false;
        this.logoFile = null;
        this.logoPreview = null;
    }

    handleCustomizeSuggestedProduct(product: any): void {
        if (!product.product_id && !product.productRef) {
            console.error("Missing product reference for suggestion", product);
            this.error = "Não foi possível carregar os detalhes deste produto sugerido.";
            return;
        }
        // Navigate to product page using product_id or find product by name
        const productId = product.product_id || product.productRef;
        if (productId) {
            // Find the product in our list to get the slug
            const foundProduct = this.products.find(p => p.id === productId);
            if (foundProduct && foundProduct.slug) {
                // Pass mockup data via navigation state (like MVP does)
                this.router.navigate(['/products', foundProduct.slug], {
                    state: {
                        fromSuggestion: true,
                        mockupUrl: product.mockup_url,
                        designPrompt: product.design_prompt,
                        suggestedProduct: product
                    }
                });
            } else {
                // Fallback: try to navigate with product name as slug (may need adjustment)
                this.router.navigate(['/products', product.name.toLowerCase().replace(/\s+/g, '-')], {
                    state: {
                        fromSuggestion: true,
                        mockupUrl: product.mockup_url,
                        designPrompt: product.design_prompt,
                        suggestedProduct: product
                    }
                });
            }
        }
    }

    onSelectProduct(product: Product): void {
        this.selectedProduct = product;
        if (product.slug) {
            this.router.navigate(['/products', product.slug]);
        } else {
            console.error('Product missing slug:', product);
        }
    }

    scrollToStart(): void {
        // Scroll to categories section
        const element = document.querySelector('.max-w-7xl.mx-auto.px-4.py-12');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    navigateToProducts(): void {
        this.router.navigate(['/produtos']);
    }

    private loadProducts(): void {
        this.isLoadingProducts = true;
        this.homeService.getActiveProducts().subscribe({
            next: (response) => {
                this.products = response.data || [];
                this.isLoadingProducts = false;
            },
            error: (error) => {
                console.error('Error loading products:', error);
                this.isLoadingProducts = false;
            }
        });
    }

    private loadFeaturedProducts(): void {
        this.isLoadingFeatured = true;
        this.homeService.getFeaturedProducts().subscribe({
            next: (response) => {
                const allFeatured = response.data || [];
                // Limit to 6 products
                this.featuredProducts = allFeatured.slice(0, 6);
                this.isLoadingFeatured = false;
            },
            error: (error) => {
                console.error('Error loading featured products:', error);
                // Fallback: use first 6 products from all products
                if (this.products.length > 0) {
                    this.featuredProducts = this.products.filter(p => p.is_featured).slice(0, 6);
                    if (this.featuredProducts.length === 0) {
                        this.featuredProducts = this.products.slice(0, 6);
                    }
                }
                this.isLoadingFeatured = false;
            }
        });
    }

    private loadCategories(): void {
        this.isLoadingCategories = true;
        this.homeService.getCategories().subscribe({
            next: (response) => {
                const allCategories = response.data || [];
                // Limit to maxCategoriesToShow and filter active categories
                this.categories = allCategories
                    .filter(c => c.is_active)
                    .slice(0, this.maxCategoriesToShow);
                // If no categories from API, use hardcoded fallback
                if (this.categories.length === 0) {
                    this.categories = this.getDefaultCategories().slice(0, this.maxCategoriesToShow);
                }
                this.isLoadingCategories = false;
            },
            error: (error) => {
                console.error('Error loading categories:', error);
                // Use hardcoded fallback categories, limited
                this.categories = this.getDefaultCategories().slice(0, this.maxCategoriesToShow);
                this.isLoadingCategories = false;
            }
        });
    }

    private loadTestimonials(): void {
        this.isLoadingTestimonials = true;
        this.homeService.getTestimonials().subscribe({
            next: (response) => {
                const allTestimonials = response.data || [];
                // Filter active testimonials with required fields and limit to 6
                this.testimonials = allTestimonials
                    .filter(t => t.is_active && t.client_name && t.comment)
                    .slice(0, 6);
                // If no testimonials, use sample data
                if (this.testimonials.length === 0) {
                    this.testimonials = this.getSampleTestimonials();
                }
                this.isLoadingTestimonials = false;
            },
            error: (error) => {
                console.error('Error loading testimonials:', error);
                // Use sample testimonials as fallback
                this.testimonials = this.getSampleTestimonials();
                this.isLoadingTestimonials = false;
            }
        });
    }

    private loadPortfolioImages(): void {
        // Load testimonial images from public folder
        // Add more images by duplicating or adding more image files
        const imageCount = 11; // We have images 1.jpg through 5.jpg
        this.portfolioImages = [];
        
        // Load existing images
        for (let i = 1; i <= imageCount; i++) {
            this.portfolioImages.push(`/images/testimonial/${i}.jpg`);
        }
        
        // Duplicate images to create a longer carousel (optional - remove if you add more actual images)
        // This creates a seamless loop effect
        const duplicateCount = Math.max(0, 8 - imageCount);
        for (let i = 1; i <= duplicateCount && i <= imageCount; i++) {
            this.portfolioImages.push(`/images/testimonial/${i}.jpg`);
        }
        
        // Start auto-play carousel if we have images
        if (this.portfolioImages.length > this.visibleImagesCount) {
            this.startCarouselAutoPlay();
        }
    }

    /**
     * Start auto-play carousel
     */
    private startCarouselAutoPlay(): void {
        // Auto-advance every 5 seconds
        this.carouselInterval = setInterval(() => {
            this.nextSlide();
        }, 5000);
    }

    /**
     * Get number of visible images based on screen size
     */
    getVisibleImagesCount(): number {
        return this.visibleImagesCount;
    }

    /**
     * Update visible images count based on screen size
     */
    private updateVisibleImagesCount(): void {
        if (typeof window !== 'undefined') {
            const width = window.innerWidth;
            if (width < 768) {
                this.visibleImagesCount = 2; // Mobile: 2 images
            } else if (width < 1024) {
                this.visibleImagesCount = 3; // Tablet: 3 images
            } else {
                this.visibleImagesCount = 4; // Desktop: 4 images
            }
        }
    }

    /**
     * Get maximum slide index
     */
    private getMaxSlideIndex(): number {
        if (this.portfolioImages.length === 0) return 0;
        const maxIndex = Math.max(0, this.portfolioImages.length - this.visibleImagesCount);
        return maxIndex;
    }

    /**
     * Navigate to next slide
     */
    nextSlide(): void {
        if (this.portfolioImages.length === 0) return;
        const maxIndex = this.getMaxSlideIndex();
        this.currentSlide = this.currentSlide >= maxIndex ? 0 : this.currentSlide + 1;
        this.resetCarouselAutoPlay();
    }

    /**
     * Navigate to previous slide
     */
    previousSlide(): void {
        if (this.portfolioImages.length === 0) return;
        const maxIndex = this.getMaxSlideIndex();
        this.currentSlide = this.currentSlide === 0 ? maxIndex : this.currentSlide - 1;
        this.resetCarouselAutoPlay();
    }

    /**
     * Go to specific slide
     */
    goToSlide(index: number): void {
        if (index >= 0 && index < this.portfolioImages.length) {
            const maxIndex = this.getMaxSlideIndex();
            this.currentSlide = Math.min(index, maxIndex);
            this.resetCarouselAutoPlay();
        }
    }

    /**
     * Reset auto-play timer
     */
    private resetCarouselAutoPlay(): void {
        if (this.carouselInterval) {
            clearInterval(this.carouselInterval);
        }
        if (this.portfolioImages.length > 1) {
            this.startCarouselAutoPlay();
        }
    }

    private getDefaultCategories(): Category[] {
        return [
            { id: 1, name: 'Cartões de Visita', slug: 'cartoes-visita', is_active: true, icon: '📇' },
            { id: 2, name: 'Flyers & Folhetos', slug: 'flyers-folhetos', is_active: true, icon: '📄' },
            { id: 3, name: 'Banners & Sinalização', slug: 'banners-sinalizacao', is_active: true, icon: '🎪' },
            { id: 4, name: 'Brochuras', slug: 'brochuras', is_active: true, icon: '📘' },
            { id: 5, name: 'Calendários', slug: 'calendarios', is_active: true, icon: '📅' },
            { id: 6, name: 'Brindes Corporativos', slug: 'brindes-corporativos', is_active: true, icon: '🎁' }
        ];
    }

    private getSampleTestimonials(): Testimonial[] {
        return [
            {
                id: 1,
                client_name: 'João Silva',
                client_position: 'CEO',
                client_company: 'TechMoz',
                rating: 5,
                comment: 'Entrega rápida e qualidade excelente. Recomendo!',
                is_active: true
            },
            {
                id: 2,
                client_name: 'Maria Santos',
                client_position: 'Diretora de Marketing',
                client_company: 'Eventos MZ',
                rating: 5,
                comment: 'Entregaram em 2 dias, perfeito para nosso evento!',
                is_active: true
            },
            {
                id: 3,
                client_name: 'Carlos Mendes',
                client_position: 'Gerente',
                client_company: 'Comércio Local',
                rating: 5,
                comment: 'Preços justos e trabalho profissional. Já fizemos 5 pedidos, sempre impecável!',
                is_active: true
            }
        ];
    }

    openAIModal(): void {
        this.showAIModal = true;
        // Scroll to AI section if it exists
        setTimeout(() => {
            const element = document.getElementById('ai-suggestion-section');
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);
    }

    closeAIModal(): void {
        this.showAIModal = false;
    }
    
    openAIAssistant(): void {
        this.showAIAssistant = true;
        this.aiStep = 1;
        this.userInteracted = true;
        this.showHelpMenu = false;
    }
    
    closeAIAssistant(): void {
        this.showAIAssistant = false;
        this.aiStep = 1;
    }
    
    toggleHelpMenu(): void {
        this.showHelpMenu = !this.showHelpMenu;
    }
    
    nextAIStep(): void {
        if (this.aiStep < 4) {
            this.aiStep++;
        } else {
            // Submit form
            const event = new Event('submit');
            this.handleGetSuggestion(event);
        }
    }
    
    previousAIStep(): void {
        if (this.aiStep > 1) {
            this.aiStep--;
        }
    }
    
    selectQuickGoal(goal: any): void {
        this.goal = goal.value;
        if (goal.showInput) {
            this.showCustomGoal = true;
            this.customGoal = '';
        } else {
            this.showCustomGoal = false;
            this.nextAIStep();
        }
    }
    
    selectBudget(budget: any): void {
        this.budget = budget.value.toString();
        this.showCustomBudget = false;
        this.nextAIStep();
    }
    
    skipLogo(): void {
        this.logoFile = null;
        this.logoPreview = null;
        this.nextAIStep();
    }
    
    uploadLogo(): void {
        // Trigger file input
        const input = document.getElementById('logo-upload');
        if (input) {
            input.click();
        }
    }

    navigateToCategory(category: Category): void {
        // Navigate to category page or filter products
        if (category.slug) {
            this.router.navigate(['/produtos', category.slug]);
        }
    }

    openWhatsApp(context: string = 'help'): void {
        const messages: { [key: string]: string } = {
            hero: 'Olá! Vi o site e gostaria de fazer um pedido.',
            product: this.selectedProduct 
                ? `Olá! Gostaria de saber mais sobre ${this.selectedProduct.name}`
                : 'Olá! Gostaria de saber mais sobre um produto',
            cart: `Olá! Tenho ${this.cartItemCount} itens no carrinho e gostaria de finalizar o pedido`,
            help: 'Olá! Preciso de ajuda para escolher um produto',
            custom: 'Olá! Gostaria de fazer um pedido personalizado',
            quote: 'Olá! Gostaria de receber um orçamento',
            urgent: 'Olá! Preciso de entrega urgente',
            notFound: 'Olá! Não encontrei o produto que preciso',
            human: 'Olá! Prefiro falar com alguém sobre meu pedido'
        };
        
        const message = encodeURIComponent(messages[context] || messages.help);
        const url = `https://wa.me/${this.whatsappNumber}?text=${message}`;
        window.open(url, '_blank');
        this.userInteracted = true;
        this.showWhatsAppPrompt = false;
    }
    
    getWhatsAppLink(context: string = 'help'): string {
        const messages: { [key: string]: string } = {
            hero: 'Olá! Vi o site e gostaria de fazer um pedido.',
            product: this.selectedProduct 
                ? `Olá! Gostaria de saber mais sobre ${this.selectedProduct.name}`
                : 'Olá! Gostaria de saber mais sobre um produto',
            cart: `Olá! Tenho ${this.cartItemCount} itens no carrinho e gostaria de finalizar o pedido`,
            help: 'Olá! Preciso de ajuda para escolher um produto',
            custom: 'Olá! Gostaria de fazer um pedido personalizado',
            quote: 'Olá! Gostaria de receber um orçamento',
            urgent: 'Olá! Preciso de entrega urgente',
            notFound: 'Olá! Não encontrei o produto que preciso',
            human: 'Olá! Prefiro falar com alguém sobre meu pedido'
        };
        
        const message = encodeURIComponent(messages[context] || messages.help);
        return `https://wa.me/${this.whatsappNumber}?text=${message}`;
    }
    
    quickGoals = [
        { icon: '🎉', label: 'Evento', value: 'Organizar um evento corporativo' },
        { icon: '🏢', label: 'Escritório', value: 'Material para escritório' },
        { icon: '🎁', label: 'Clientes', value: 'Brindes para clientes' },
        { icon: '📢', label: 'Marketing', value: 'Campanha de marketing' },
        { icon: '🎊', label: 'Abertura', value: 'Abertura de negócio' },
        { icon: '💼', label: 'Outro', value: 'custom', showInput: true }
    ];
    
    simpleBudgets = [
        { 
            icon: '🌱', 
            label: 'Económico', 
            range: '500 - 5,000 MT',
            value: 2500,
            description: 'Perfeito para começar'
        },
        { 
            icon: '🚀', 
            label: 'Médio', 
            range: '5,000 - 20,000 MT',
            value: 12500,
            description: 'Mais vendido'
        },
        { 
            icon: '⭐', 
            label: 'Premium', 
            range: '20,000 - 100,000 MT',
            value: 50000,
            description: 'Impacto máximo'
        }
    ];

    getCategoryIcon(category: Category): string {
        if (category.icon) return category.icon;
        // Default icons based on category name
        const iconMap: { [key: string]: string } = {
            'cartões': '📇',
            'flyers': '📄',
            'banners': '🎪',
            'brochuras': '📘',
            'calendários': '📅',
            'brindes': '🎁'
        };
        const nameLower = category.name.toLowerCase();
        for (const key in iconMap) {
            if (nameLower.includes(key)) {
                return iconMap[key];
            }
        }
        return '📦';
    }
    
    getCategoryIconSVG(category: Category): string {
        const nameLower = category.name.toLowerCase();
        
        // Business Cards
        if (nameLower.includes('cartão') || nameLower.includes('visita')) {
            return `<svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2m-6-4h.01M12 16h.01M16 20h4M4 20h4m-4-4h4m8 0h4"/>
            </svg>`;
        }
        
        // Flyers & Leaflets
        if (nameLower.includes('flyer') || nameLower.includes('folheto')) {
            return `<svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>`;
        }
        
        // Banners & Signage
        if (nameLower.includes('banner') || nameLower.includes('sinalização')) {
            return `<svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"/>
            </svg>`;
        }
        
        // Brochures
        if (nameLower.includes('brochura')) {
            return `<svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
            </svg>`;
        }
        
        // Calendars
        if (nameLower.includes('calendário')) {
            return `<svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>`;
        }
        
        // Corporate Gifts
        if (nameLower.includes('brinde') || nameLower.includes('presente')) {
            return `<svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"/>
            </svg>`;
        }
        
        // Default icon
        return `<svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
        </svg>`;
    }

    getCategoryPrice(category: Category): string {
        // Default prices for categories (can be enhanced with actual data)
        const priceMap: { [key: string]: string } = {
            'cartões': '600 MT',
            'flyers': '800 MT',
            'banners': '1500 MT',
            'brochuras': '1200 MT',
            'calendários': '2000 MT',
            'brindes': '1000 MT'
        };
        const nameLower = category.name.toLowerCase();
        for (const key in priceMap) {
            if (nameLower.includes(key)) {
                return priceMap[key];
            }
        }
        return 'A partir de 600 MT';
    }

    /**
     * Get category image URL
     * Handles both relative paths from backend and full URLs
     */
    getCategoryImageUrl(imageUrl: string | null | undefined): string {
        if (!imageUrl) {
            return '';
        }
        
        // If it's already a full URL (http/https), return as is
        if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
            return imageUrl;
        }
        
        // If it's a relative path, use ConfigService to get the full URL
        // Remove leading slash if present
        const cleanPath = imageUrl.startsWith('/') ? imageUrl.slice(1) : imageUrl;
        return this.configService.getFileUrl(cleanPath);
    }

    /**
     * Handle category image load error
     */
    onCategoryImageError(categoryId: number): void {
        this.failedCategoryImages.add(categoryId);
    }

    /**
     * Check if category image failed to load
     */
    hasCategoryImageFailed(categoryId: number): boolean {
        return this.failedCategoryImages.has(categoryId);
    }
}
