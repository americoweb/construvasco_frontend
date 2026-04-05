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
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DesignService } from '../shared/design.service';
import { Design, DesignStatus } from '../shared/design.types';
import { PaginationInfo } from '../../../../core/models/api.types';

@Component({
  selector: 'app-designs-list',
  standalone: true,
  imports: [
    CommonModule,
    PageHeaderComponent,
    DataTableComponent,
    DataFiltersComponent,
    PaginationComponent,
    MatDialogModule
  ],
  templateUrl: './designs-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DesignsListComponent implements OnInit, OnDestroy {
  designs: Design[] = [];
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
    { key: 'id', label: 'ID', sortable: true, width: '80px' },
    { key: 'product_name', label: 'Produto', sortable: true },
    { 
      key: 'prompt', 
      label: 'Prompt', 
      sortable: false,
      format: (value: string) => value ? (value.length > 50 ? value.substring(0, 50) + '...' : value) : '-'
    },
    { 
      key: 'status', 
      label: 'Status', 
      type: 'badge',
      format: (value: DesignStatus) => this.getStatusLabel(value)
    },
    { key: 'color_name', label: 'Cor', sortable: false },
    { key: 'print_area_name', label: 'Área de Impressão', sortable: false },
    { 
      key: 'created_at', 
      label: 'Criado em', 
      format: (value: string) => {
        if (!value) return '-';
        try {
          return new Date(value).toLocaleDateString('pt-BR');
        } catch {
          return value;
        }
      }
    }
  ];

  actions: TableAction[] = [
    {
      label: 'Ver',
      icon: 'visibility',
      handler: (design: Design) => this.viewDesign(design)
    },
    {
      label: 'Excluir',
      icon: 'delete',
      color: 'warn',
      handler: (design: Design) => this.deleteDesign(design)
    }
  ];

  filterFields: FilterField[] = [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: DesignStatus.DRAFT, label: 'Rascunho' },
        { value: DesignStatus.GENERATING, label: 'Gerando' },
        { value: DesignStatus.COMPLETED, label: 'Concluído' },
        { value: DesignStatus.FAILED, label: 'Falhou' },
        { value: DesignStatus.REFINED, label: 'Refinado' }
      ]
    },
    {
      key: 'date_from',
      label: 'Data Inicial',
      type: 'date'
    },
    {
      key: 'date_to',
      label: 'Data Final',
      type: 'date'
    }
  ];

  pageHeaderActions = [
    {
      label: 'Atualizar',
      icon: 'refresh',
      variant: 'secondary' as const,
      callback: () => this.onRefresh()
    }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private designService: DesignService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private notificationService: NotificationService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadDesigns();
    this.subscribeToService();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToService(): void {
    this.designService.items$.pipe(takeUntil(this.destroy$)).subscribe(designs => {
      this.designs = designs;
      this.cdr.markForCheck();
    });

    this.designService.loading$.pipe(takeUntil(this.destroy$)).subscribe(loading => {
      this.loading = loading;
      this.cdr.markForCheck();
    });

    this.designService.pagination$.pipe(takeUntil(this.destroy$)).subscribe(pagination => {
      this.pagination = pagination;
      this.cdr.markForCheck();
    });
  }

  loadDesigns(): void {
    const params: any = {
      page: this.pagination.current_page,
      per_page: this.pagination.per_page
    };

    if (this.searchValue) {
      params.search = this.searchValue;
    }

    Object.assign(params, this.filters);

    this.designService.get(params).subscribe({
      next: (response) => {
        if (response.meta) {
          this.pagination = response.meta;
        }
      },
      error: (error) => {
        this.notificationService.show({
          type: 'error',
          message: 'Erro ao carregar designs',
          title: 'Erro'
        });
      }
    });
  }

  onSearchChange(search: string): void {
    this.searchValue = search;
    this.pagination.current_page = 1;
    this.loadDesigns();
  }

  onFilterToggle(): void {
    // Toggle filters visibility - handled by DataFiltersComponent
  }

  onFiltersChange(filters: any): void {
    this.filters = filters;
    this.pagination.current_page = 1;
    this.loadDesigns();
  }

  onPageChange(page: number): void {
    this.pagination.current_page = page;
    this.loadDesigns();
  }

  onPageSizeChange(pageSize: number): void {
    this.pagination.per_page = pageSize;
    this.pagination.current_page = 1;
    this.loadDesigns();
  }

  onRefresh(): void {
    this.loadDesigns();
  }

  viewDesign(design: Design): void {
    this.router.navigate(['/admin/designs', design.id]);
  }

  deleteDesign(design: Design): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Confirmar Exclusão',
        message: `Tem certeza que deseja excluir o design #${design.id}?`,
        confirmText: 'Excluir',
        cancelText: 'Cancelar',
        type: 'danger'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.confirmed) {
        this.designService.deleteDesign(design.id).subscribe({
          next: () => {
            this.notificationService.show({
              type: 'success',
              message: 'Design excluído com sucesso',
              title: 'Sucesso'
            });
            this.loadDesigns();
          },
          error: (error) => {
            this.notificationService.show({
              type: 'error',
              message: 'Erro ao excluir design',
              title: 'Erro'
            });
          }
        });
      }
    });
  }

  getStatusLabel(status: DesignStatus): string {
    const labels: Record<DesignStatus, string> = {
      [DesignStatus.DRAFT]: 'Rascunho',
      [DesignStatus.GENERATING]: 'Gerando',
      [DesignStatus.COMPLETED]: 'Concluído',
      [DesignStatus.FAILED]: 'Falhou',
      [DesignStatus.REFINED]: 'Refinado'
    };
    return labels[status] || status;
  }

  getStatusColor(status: DesignStatus): string {
    const colors: Record<DesignStatus, string> = {
      [DesignStatus.DRAFT]: 'gray',
      [DesignStatus.GENERATING]: 'blue',
      [DesignStatus.COMPLETED]: 'green',
      [DesignStatus.FAILED]: 'red',
      [DesignStatus.REFINED]: 'purple'
    };
    return colors[status] || 'gray';
  }
}

