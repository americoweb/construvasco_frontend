import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { PageHeaderComponent } from '../../../../shared/components/layout/page-header/page-header.component';
import { DataTableComponent, TableColumn, TableAction } from '../../../../shared/components/data/table/data-table.component';
import { PaginationComponent } from '../../../../shared/components/data/pagination/pagination.component';
import { ConfirmDialogComponent } from '../../../../shared/components/feedback/confirm-dialog/confirm-dialog.component';
import { NotificationService } from '../../../../shared/components/feedback/notification.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CategoryService } from '../shared/category.service';
import { Category } from '../shared/category.types';
import { PaginationInfo } from '../../../../core/models/api.types';

@Component({
  selector: 'app-categories-list',
  standalone: true,
  imports: [
    CommonModule,
    PageHeaderComponent,
    DataTableComponent,
    PaginationComponent,
    MatDialogModule
  ],
  templateUrl: './categories-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CategoriesListComponent implements OnInit, OnDestroy {
  categories: Category[] = [];
  loading = false;
  pagination: PaginationInfo = {
    current_page: 1,
    per_page: 15,
    total: 0,
    last_page: 1
  };
  searchValue = '';
  
  columns: TableColumn[] = [
    { 
      key: 'image_url', 
      label: 'Imagem', 
      type: 'image',
      sortable: false,
      width: '80px'
    },
    { key: 'name', label: 'Nome', sortable: true },
    { 
      key: 'parent_name', 
      label: 'Categoria Pai', 
      sortable: false,
      format: (value: string | null) => value || '-'
    },
    { 
      key: 'is_active', 
      label: 'Ativo', 
      type: 'badge',
      format: (value: boolean) => value ? 'Sim' : 'Não'
    },
    { key: 'sort_order', label: 'Ordem', sortable: true },
    { 
      key: 'products_count', 
      label: 'Produtos', 
      sortable: false,
      format: (value: number | undefined | null) => value !== undefined && value !== null ? value.toString() : '-'
    }
  ];

  actions: TableAction[] = [
    {
      label: 'Ver',
      icon: 'visibility',
      handler: (category: Category) => this.viewCategory(category)
    },
    {
      label: 'Editar',
      icon: 'edit',
      handler: (category: Category) => this.editCategory(category)
    },
    {
      label: 'Excluir',
      icon: 'delete',
      color: 'warn',
      handler: (category: Category) => this.deleteCategory(category)
    }
  ];

  pageHeaderActions = [
    {
      label: 'Nova Categoria',
      icon: 'add',
      variant: 'primary' as const,
      callback: () => this.createCategory()
    }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private categoryService: CategoryService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private notificationService: NotificationService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    this.subscribeToService();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToService(): void {
    this.categoryService.items$.pipe(takeUntil(this.destroy$)).subscribe(categories => {
      this.categories = categories;
      this.cdr.markForCheck();
    });

    this.categoryService.loading$.pipe(takeUntil(this.destroy$)).subscribe(loading => {
      this.loading = loading;
      this.cdr.markForCheck();
    });

    this.categoryService.pagination$.pipe(takeUntil(this.destroy$)).subscribe(pagination => {
      this.pagination = pagination;
      this.cdr.markForCheck();
    });
  }

  loadCategories(): void {
    const params: any = {
      page: this.pagination.current_page,
      per_page: this.pagination.per_page
    };

    if (this.searchValue) {
      params.search = this.searchValue;
    }

    this.categoryService.get(params).subscribe({
      next: (response) => {
        if (response.meta) {
          this.pagination = response.meta;
        }
      },
      error: (error) => {
        this.notificationService.show({
          type: 'error',
          message: 'Erro ao carregar categorias',
          title: 'Erro'
        });
      }
    });
  }

  onSearchChange(search: string): void {
    this.searchValue = search;
    this.pagination.current_page = 1;
    this.loadCategories();
  }

  onPageChange(page: number): void {
    this.pagination.current_page = page;
    this.loadCategories();
  }

  onPageSizeChange(pageSize: number): void {
    this.pagination.per_page = pageSize;
    this.pagination.current_page = 1;
    this.loadCategories();
  }

  onRefresh(): void {
    this.loadCategories();
  }

  createCategory(): void {
    this.router.navigate(['/admin/categories/create']);
  }

  viewCategory(category: Category): void {
    this.router.navigate(['/admin/categories', category.id]);
  }

  editCategory(category: Category): void {
    this.router.navigate(['/admin/categories', category.id, 'edit']);
  }

  deleteCategory(category: Category): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Confirmar Exclusão',
        message: `Tem certeza que deseja excluir a categoria "${category.name}"?`,
        confirmText: 'Excluir',
        cancelText: 'Cancelar',
        type: 'danger'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.confirmed) {
        this.categoryService.delete(category.id).subscribe({
          next: () => {
            this.notificationService.show({
              type: 'success',
              message: 'Categoria excluída com sucesso',
              title: 'Sucesso'
            });
            this.loadCategories();
          },
          error: (error) => {
            this.notificationService.show({
              type: 'error',
              message: 'Erro ao excluir categoria',
              title: 'Erro'
            });
          }
        });
      }
    });
  }
}

