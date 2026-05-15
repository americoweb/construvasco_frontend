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
import { OrderService } from '../shared/order.service';
import { Order, OrderStatus, PaymentStatus } from '../shared/order.types';
import { PaginationInfo } from '../../../../core/models/api.types';

@Component({
  selector: 'app-orders-list',
  standalone: true,
  imports: [
    CommonModule,
    PageHeaderComponent,
    DataTableComponent,
    DataFiltersComponent,
    PaginationComponent,
    MatDialogModule
  ],
  templateUrl: './orders-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrdersListComponent implements OnInit, OnDestroy {
  orders: Order[] = [];
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
    { key: 'order_number', label: 'Número do Pedido', sortable: true },
    { key: 'shipping_name', label: 'Cliente', sortable: true },
    { 
      key: 'status', 
      label: 'Status', 
      type: 'badge',
      format: (value: OrderStatus) => this.getStatusLabel(value)
    },
    { 
      key: 'payment_status', 
      label: 'Pagamento', 
      type: 'badge',
      format: (value: PaymentStatus) => this.getPaymentStatusLabel(value)
    },
    { key: 'formatted_total', label: 'Total', sortable: false, format: (value: string) => value || '-' },
    { key: 'total_items', label: 'Itens', sortable: true },
    { key: 'created_at', label: 'Data', type: 'date', sortable: true }
  ];

  actions: TableAction[] = [
    {
      label: 'Ver',
      icon: 'visibility',
      handler: (order: Order) => this.viewOrder(order)
    },
    {
      label: 'Atualizar Status',
      icon: 'update',
      handler: (order: Order) => this.updateStatus(order)
    },
    {
      label: 'Cancelar',
      icon: 'cancel',
      color: 'warn',
      handler: (order: Order) => this.cancelOrder(order),
      condition: (order: Order) => order.can_be_cancelled === true
    }
  ];

  filterFields: FilterField[] = [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: OrderStatus.PENDING, label: 'Pendente' },
        { value: OrderStatus.CONFIRMED, label: 'Confirmado' },
        { value: OrderStatus.IN_PRODUCTION, label: 'Em Produção' },
        { value: OrderStatus.SHIPPED, label: 'Enviado' },
        { value: OrderStatus.DELIVERED, label: 'Entregue' },
        { value: OrderStatus.CANCELLED, label: 'Cancelado' }
      ]
    },
    {
      key: 'payment_status',
      label: 'Status de Pagamento',
      type: 'select',
      options: [
        { value: PaymentStatus.PENDING, label: 'Pendente' },
        { value: PaymentStatus.PAID, label: 'Pago' },
        { value: PaymentStatus.FAILED, label: 'Falhou' },
        { value: PaymentStatus.REFUNDED, label: 'Reembolsado' }
      ]
    }
  ];

  pageHeaderActions = [
    {
      label: 'Novo pedido',
      icon: 'add',
      variant: 'primary' as const,
      callback: () => this.router.navigate(['/admin/orders/create'])
    },
    {
      label: 'Visualização Kanban',
      icon: 'view_kanban',
      variant: 'secondary' as const,
      callback: () => this.navigateToKanban()
    }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private orderService: OrderService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private notificationService: NotificationService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadOrders();
    this.subscribeToService();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToService(): void {
    this.orderService.items$.pipe(takeUntil(this.destroy$)).subscribe(orders => {
      this.orders = orders;
      this.cdr.markForCheck();
    });

    this.orderService.loading$.pipe(takeUntil(this.destroy$)).subscribe(loading => {
      this.loading = loading;
      this.cdr.markForCheck();
    });

    this.orderService.pagination$.pipe(takeUntil(this.destroy$)).subscribe(pagination => {
      this.pagination = pagination;
      this.cdr.markForCheck();
    });
  }

  loadOrders(): void {
    const params: any = {
      page: this.pagination.current_page,
      per_page: this.pagination.per_page
    };

    if (this.searchValue) {
      params.search = this.searchValue;
    }

    Object.assign(params, this.filters);

    this.orderService.get(params).subscribe({
      next: (response) => {
        if (response.meta) {
          this.pagination = response.meta;
        }
      },
      error: (error) => {
        this.notificationService.show({
          type: 'error',
          message: 'Erro ao carregar pedidos',
          title: 'Erro'
        });
      }
    });
  }

  onSearchChange(search: string): void {
    this.searchValue = search;
    this.pagination.current_page = 1;
    this.loadOrders();
  }

  onFilterToggle(): void {
    // Toggle filters visibility - handled by DataFiltersComponent
  }

  onFiltersChange(filters: any): void {
    this.filters = filters;
    this.pagination.current_page = 1;
    this.loadOrders();
  }

  onPageChange(page: number): void {
    this.pagination.current_page = page;
    this.loadOrders();
  }

  onPageSizeChange(pageSize: number): void {
    this.pagination.per_page = pageSize;
    this.pagination.current_page = 1;
    this.loadOrders();
  }

  onRefresh(): void {
    this.loadOrders();
  }

  navigateToKanban(): void {
    this.router.navigate(['/admin/orders/kanban']);
  }

  viewOrder(order: Order): void {
    this.router.navigate(['/admin/orders', order.id]);
  }

  updateStatus(order: Order): void {
    // Navigate to detail page where status can be updated
    this.router.navigate(['/admin/orders', order.id]);
  }

  cancelOrder(order: Order): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Confirmar Cancelamento',
        message: `Tem certeza que deseja cancelar o pedido "${order.order_number}"?`,
        confirmText: 'Cancelar Pedido',
        cancelText: 'Não',
        type: 'danger'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.confirmed) {
        this.orderService.cancel(order.id).subscribe({
          next: () => {
            this.notificationService.show({
              type: 'success',
              message: 'Pedido cancelado com sucesso',
              title: 'Sucesso'
            });
            this.loadOrders();
          },
          error: (error) => {
            this.notificationService.show({
              type: 'error',
              message: 'Erro ao cancelar pedido',
              title: 'Erro'
            });
          }
        });
      }
    });
  }

  getStatusLabel(status: OrderStatus): string {
    const labels: Partial<Record<OrderStatus, string>> = {
      [OrderStatus.PENDING]: 'Pendente',
      [OrderStatus.TRIAGED]: 'Triado',
      [OrderStatus.ASSIGNED]: 'Atribuído',
      [OrderStatus.IN_DESIGN]: 'Em Projeto',
      [OrderStatus.AWAITING_CLIENT]: 'Aguardando Cliente',
      [OrderStatus.APPROVED]: 'Aprovado',
      [OrderStatus.IN_EXECUTION]: 'Em Execução',
      [OrderStatus.CONFIRMED]: 'Confirmado',
      [OrderStatus.IN_PRODUCTION]: 'Em Produção',
      [OrderStatus.SHIPPED]: 'Enviado',
      [OrderStatus.DELIVERED]: 'Entregue',
      [OrderStatus.CANCELLED]: 'Cancelado',
    };
    return labels[status] || status;
  }

  getPaymentStatusLabel(status: PaymentStatus): string {
    const labels: Record<PaymentStatus, string> = {
      [PaymentStatus.PENDING]: 'Pendente',
      [PaymentStatus.PAID]: 'Pago',
      [PaymentStatus.FAILED]: 'Falhou',
      [PaymentStatus.REFUNDED]: 'Reembolsado'
    };
    return labels[status] || status;
  }

}

