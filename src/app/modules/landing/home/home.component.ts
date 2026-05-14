import { Component, ViewEncapsulation, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HomeService, AISuggestionsResponse, Product, Suggestion, Category, Testimonial } from './home.service';
import { CartService } from '../../../core/services/cart.service';
import { ConfigService } from '../../../core/services/config.service';
import { LandingHeaderComponent } from '../../../shared/components/layout/landing-header/landing-header.component';
import { LandingFooterComponent } from '../../../shared/components/layout/landing-footer/landing-footer.component';
import { FuseSplashScreenService } from '@fuse/services/splash-screen';
import { FuseLoadingService } from '@fuse/services/loading';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatExpansionModule } from '@angular/material/expansion';

@Component({
    selector: 'landing-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatButtonModule,
        MatCardModule,
        MatIconModule,
        MatFormFieldModule,
        MatSelectModule,
        MatInputModule,
        MatExpansionModule,
        LandingHeaderComponent,
        LandingFooterComponent
    ],
})
export class LandingHomeComponent implements OnInit, AfterViewInit, OnDestroy {
    heroBackgroundImage = 'https://images.pexels.com/photos/323705/pexels-photo-323705.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1280&dpr=1';
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
    
    // Common goals for project briefing assistant
    commonGoals = [
        'Construir casa de raiz',
        'Remodelar casa existente',
        'Projeto para residência T2/T3',
        'Projeto com piscina e área de lazer',
        'Projeto de moradia em terreno inclinado',
        'Regularização de projeto e licenciamento',
        'Outro (especificar)'
    ];
    
    // Budget ranges
    budgetRanges = [
        { label: 'Até 500 mil MT', value: 500000 },
        { label: '500 mil - 1.5M MT', value: 1500000 },
        { label: '1.5M - 5M MT', value: 5000000 },
        { label: '5M+ MT', value: 10000000 },
        { label: 'Valor personalizado', value: 'custom' }
    ];
    /** Editorial cards; `productSlug` matches seeded catalog (`ConstructionProjectSeeder`). */
    projectTypes: { id: number; name: string; image: string; area: string; productSlug: string }[] = [
        { id: 1, name: 'Casa T2 Compacta', image: 'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?auto=format&fit=crop&w=1200&q=80', area: '90-130m2', productSlug: 'casa-t2-compacta' },
        { id: 2, name: 'Casa T3 Familiar', image: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80', area: '130-190m2', productSlug: 'casa-t3-familiar' },
        { id: 3, name: 'Casa T4 Premium', image: 'https://images.unsplash.com/photo-1600607687644-c7171b42498f?auto=format&fit=crop&w=1200&q=80', area: '190-280m2', productSlug: 'casa-t4-premium' },
        { id: 4, name: 'Moradia Duplex', image: 'https://images.unsplash.com/photo-1600210492493-0946911123ea?auto=format&fit=crop&w=1200&q=80', area: '160-250m2', productSlug: 'moradia-duplex-moderna' },
        { id: 5, name: 'Remodelacao Interior', image: 'https://images.unsplash.com/photo-1616137466211-f939a420be84?auto=format&fit=crop&w=1200&q=80', area: 'Sob avaliacao', productSlug: 'remodelacao-integral-casa' },
        { id: 6, name: 'Casa em Terreno Inclinado', image: 'https://images.unsplash.com/photo-1575517111478-7f6afd0973db?auto=format&fit=crop&w=1200&q=80', area: '120-220m2', productSlug: 'moradia-geminada' },
        { id: 7, name: 'Casa com Piscina', image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80', area: '180-300m2', productSlug: 'condominio-fechado-residencial' },
        { id: 8, name: 'Projeto Comercial Leve', image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80', area: '100-250m2', productSlug: 'loja-rua-premium' },
        { id: 9, name: 'Anexo e Expansao', image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=80', area: '40-120m2', productSlug: 'ampliacao-de-moradia' }
    ];
    whyChooseUs = [
        { title: 'Rede Tecnica Validada', description: 'Arquitetos e engenheiros com experiencia em normas locais e licenciamento.' },
        { title: 'Briefing Inteligente', description: 'Convertemos requisitos tecnicos em proposta clara para acelerar decisoes.' },
        { title: 'Acompanhamento Transparente', description: 'Depois do checkout, atualizacoes e briefing no WhatsApp; com login, o mesmo fluxo fica visivel na sua area.' },
        { title: 'Compatibilizacao Inicial', description: 'Identificamos conflitos entre arquitetura, estrutura e instalacoes mais cedo.' },
        { title: 'Orientacao de Orcamento', description: 'Solucoes tecnicas priorizadas pelo seu teto financeiro e cronograma.' },
        { title: 'Suporte no WhatsApp', description: 'Apos o pagamento, e o canal principal para briefing, confirmacoes e fecho do projeto.' }
    ];
    faqItems = [
        { question: 'Quanto tempo leva para receber a proposta inicial?', answer: 'Normalmente enviamos um direcionamento inicial em ate 48 horas apos receber o briefing completo.', isOpen: false },
        { question: 'Posso enviar apenas fotos e medidas aproximadas?', answer: 'Sim. Quanto mais detalhe enviar, melhor. Tambem podemos começar com dados basicos e refinar em seguida.', isOpen: false },
        { question: 'Vocês trabalham com projetos novos e remodelacao?', answer: 'Sim. Atendemos tanto casas de raiz quanto remodelacoes, anexos e ampliacoes.', isOpen: false },
        { question: 'Como funciona o pagamento?', answer: 'No checkout escolhe M-Pesa, Emola ou comprovativo. Quando o pagamento estiver validado, a equipa continua consigo no WhatsApp com o briefing e os proximos passos.', isOpen: false },
        { question: 'O WhatsApp e obrigatorio?', answer: 'Sim, no checkout indicamos o numero onde quer ser contactado. E o canal principal apos o pagamento: confirmacoes, perguntas tecnicas e acompanhamento ate a obra pronta.', isOpen: false },
        { question: 'Preciso de conta para encomendar?', answer: 'Nao. Pode escolher o projeto, pagar como visitante e seguir tudo no WhatsApp. Criar conta e opcional para quem quiser ver o processo tambem na area do cliente.', isOpen: false }
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
    whatsappNumber = '258846579067'; // Default placeholder, should be configured
    featuredCurrentSlide = 0;
    private featuredVisibleCount = 3;
    failedCategoryImages = new Set<number>(); // Track categories with failed image loads
    selectedProduct: Product | null = null;

    /** Placeholder slots for category / product / testimonial skeleton rows */
    readonly sectionSkeletonSlots = [0, 1, 2, 3, 4, 5];

    constructor(
        private homeService: HomeService,
        private router: Router,
        private cartService: CartService,
        private configService: ConfigService,
        private fuseSplashScreen: FuseSplashScreenService,
        private fuseLoading: FuseLoadingService
    ) {}

    ngOnInit(): void {
        this.fuseSplashScreen.hide();
        this.fuseLoading.setAutoMode(false);
        this.loadProducts();
        this.loadFeaturedProducts();
        this.loadCategories();
        this.loadTestimonials();
        // Subscribe to cart count
        this.cartService.getCartCount().subscribe(count => {
            this.cartItemCount = count;
        });
    }
    
    ngAfterViewInit(): void {
        // Update visible images count based on screen size
        this.updateVisibleImagesCount();
        window.addEventListener('resize', () => this.updateVisibleImagesCount());
    }

    ngOnDestroy(): void {
        this.fuseLoading.setAutoMode(true);
    }
    
    onGoalSelect(selectedGoal: string): void {
        this.error = null;
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
        this.error = null;
        if (selectedBudget === 'custom') {
            this.showCustomBudget = true;
            this.budget = '';
        } else {
            this.budget = selectedBudget.toString();
            this.showCustomBudget = false;
            this.customBudget = '';
        }
    }

    onCustomBudgetChange(): void {
        this.error = null;
    }

    isBudgetRangeSelected(range: { label: string; value: number | string }): boolean {
        if (range.value === 'custom') {
            return this.showCustomBudget;
        }
        return !this.showCustomBudget && this.budget === String(range.value);
    }

    get budgetSelectionSummary(): string {
        if (this.showCustomBudget) {
            return this.customBudget
                ? `Orçamento: ${this.customBudget} MT (personalizado)`
                : 'Valor personalizado — digite o montante em MT.';
        }
        if (!this.budget) {
            return '';
        }
        const r = this.budgetRanges.find((x) => String(x.value) === this.budget);
        return r ? `Selecionado: ${r.label}` : '';
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

        const finalGoal = (this.showCustomGoal ? this.customGoal : this.goal)?.trim() ?? '';
        const finalBudgetRaw = this.showCustomBudget ? this.customBudget : this.budget;

        if (!finalGoal) {
            this.error = 'Por favor, escolha ou descreva o objetivo do projeto.';
            return;
        }
        if (
            finalBudgetRaw === '' ||
            finalBudgetRaw === null ||
            finalBudgetRaw === undefined
        ) {
            this.error = 'Por favor, selecione um intervalo de orçamento ou indique um valor em MT.';
            return;
        }
        const budgetNum = Number(finalBudgetRaw);
        if (!Number.isFinite(budgetNum) || budgetNum <= 0) {
            this.error = 'Indique um orçamento válido (número maior que zero).';
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
                budget: budgetNum,
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
                    this.error = this.getFriendlyAiError(err);
                    this.isLoading = false;
                }
            });
        } catch (err) {
            this.error = this.getFriendlyAiError(err);
            this.isLoading = false;
        }
    }

    private getFriendlyAiError(err: unknown): string {
        const fallback = 'Não conseguimos gerar sugestões agora. Tente novamente em alguns segundos ou avance via WhatsApp.';

        if (!err) return fallback;

        const maybeAny = err as any;
        const backendMessage = maybeAny?.error?.message;
        const topMessage = maybeAny?.message;
        const rawMessage = backendMessage || topMessage;

        if (!rawMessage || typeof rawMessage !== 'string') {
            return fallback;
        }

        const message = rawMessage.toLowerCase();
        if (message.includes('network') || message.includes('failed to fetch') || message.includes('timeout')) {
            return 'Estamos com instabilidade de conexão. Verifique a internet e tente novamente.';
        }
        if (message.includes('429') || message.includes('rate')) {
            return 'Recebemos muitos pedidos ao mesmo tempo. Aguarde alguns segundos e tente de novo.';
        }
        if (message.includes('401') || message.includes('403')) {
            return 'Seu acesso para este recurso expirou. Atualize a página e tente novamente.';
        }

        return rawMessage;
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
            this.error = "Não foi possível carregar os detalhes deste projeto sugerido.";
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
        const element = document.getElementById('start-projects');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    navigateToProducts(): void {
        this.router.navigate(['/produtos']);
    }

    openProjectType(projectRef: number | string): void {
        const selectedProject = typeof projectRef === 'number'
            ? this.projectTypes.find((project) => project.id === projectRef)
            : this.projectTypes.find((project) => project.name === projectRef);

        const slug = selectedProject?.productSlug;
        if (slug) {
            this.router.navigate(['/products', slug]);
            return;
        }

        const projectName = selectedProject?.name ?? String(projectRef);
        this.router.navigate(['/produtos'], { queryParams: { busca: projectName } });
    }

    toggleFaq(index: number): void {
        this.faqItems[index].isOpen = !this.faqItems[index].isOpen;
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

    getFeaturedVisibleCount(): number {
        return this.featuredVisibleCount;
    }

    /**
     * Update visible images count based on screen size
     */
    private updateVisibleImagesCount(): void {
        if (typeof window !== 'undefined') {
            const width = window.innerWidth;
            if (width < 768) {
                this.featuredVisibleCount = 1;
            } else if (width < 1024) {
                this.featuredVisibleCount = 2;
            } else {
                this.featuredVisibleCount = 3;
            }

            this.featuredCurrentSlide = Math.min(this.featuredCurrentSlide, this.getFeaturedMaxIndex());
        }
    }

    private getFeaturedMaxIndex(): number {
        const total = this.projectTypes.slice(0, 6).length;
        return Math.max(0, total - this.featuredVisibleCount);
    }

    nextFeaturedSlide(): void {
        const maxIndex = this.getFeaturedMaxIndex();
        this.featuredCurrentSlide = this.featuredCurrentSlide >= maxIndex ? 0 : this.featuredCurrentSlide + 1;
    }

    previousFeaturedSlide(): void {
        const maxIndex = this.getFeaturedMaxIndex();
        this.featuredCurrentSlide = this.featuredCurrentSlide === 0 ? maxIndex : this.featuredCurrentSlide - 1;
    }

    goToFeaturedSlide(index: number): void {
        const maxIndex = this.getFeaturedMaxIndex();
        if (index >= 0 && index <= maxIndex) {
            this.featuredCurrentSlide = index;
        }
    }

    private getDefaultCategories(): Category[] {
        return [
            { id: 1, name: 'Residências', slug: 'residencias', is_active: true, icon: '🏠' },
            { id: 2, name: 'Remodelações', slug: 'remodelacoes', is_active: true, icon: '🛠️' },
            { id: 3, name: 'Projetos Comerciais', slug: 'projetos-comerciais', is_active: true, icon: '🏢' },
            { id: 4, name: 'Piscina e Lazer', slug: 'piscina-lazer', is_active: true, icon: '🏊' },
            { id: 5, name: 'Anexos e Expansão', slug: 'anexos-expansao', is_active: true, icon: '📐' },
            { id: 6, name: 'Legalização e Licenças', slug: 'legalizacao-licencas', is_active: true, icon: '📋' }
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

    navigateToCategory(category: Category): void {
        // Navigate to category page or filter products
        if (category.slug) {
            this.router.navigate(['/produtos', category.slug]);
        }
    }

    openWhatsApp(context: string = 'help'): void {
        const messages: { [key: string]: string } = {
            hero: 'Olá! Vi o site e gostaria de iniciar um projeto.',
            product: this.selectedProduct 
                ? `Olá! Gostaria de saber mais sobre ${this.selectedProduct.name}`
                : 'Olá! Gostaria de saber mais sobre um projeto',
            cart: `Olá! Tenho ${this.cartItemCount} itens no carrinho e gostaria de finalizar o pedido`,
            help: 'Olá! Preciso de ajuda para escolher um projeto',
            custom: 'Olá! Gostaria de fazer um projeto personalizado',
            quote: 'Olá! Gostaria de receber um orçamento',
            urgent: 'Olá! Preciso de entrega urgente',
            notFound: 'Olá! Não encontrei o tipo de projeto que preciso',
            human: 'Olá! Prefiro falar com alguém sobre meu projeto'
        };
        
        const message = encodeURIComponent(messages[context] || messages.help);
        const url = `https://wa.me/${this.whatsappNumber}?text=${message}`;
        window.open(url, '_blank');
        // no-op state updates removed from legacy prompt flow
    }
    
    getWhatsAppLink(context: string = 'help'): string {
        const messages: { [key: string]: string } = {
            hero: 'Olá! Vi o site e gostaria de iniciar um projeto.',
            product: this.selectedProduct 
                ? `Olá! Gostaria de saber mais sobre ${this.selectedProduct.name}`
                : 'Olá! Gostaria de saber mais sobre um projeto',
            cart: `Olá! Tenho ${this.cartItemCount} itens no carrinho e gostaria de finalizar o pedido`,
            help: 'Olá! Preciso de ajuda para escolher um projeto',
            custom: 'Olá! Gostaria de fazer um projeto personalizado',
            quote: 'Olá! Gostaria de receber um orçamento',
            urgent: 'Olá! Preciso de entrega urgente',
            notFound: 'Olá! Não encontrei o tipo de projeto que preciso',
            human: 'Olá! Prefiro falar com alguém sobre meu projeto'
        };
        
        const message = encodeURIComponent(messages[context] || messages.help);
        return `https://wa.me/${this.whatsappNumber}?text=${message}`;
    }
    
    getCategoryIcon(category: Category): string {
        if (category.icon) return category.icon;
        // Default icons based on category name
        const iconMap: { [key: string]: string } = {
            'resid': '🏠',
            'remodel': '🛠️',
            'comercial': '🏢',
            'piscina': '🏊',
            'anexo': '📐',
            'licen': '📋'
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
            'resid': 'A partir de 350.000 MT',
            'remodel': 'A partir de 120.000 MT',
            'comercial': 'A partir de 500.000 MT',
            'piscina': 'A partir de 180.000 MT',
            'anexo': 'A partir de 90.000 MT',
            'licen': 'Sob consulta'
        };
        const nameLower = category.name.toLowerCase();
        for (const key in priceMap) {
            if (nameLower.includes(key)) {
                return priceMap[key];
            }
        }
        return 'Sob avaliação técnica';
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
