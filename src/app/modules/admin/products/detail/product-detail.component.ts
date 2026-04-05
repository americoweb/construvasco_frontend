import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { PageHeaderComponent } from '../../../../shared/components/layout/page-header/page-header.component';
import { CardComponent } from '../../../../shared/components/ui/card/card.component';
import { BadgeComponent } from '../../../../shared/components/ui/badge/badge.component';
import { DataTableComponent, TableColumn, TableAction } from '../../../../shared/components/data/table/data-table.component';
import { ButtonComponent } from '../../../../shared/components/ui/button/button.component';
import { LoadingComponent } from '../../../../shared/components/ui/loading/loading.component';
import { EmptyStateComponent } from '../../../../shared/components/ui/empty-state/empty-state.component';
import { NotificationService } from '../../../../shared/components/feedback/notification.service';
import { ProductService } from '../shared/product.service';
import { Product, ProductColor, ProductPrintArea, ProductSize, ProductStatus } from '../shared/product.types';
import { ColorManagementComponent } from '../components/color-management/color-management.component';
import { PrintAreaManagementComponent } from '../components/print-area-management/print-area-management.component';
import { SizeManagementComponent } from '../components/size-management/size-management.component';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [
    CommonModule,
    PageHeaderComponent,
    CardComponent,
    BadgeComponent,
    DataTableComponent,
    ButtonComponent,
    LoadingComponent,
    EmptyStateComponent,
    ColorManagementComponent,
    PrintAreaManagementComponent,
    SizeManagementComponent
  ],
  templateUrl: './product-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductDetailComponent implements OnInit, OnDestroy {
  product: Product | null = null;
  colors: ProductColor[] = [];
  printAreas: ProductPrintArea[] = [];
  loading = false;
  loadingColors = false;
  loadingPrintAreas = false;
  activeTab: 'info' | 'colors' | 'print-areas' | 'sizes' = 'info';

  pageHeaderActions = [
    {
      label: 'Editar',
      icon: 'edit',
      variant: 'primary' as const,
      callback: () => this.editProduct()
    }
  ];

  colorColumns: TableColumn[] = [
    { key: 'name', label: 'Nome', sortable: true },
    { 
      key: 'hex_code', 
      label: 'Cor', 
      type: 'custom',
      format: (value: string) => value
    },
    { key: 'stock_quantity', label: 'Estoque', sortable: true },
    { 
      key: 'is_active', 
      label: 'Status', 
      type: 'badge',
      format: (value: boolean) => value ? 'Ativo' : 'Inativo'
    }
  ];

  printAreaColumns: TableColumn[] = [
    { key: 'name', label: 'Nome', sortable: true },
    { key: 'position_label', label: 'Posição', sortable: true },
    { key: 'dimensions', label: 'Dimensões', sortable: true },
    { key: 'additional_price', label: 'Preço Adicional', sortable: true },
    { 
      key: 'is_active', 
      label: 'Status', 
      type: 'badge',
      format: (value: boolean) => value ? 'Ativo' : 'Inativo'
    }
  ];

  colorActions: TableAction[] = [
    {
      label: 'Editar',
      icon: 'edit',
      handler: (color: ProductColor) => this.editColor(color)
    },
    {
      label: 'Excluir',
      icon: 'delete',
      color: 'warn',
      handler: (color: ProductColor) => this.deleteColor(color)
    }
  ];

  printAreaActions: TableAction[] = [
    {
      label: 'Editar',
      icon: 'edit',
      handler: (area: ProductPrintArea) => this.editPrintArea(area)
    },
    {
      label: 'Excluir',
      icon: 'delete',
      color: 'warn',
      handler: (area: ProductPrintArea) => this.deletePrintArea(area)
    }
  ];

  breadcrumbs = [
    { label: 'Produtos', url: '/admin/products' },
    { label: 'Detalhes' }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private productService: ProductService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = +params['id'];
      if (id) {
        this.loadProduct(id);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadProduct(id: number): void {
    this.loading = true;
    this.productService.getProductWithDetails(id).subscribe({
      next: (response) => {
        if (response.data) {
          this.product = response.data;
          this.breadcrumbs[1] = { label: this.product.name };
          this.loadColors();
          this.loadPrintAreas();
        }
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.loading = false;
        this.notificationService.show({
          type: 'error',
          message: 'Erro ao carregar produto',
          title: 'Erro'
        });
        this.router.navigate(['/admin/products']);
        this.cdr.markForCheck();
      }
    });
  }

  loadColors(): void {
    if (!this.product) return;
    this.loadingColors = true;
    this.productService.getProductColors(this.product.id).subscribe({
      next: (response) => {
        this.colors = response.data || [];
        this.loadingColors = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.loadingColors = false;
        this.cdr.markForCheck();
      }
    });
  }

  loadPrintAreas(): void {
    if (!this.product) return;
    this.loadingPrintAreas = true;
    this.productService.getProductPrintAreas(this.product.id).subscribe({
      next: (response) => {
        this.printAreas = response.data || [];
        this.loadingPrintAreas = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.loadingPrintAreas = false;
        this.cdr.markForCheck();
      }
    });
  }

  editProduct(): void {
    if (this.product) {
      this.router.navigate(['/admin/products', this.product.id, 'edit']);
    }
  }

  setActiveTab(tab: 'info' | 'colors' | 'print-areas' | 'sizes'): void {
    this.activeTab = tab;
    this.cdr.markForCheck();
  }

  addColor(): void {
    // Handled by ColorManagementComponent
  }

  editColor(color: ProductColor): void {
    // Handled by ColorManagementComponent
  }

  onColorAdded(color: ProductColor): void {
    this.loadColors();
  }

  onColorUpdated(color: ProductColor): void {
    this.loadColors();
  }

  onColorDeleted(colorId: number): void {
    this.loadColors();
  }

  deleteColor(color: ProductColor): void {
    if (!this.product) return;
    this.productService.deleteColor(this.product.id, color.id).subscribe({
      next: () => {
        this.notificationService.show({
          type: 'success',
          message: 'Cor excluída com sucesso',
          title: 'Sucesso'
        });
        this.loadColors();
      },
      error: (error) => {
        this.notificationService.show({
          type: 'error',
          message: 'Erro ao excluir cor',
          title: 'Erro'
        });
      }
    });
  }

  addPrintArea(): void {
    // Handled by PrintAreaManagementComponent
  }

  editPrintArea(area: ProductPrintArea): void {
    // Handled by PrintAreaManagementComponent
  }

  onPrintAreaAdded(area: ProductPrintArea): void {
    this.loadPrintAreas();
  }

  onPrintAreaUpdated(area: ProductPrintArea): void {
    this.loadPrintAreas();
  }

  onPrintAreaDeleted(areaId: number): void {
    this.loadPrintAreas();
  }

  deletePrintArea(area: ProductPrintArea): void {
    if (!this.product) return;
    this.productService.deletePrintArea(this.product.id, area.id).subscribe({
      next: () => {
        this.notificationService.show({
          type: 'success',
          message: 'Área de impressão excluída com sucesso',
          title: 'Sucesso'
        });
        this.loadPrintAreas();
      },
      error: (error) => {
        this.notificationService.show({
          type: 'error',
          message: 'Erro ao excluir área de impressão',
          title: 'Erro'
        });
      }
    });
  }

  onSizeAdded(size: ProductSize): void {
    // Size management component handles its own loading
  }

  onSizeUpdated(size: ProductSize): void {
    // Size management component handles its own loading
  }

  onSizeDeleted(sizeId: number): void {
    // Size management component handles its own loading
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

