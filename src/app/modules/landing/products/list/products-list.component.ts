import { Component, OnInit, OnDestroy, ChangeDetectorRef, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { ProductsService } from '../shared/products.service';
import { 
  ProductListItem, 
  ProductFilters, 
  FilterState, 
  FilterConfig,
  CategoryFilter,
  PriceRangeFilter,
  LeadTimeFilter,
  FeatureFilter,
  ViewMode,
  ProductsQueryParams
} from '../shared/products.types';
import { 
  DEFAULT_ITEMS_PER_PAGE, 
  DEFAULT_PAGE, 
  DEFAULT_SORT,
  ITEMS_PER_PAGE_OPTIONS,
  SORT_OPTIONS,
  FILTER_CONFIG_TEMPLATE,
  WHATSAPP_NUMBER,
  WHATSAPP_MESSAGE
} from '../shared/products.constants';
import { Category } from '../../../admin/categories/shared/category.types';
import { ConfigService } from '../../../../core/services/config.service';
import { BreadcrumbComponent, BreadcrumbItem } from '../../../../shared/components/layout/breadcrumb/breadcrumb.component';
import { PaginationComponent, PaginationInfo } from '../../../../shared/components/data/pagination/pagination.component';
import { SearchBoxComponent } from '../../../../shared/components/forms/search-box/search-box.component';
import { EmptyStateComponent } from '../../../../shared/components/ui/empty-state/empty-state.component';
import { LoadingComponent } from '../../../../shared/components/ui/loading/loading.component';
import { LandingHeaderComponent } from '../../../../shared/components/layout/landing-header/landing-header.component';

@Component({
  selector: 'app-products-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    BreadcrumbComponent,
    PaginationComponent,
    SearchBoxComponent,
    EmptyStateComponent,
    LoadingComponent,
    LandingHeaderComponent
  ],
  templateUrl: './products-list.component.html',
  styleUrls: ['./products-list.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ProductsListComponent implements OnInit, OnDestroy {
  // Products data
  products: ProductListItem[] = [];
  filteredProducts: ProductListItem[] = [];
  paginatedProducts: ProductListItem[] = [];
  categories: Category[] = [];
  
  // Loading states
  isLoading = false;
  isLoadingCategories = false;
  
  // View mode
  viewMode: ViewMode = 'grid';
  
  // Sorting
  sortBy: string = DEFAULT_SORT;
  sortOptions = SORT_OPTIONS;
  
  // Pagination
  currentPage = DEFAULT_PAGE;
  itemsPerPage = DEFAULT_ITEMS_PER_PAGE;
  itemsPerPageOptions = ITEMS_PER_PAGE_OPTIONS;
  totalItems = 0;
  totalPages = 1;
  
  // Search
  searchQuery = '';
  private searchSubject = new Subject<string>();
  
  // Filters
  filterConfig: FilterConfig = {
    categories: [],
    ...FILTER_CONFIG_TEMPLATE
  };
  
  selectedCategories: string[] = [];
  selectedPriceRange: string | null = null;
  selectedLeadTimes: string[] = [];
  selectedFeatures: string[] = [];
  selectedMinimumQuantity: string | null = null;
  
  activeFilters: FilterState[] = [];
  
  // Mobile
  showMobileFilters = false;
  
  // Route params
  categorySlug: string | null = null;
  subcategorySlug: string | null = null;
  
  // Breadcrumbs
  breadcrumbItems: BreadcrumbItem[] = [];
  
  private _unsubscribeAll = new Subject<void>();
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productsService: ProductsService,
    private configService: ConfigService,
    private _changeDetectorRef: ChangeDetectorRef
  ) {
    // Setup search debounce
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this._unsubscribeAll)
      )
      .subscribe(query => {
        this.searchQuery = query;
        this.applyFilters();
      });
  }
  
  ngOnInit(): void {
    // Read route params and query params
    this.route.params.pipe(takeUntil(this._unsubscribeAll)).subscribe(params => {
      this.categorySlug = params['category'] || null;
      this.subcategorySlug = params['subcategory'] || null;
      
      // Auto-select category in filters when navigating via category link
      if (this.categorySlug && !this.selectedCategories.includes(this.categorySlug)) {
        this.selectedCategories = [this.categorySlug];
      }
      
      this.updateBreadcrumbs();
      this.loadData();
    });
    
    this.route.queryParams.pipe(takeUntil(this._unsubscribeAll)).subscribe(queryParams => {
      this.readQueryParams(queryParams);
      if (this.products.length > 0) {
        this.applyFilters();
      }
    });
    
    this.loadData();
  }
  
  ngOnDestroy(): void {
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
    this.searchSubject.complete();
  }
  
  /**
   * Load products and categories
   */
  loadData(): void {
    this.loadCategories();
    this.loadProducts();
  }
  
  /**
   * Load products from API
   */
  loadProducts(): void {
    this.isLoading = true;
    
    const queryParams: ProductsQueryParams = {
      page: this.currentPage,
      limit: this.itemsPerPage
    };
    
    if (this.categorySlug) {
      queryParams.categoria = this.categorySlug;
    }
    if (this.subcategorySlug) {
      queryParams.subcategoria = this.subcategorySlug;
    }
    if (this.searchQuery) {
      queryParams.busca = this.searchQuery;
    }
    if (this.sortBy) {
      queryParams.ordem = this.sortBy;
    }
    
    const request = this.categorySlug 
      ? this.productsService.getProductsByCategory(this.categorySlug, queryParams)
      : this.productsService.getProducts(queryParams);
    
    request.subscribe({
      next: (response) => {
        this.products = response.data || [];
        this.totalItems = this.products.length; // For client-side filtering
        this.applyFilters();
        this.isLoading = false;
        this._changeDetectorRef.markForCheck();
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.products = [];
        this.filteredProducts = [];
        this.paginatedProducts = [];
        this.isLoading = false;
        this._changeDetectorRef.markForCheck();
      }
    });
  }
  
  /**
   * Load categories from API
   */
  loadCategories(): void {
    this.isLoadingCategories = true;
    
    this.productsService.getCategories().subscribe({
      next: (response) => {
        this.categories = response.data || [];
        this.updateFilterConfig();
        this.isLoadingCategories = false;
        this._changeDetectorRef.markForCheck();
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.categories = [];
        this.isLoadingCategories = false;
        this._changeDetectorRef.markForCheck();
      }
    });
  }
  
  /**
   * Update filter config with categories
   */
  updateFilterConfig(): void {
    this.filterConfig.categories = this.categories.map(cat => ({
      id: cat.slug,
      slug: cat.slug,
      label: cat.name,
      count: cat.products_count || 0,
      selected: this.selectedCategories.includes(cat.slug) || this.categorySlug === cat.slug
    }));
    
    // Ensure category from route is selected
    if (this.categorySlug && !this.selectedCategories.includes(this.categorySlug)) {
      this.selectedCategories.push(this.categorySlug);
    }
    
    // Update counts based on current products
    this.updateFilterCounts();
  }
  
  /**
   * Update filter counts based on current products
   */
  updateFilterCounts(): void {
    // Update category counts
    this.filterConfig.categories.forEach(cat => {
      cat.count = this.products.filter(p => p.category_slug === cat.slug).length;
    });
    
    // Update price range counts
    this.filterConfig.priceRanges.forEach(range => {
      range.count = this.products.filter(p => 
        p.base_price >= range.min && p.base_price <= range.max
      ).length;
    });
    
    // Update lead time counts
    this.filterConfig.leadTime.forEach(lt => {
      if (lt.days) {
        lt.count = this.products.filter(p => 
          p.lead_time_days && p.lead_time_days <= lt.days!
        ).length;
      }
    });
    
    // Update feature counts
    this.filterConfig.features.forEach(feature => {
      switch (feature.id) {
        case 'popular':
          feature.count = this.products.filter(p => p.is_popular).length;
          break;
        case 'novo':
          feature.count = this.products.filter(p => p.is_new).length;
          break;
        case 'promocao':
          feature.count = this.products.filter(p => p.is_featured).length;
          break;
        case 'personalizavel':
          feature.count = this.products.length; // All products are customizable
          break;
        default:
          feature.count = 0;
      }
    });
  }
  
  /**
   * Apply all filters
   */
  applyFilters(): void {
    let filtered = [...this.products];
    
    // Search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        p.category_name?.toLowerCase().includes(query)
      );
    }
    
    // Category filter (only apply if not already filtered by backend via route)
    // If we navigated via category route, backend already filtered, so skip client-side filtering
    if (this.selectedCategories.length > 0 && !this.categorySlug) {
      filtered = filtered.filter(p => 
        p.category_slug && this.selectedCategories.includes(p.category_slug)
      );
    }
    
    // If we have categorySlug from route, backend already filtered correctly
    // Don't apply additional client-side filtering as ProductListResource doesn't include category data
    // The backend has already filtered by category, so we trust that all returned products match
    
    // Price range filter
    if (this.selectedPriceRange) {
      const range = this.filterConfig.priceRanges.find(r => r.id === this.selectedPriceRange);
      if (range) {
        filtered = filtered.filter(p => 
          p.base_price >= range.min && p.base_price <= range.max
        );
      }
    }
    
    // Lead time filter
    if (this.selectedLeadTimes.length > 0) {
      filtered = filtered.filter(p => {
        if (!p.lead_time_days) return false;
        return this.selectedLeadTimes.some(ltId => {
          const lt = this.filterConfig.leadTime.find(l => l.id === ltId);
          return lt && p.lead_time_days && p.lead_time_days <= (lt.days || 999);
        });
      });
    }
    
    // Feature filters
    if (this.selectedFeatures.includes('popular')) {
      filtered = filtered.filter(p => p.is_popular);
    }
    if (this.selectedFeatures.includes('novo')) {
      filtered = filtered.filter(p => p.is_new);
    }
    if (this.selectedFeatures.includes('promocao')) {
      filtered = filtered.filter(p => p.is_featured);
    }
    
    // Minimum quantity filter
    if (this.selectedMinimumQuantity) {
      const qty = this.filterConfig.minimumQuantity.find(q => q.id === this.selectedMinimumQuantity);
      if (qty) {
        filtered = filtered.filter(p => 
          p.minimum_quantity >= qty.min && p.minimum_quantity <= qty.max
        );
      }
    }
    
    // Apply sorting
    this.sortProducts(filtered);
    
    this.filteredProducts = filtered;
    this.totalItems = filtered.length;
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    
    // Reset to page 1 if current page is out of bounds
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = 1;
    }
    
    this.updatePagination();
    this.updateActiveFilters();
    this._changeDetectorRef.markForCheck();
  }
  
  /**
   * Sort products
   */
  sortProducts(products: ProductListItem[]): void {
    products.sort((a, b) => {
      switch (this.sortBy) {
        case 'featured':
          if (a.is_featured && !b.is_featured) return -1;
          if (!a.is_featured && b.is_featured) return 1;
          return 0;
        case 'popular':
          if (a.is_popular && !b.is_popular) return -1;
          if (!a.is_popular && b.is_popular) return 1;
          return 0;
        case 'price-asc':
          return a.base_price - b.base_price;
        case 'price-desc':
          return b.base_price - a.base_price;
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'lead-time':
          return (a.lead_time_days || 999) - (b.lead_time_days || 999);
        default:
          return 0;
      }
    });
  }
  
  /**
   * Update pagination
   */
  updatePagination(): void {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.paginatedProducts = this.filteredProducts.slice(start, end);
  }
  
  /**
   * Update active filters list
   */
  updateActiveFilters(): void {
    this.activeFilters = [];
    
    this.selectedCategories.forEach(slug => {
      const cat = this.filterConfig.categories.find(c => c.slug === slug);
      if (cat) {
        this.activeFilters.push({
          id: slug,
          label: cat.label,
          type: 'category'
        });
      }
    });
    
    if (this.selectedPriceRange) {
      const range = this.filterConfig.priceRanges.find(r => r.id === this.selectedPriceRange);
      if (range) {
        this.activeFilters.push({
          id: this.selectedPriceRange,
          label: range.label,
          type: 'price'
        });
      }
    }
    
    this.selectedLeadTimes.forEach(ltId => {
      const lt = this.filterConfig.leadTime.find(l => l.id === ltId);
      if (lt) {
        this.activeFilters.push({
          id: ltId,
          label: lt.label,
          type: 'leadtime'
        });
      }
    });
    
    this.selectedFeatures.forEach(featureId => {
      const feature = this.filterConfig.features.find(f => f.id === featureId);
      if (feature) {
        this.activeFilters.push({
          id: featureId,
          label: feature.label,
          type: 'feature'
        });
      }
    });
  }
  
  /**
   * Handle filter changes
   */
  onFilterChange(): void {
    this.applyFilters();
    this.updateUrl();
  }
  
  /**
   * Handle category checkbox change
   */
  onCategoryChange(slug: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      if (!this.selectedCategories.includes(slug)) {
        this.selectedCategories.push(slug);
      }
    } else {
      this.selectedCategories = this.selectedCategories.filter(c => c !== slug);
    }
    this.onFilterChange();
  }
  
  /**
   * Handle price range change
   */
  onPriceRangeChange(rangeId: string): void {
    this.selectedPriceRange = this.selectedPriceRange === rangeId ? null : rangeId;
    this.onFilterChange();
  }
  
  /**
   * Handle lead time change
   */
  onLeadTimeChange(ltId: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      if (!this.selectedLeadTimes.includes(ltId)) {
        this.selectedLeadTimes.push(ltId);
      }
    } else {
      this.selectedLeadTimes = this.selectedLeadTimes.filter(l => l !== ltId);
    }
    this.onFilterChange();
  }
  
  /**
   * Handle feature change
   */
  onFeatureChange(featureId: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      if (!this.selectedFeatures.includes(featureId)) {
        this.selectedFeatures.push(featureId);
      }
    } else {
      this.selectedFeatures = this.selectedFeatures.filter(f => f !== featureId);
    }
    this.onFilterChange();
  }
  
  /**
   * Clear all filters
   */
  clearAllFilters(): void {
    this.selectedCategories = [];
    this.selectedPriceRange = null;
    this.selectedLeadTimes = [];
    this.selectedFeatures = [];
    this.selectedMinimumQuantity = null;
    this.searchQuery = '';
    this.currentPage = 1;
    
    // If we're on a category route, navigate to /produtos to clear category filter
    if (this.categorySlug || this.subcategorySlug) {
      this.router.navigate(['/produtos'], { queryParams: {} });
    } else {
      this.applyFilters();
      this.updateUrl();
    }
  }
  
  /**
   * Remove a specific filter
   */
  removeFilter(filter: FilterState): void {
    switch (filter.type) {
      case 'category':
        this.selectedCategories = this.selectedCategories.filter(c => c !== filter.id);
        break;
      case 'price':
        this.selectedPriceRange = null;
        break;
      case 'leadtime':
        this.selectedLeadTimes = this.selectedLeadTimes.filter(l => l !== filter.id);
        break;
      case 'feature':
        this.selectedFeatures = this.selectedFeatures.filter(f => f !== filter.id);
        break;
    }
    this.onFilterChange();
  }
  
  /**
   * Handle sort change
   */
  onSortChange(): void {
    this.applyFilters();
    this.updateUrl();
  }
  
  /**
   * Handle search change
   */
  onSearchChange(query: string): void {
    this.searchSubject.next(query);
  }
  
  /**
   * Toggle view mode
   */
  toggleViewMode(mode: ViewMode): void {
    this.viewMode = mode;
  }
  
  /**
   * Go to page
   */
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
      this.updateUrl();
      this.scrollToTop();
    }
  }
  
  /**
   * Handle items per page change
   */
  onItemsPerPageChange(): void {
    this.currentPage = 1;
    this.updatePagination();
    this.updateUrl();
  }
  
  /**
   * Navigate to product detail
   */
  navigateToProduct(product: ProductListItem): void {
    this.router.navigate(['/products', product.slug]);
  }

  /**
   * Get pagination info for PaginationComponent
   */
  get paginationInfo(): PaginationInfo {
    return {
      current_page: this.currentPage,
      per_page: this.itemsPerPage,
      total: this.totalItems,
      last_page: this.totalPages,
      from: (this.currentPage - 1) * this.itemsPerPage + 1,
      to: Math.min(this.currentPage * this.itemsPerPage, this.totalItems)
    };
  }
  
  /**
   * Read query params from URL
   */
  readQueryParams(params: any): void {
    if (params.page) this.currentPage = parseInt(params.page, 10) || DEFAULT_PAGE;
    if (params.limit) this.itemsPerPage = parseInt(params.limit, 10) || DEFAULT_ITEMS_PER_PAGE;
    if (params.preco) this.selectedPriceRange = params.preco;
    if (params.entrega) this.selectedLeadTimes = params.entrega.split(',').filter((x: string) => x);
    if (params.destaque) this.selectedFeatures = params.destaque.split(',').filter((x: string) => x);
    if (params.busca) this.searchQuery = params.busca;
    if (params.ordem) this.sortBy = params.ordem;
  }
  
  /**
   * Update URL with current state
   */
  updateUrl(): void {
    const queryParams: any = {
      page: this.currentPage > 1 ? this.currentPage : null,
      limit: this.itemsPerPage !== DEFAULT_ITEMS_PER_PAGE ? this.itemsPerPage : null,
      ordem: this.sortBy !== DEFAULT_SORT ? this.sortBy : null
    };
    
    if (this.selectedPriceRange) queryParams.preco = this.selectedPriceRange;
    if (this.selectedLeadTimes.length > 0) queryParams.entrega = this.selectedLeadTimes.join(',');
    if (this.selectedFeatures.length > 0) queryParams.destaque = this.selectedFeatures.join(',');
    if (this.searchQuery.trim()) queryParams.busca = this.searchQuery.trim();
    
    // Remove null values
    Object.keys(queryParams).forEach(key => {
      if (queryParams[key] === null || queryParams[key] === '') {
        delete queryParams[key];
      }
    });
    
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: queryParams,
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }
  
  /**
   * Update breadcrumbs
   */
  updateBreadcrumbs(): void {
    this.breadcrumbItems = [
      { label: 'Início', url: '/' }
    ];
    
    if (this.categorySlug) {
      const category = this.categories.find(c => c.slug === this.categorySlug);
      if (category) {
        this.breadcrumbItems.push({
          label: category.name,
          url: `/produtos/${category.slug}`
        });
      }
      
      if (this.subcategorySlug) {
        const subcategory = this.categories.find(c => c.slug === this.subcategorySlug);
        if (subcategory) {
          this.breadcrumbItems.push({
            label: subcategory.name,
            url: `/produtos/${this.categorySlug}/${subcategory.slug}`
          });
        }
      }
    } else {
      this.breadcrumbItems.push({ label: 'Produtos' });
    }
  }
  
  /**
   * Scroll to top
   */
  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  
  /**
   * Get full image URL
   */
  getFullImageUrl(path: string | null): string {
    if (!path) return '/assets/placeholder.jpg';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return this.configService.getFileUrl(path);
  }
  
  /**
   * Get WhatsApp URL
   */
  getWhatsAppUrl(): string {
    const message = encodeURIComponent(WHATSAPP_MESSAGE);
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
  }
  
  /**
   * Open mobile filters
   */
  openMobileFilters(): void {
    this.showMobileFilters = true;
  }
  
  /**
   * Close mobile filters
   */
  closeMobileFilters(): void {
    this.showMobileFilters = false;
  }
  
  /**
   * Apply mobile filters
   */
  applyMobileFilters(): void {
    this.applyFilters();
    this.closeMobileFilters();
  }
  
  /**
   * Get has active filters
   */
  get hasActiveFilters(): boolean {
    return (this.categorySlug !== null || this.subcategorySlug !== null) ||
           this.selectedCategories.length > 0 ||
           this.selectedPriceRange !== null ||
           this.selectedLeadTimes.length > 0 ||
           this.selectedFeatures.length > 0 ||
           this.selectedMinimumQuantity !== null ||
           this.searchQuery.trim().length > 0;
  }
  
  /**
   * Get active filter count
   */
  get activeFilterCount(): number {
    return this.activeFilters.length;
  }
}

