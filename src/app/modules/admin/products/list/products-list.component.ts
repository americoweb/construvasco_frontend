import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { PageHeaderComponent } from '../../../../shared/components/layout/page-header/page-header.component';
import { DataTableComponent, TableColumn, TableAction } from '../../../../shared/components/data/table/data-table.component';
import { DataFiltersComponent, FilterField } from '../../../../shared/components/data/filters/data-filters.component';
import { PaginationComponent } from '../../../../shared/components/data/pagination/pagination.component';
import { ConfirmDialogComponent } from '../../../../shared/components/feedback/confirm-dialog/confirm-dialog.component';
import { NotificationService } from '../../../../shared/components/feedback/notification.service';
import { ModalService } from '../../../../shared/components/feedback/modal.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ProductService } from '../shared/product.service';
import { Product, ProductStatus } from '../shared/product.types';
import { PaginationInfo } from '../../../../core/models/api.types';

@Component({
  selector: 'app-products-list',
  standalone: true,
  imports: [
    CommonModule,
    PageHeaderComponent,
    DataTableComponent,
    DataFiltersComponent,
    PaginationComponent,
    MatDialogModule
  ],
  templateUrl: './products-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductsListComponent implements OnInit, OnDestroy {
  products: Product[] = [];
  loading = false;
  pagination: PaginationInfo = {
    current_page: 1,
    per_page: 15,
    total: 0,
    last_page: 1
  };
  searchValue = '';
  filters: any = {};
  
  columns: TableColumn[] = [
    { 
      key: 'image_url', 
      label: 'Imagem', 
      type: 'image',
      sortable: false,
      width: '80px'
    },
    { key: 'name', label: 'Nome', sortable: true },
    { key: 'price_formatted', label: 'Preço', sortable: true },
    { key: 'min_quantity', label: 'Qtd. Mínima', sortable: true },
    { 
      key: 'status', 
      label: 'Status', 
      type: 'badge',
      format: (value: ProductStatus) => this.getStatusLabel(value)
    },
    { 
      key: 'is_featured', 
      label: 'Destaque', 
      type: 'badge',
      format: (value: boolean) => value ? 'Sim' : 'Não'
    }
  ];

  actions: TableAction[] = [
    {
      label: 'Ver',
      icon: 'visibility',
      handler: (product: Product) => this.viewProduct(product)
    },
    {
      label: 'Editar',
      icon: 'edit',
      handler: (product: Product) => this.editProduct(product)
    },
    {
      label: 'Destacar',
      icon: 'star',
      handler: (product: Product) => this.toggleFeatured(product),
      condition: (product: Product) => !product.is_featured
    },
    {
      label: 'Remover Destaque',
      icon: 'star_border',
      handler: (product: Product) => this.toggleFeatured(product),
      condition: (product: Product) => product.is_featured
    },
    {
      label: 'Excluir',
      icon: 'delete',
      color: 'warn',
      handler: (product: Product) => this.deleteProduct(product)
    }
  ];

  filterFields: FilterField[] = [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: ProductStatus.ACTIVE, label: 'Ativo' },
        { value: ProductStatus.INACTIVE, label: 'Inativo' },
        { value: ProductStatus.OUT_OF_STOCK, label: 'Fora de Estoque' },
        { value: ProductStatus.DISCONTINUED, label: 'Descontinuado' }
      ]
    },
    {
      key: 'is_featured',
      label: 'Destaque',
      type: 'select',
      options: [
        { value: 'true', label: 'Sim' },
        { value: 'false', label: 'Não' }
      ]
    }
  ];

  pageHeaderActions = [
    {
      label: 'Novo Produto',
      icon: 'add',
      variant: 'primary' as const,
      callback: () => this.createProduct()
    }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private productService: ProductService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private notificationService: NotificationService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadProducts();
    this.subscribeToService();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToService(): void {
    this.productService.items$.pipe(takeUntil(this.destroy$)).subscribe(products => {
      this.products = products;
      this.cdr.markForCheck();
    });

    this.productService.loading$.pipe(takeUntil(this.destroy$)).subscribe(loading => {
      this.loading = loading;
      this.cdr.markForCheck();
    });

    this.productService.pagination$.pipe(takeUntil(this.destroy$)).subscribe(pagination => {
      this.pagination = pagination;
      this.cdr.markForCheck();
    });
  }

  loadProducts(): void {
    const params: any = {
      page: this.pagination.current_page,
      per_page: this.pagination.per_page
    };

    if (this.searchValue) {
      params.search = this.searchValue;
    }

    Object.assign(params, this.filters);

    this.productService.get(params).subscribe({
      next: (response) => {
        if (response.meta) {
          this.pagination = response.meta;
        }
      },
      error: (error) => {
        this.notificationService.show({
          type: 'error',
          message: 'Erro ao carregar produtos',
          title: 'Erro'
        });
      }
    });
  }

  onSearchChange(search: string): void {
    this.searchValue = search;
    this.pagination.current_page = 1;
    this.loadProducts();
  }

  onFilterToggle(): void {
    // Toggle filters visibility - handled by DataFiltersComponent
  }

  onFiltersChange(filters: any): void {
    this.filters = filters;
    this.pagination.current_page = 1;
    this.loadProducts();
  }

  onPageChange(page: number): void {
    this.pagination.current_page = page;
    this.loadProducts();
  }

  onPageSizeChange(pageSize: number): void {
    this.pagination.per_page = pageSize;
    this.pagination.current_page = 1;
    this.loadProducts();
  }

  onRefresh(): void {
    this.loadProducts();
  }

  createProduct(): void {
    this.router.navigate(['/admin/products/create']);
  }

  viewProduct(product: Product): void {
    this.router.navigate(['/admin/products', product.id]);
  }

  editProduct(product: Product): void {
    this.router.navigate(['/admin/products', product.id, 'edit']);
  }

  toggleFeatured(product: Product): void {
    this.productService.toggleFeatured(product.id).subscribe({
      next: (response) => {
        this.notificationService.show({
          type: 'success',
          message: response.data?.is_featured 
            ? 'Produto destacado com sucesso' 
            : 'Produto removido dos destaques',
          title: 'Sucesso'
        });
        this.loadProducts();
      },
      error: (error) => {
        this.notificationService.show({
          type: 'error',
          message: 'Erro ao alterar destaque do produto',
          title: 'Erro'
        });
      }
    });
  }

  deleteProduct(product: Product): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Confirmar Exclusão',
        message: `Tem certeza que deseja excluir o produto "${product.name}"?`,
        confirmText: 'Excluir',
        cancelText: 'Cancelar',
        type: 'danger'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.confirmed) {
        this.productService.delete(product.id).subscribe({
          next: () => {
            this.notificationService.show({
              type: 'success',
              message: 'Produto excluído com sucesso',
              title: 'Sucesso'
            });
            this.loadProducts();
          },
          error: (error) => {
            this.notificationService.show({
              type: 'error',
              message: 'Erro ao excluir produto',
              title: 'Erro'
            });
          }
        });
      }
    });
  }

  getStatusLabel(status: ProductStatus): string {
    const labels: Record<ProductStatus, string> = {
      [ProductStatus.ACTIVE]: 'Ativo',
      [ProductStatus.INACTIVE]: 'Inativo',
      [ProductStatus.OUT_OF_STOCK]: 'Fora de Estoque',
      [ProductStatus.DISCONTINUED]: 'Descontinuado'
    };
    return labels[status] || status;
  }

  getStatusColor(status: ProductStatus): string {
    const colors: Record<ProductStatus, string> = {
      [ProductStatus.ACTIVE]: 'green',
      [ProductStatus.INACTIVE]: 'gray',
      [ProductStatus.OUT_OF_STOCK]: 'yellow',
      [ProductStatus.DISCONTINUED]: 'red'
    };
    return colors[status] || 'gray';
  }
}

