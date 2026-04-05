import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { PageHeaderComponent } from '../../../../shared/components/layout/page-header/page-header.component';
import { CardComponent } from '../../../../shared/components/ui/card/card.component';
import { BadgeComponent } from '../../../../shared/components/ui/badge/badge.component';
import { ButtonComponent } from '../../../../shared/components/ui/button/button.component';
import { LoadingComponent } from '../../../../shared/components/ui/loading/loading.component';
import { EmptyStateComponent } from '../../../../shared/components/ui/empty-state/empty-state.component';
import { NotificationService } from '../../../../shared/components/feedback/notification.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { OrderService } from '../shared/order.service';
import { Order, OrderStatus, PaymentStatus } from '../shared/order.types';
import { ConfirmDialogComponent } from '../../../../shared/components/feedback/confirm-dialog/confirm-dialog.component';
import { DataFiltersComponent, FilterField } from '../../../../shared/components/data/filters/data-filters.component';

interface KanbanColumn {
  status: OrderStatus;
  label: string;
  color: string;
  orders: Order[];
}

@Component({
  selector: 'app-orders-kanban',
  standalone: true,
  imports: [
    CommonModule,
    DragDropModule,
    PageHeaderComponent,
    CardComponent,
    BadgeComponent,
    ButtonComponent,
    LoadingComponent,
    EmptyStateComponent,
    MatDialogModule,
    DataFiltersComponent
  ],
  templateUrl: './orders-kanban.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrdersKanbanComponent implements OnInit, OnDestroy {
  loading = false;
  searchValue = '';
  filters: any = {};
  
  // Expose enums to template
  PaymentStatus = PaymentStatus;
  
  columns: KanbanColumn[] = [
    { status: OrderStatus.PENDING, label: 'Pendente', color: 'yellow', orders: [] },
    { status: OrderStatus.CONFIRMED, label: 'Confirmado', color: 'blue', orders: [] },
    { status: OrderStatus.IN_PRODUCTION, label: 'Em Produção', color: 'orange', orders: [] },
    { status: OrderStatus.SHIPPED, label: 'Enviado', color: 'purple', orders: [] },
    { status: OrderStatus.DELIVERED, label: 'Entregue', color: 'green', orders: [] }
  ];

  cancelledOrders: Order[] = [];
  allOrders: Order[] = [];

  filterFields: FilterField[] = [
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
      label: 'Visualização Lista',
      icon: 'list',
      variant: 'secondary' as const,
      callback: () => this.navigateToList()
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
      this.allOrders = orders;
      this.organizeOrdersIntoColumns();
      this.cdr.markForCheck();
    });

    this.orderService.loading$.pipe(takeUntil(this.destroy$)).subscribe(loading => {
      this.loading = loading;
      this.cdr.markForCheck();
    });
  }

  loadOrders(): void {
    const params: any = {};

    if (this.searchValue) {
      params.search = this.searchValue;
    }

    Object.assign(params, this.filters);

    this.orderService.get(params).subscribe({
      next: (response) => {
        // Orders are already in items$ observable
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

  organizeOrdersIntoColumns(): void {
    // Reset all columns
    this.columns.forEach(column => column.orders = []);
    this.cancelledOrders = [];

    // Organize orders by status
    this.allOrders.forEach(order => {
      if (order.status === OrderStatus.CANCELLED) {
        this.cancelledOrders.push(order);
      } else {
        const column = this.columns.find(col => col.status === order.status);
        if (column) {
          column.orders.push(order);
        }
      }
    });
  }

  onDrop(event: CdkDragDrop<Order[]>): void {
    if (event.previousContainer === event.container) {
      // Reorder within same column
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      // Move to different column
      const order = event.previousContainer.data[event.previousIndex];
      const newStatus = this.getStatusFromContainer(event.container.id);
      
      if (this.canTransitionTo(order.status, newStatus)) {
        transferArrayItem(
          event.previousContainer.data,
          event.container.data,
          event.previousIndex,
          event.currentIndex
        );

        // Update order status in backend
        this.updateOrderStatus(order, newStatus);
      } else {
        this.notificationService.show({
          type: 'error',
          message: 'Transição de status inválida',
          title: 'Erro'
        });
        // Reload to restore original state
        this.organizeOrdersIntoColumns();
      }
    }
  }

  canTransitionTo(currentStatus: OrderStatus, newStatus: OrderStatus): boolean {
    // Basic validation - can be enhanced with backend validation
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      [OrderStatus.CONFIRMED]: [OrderStatus.IN_PRODUCTION, OrderStatus.CANCELLED],
      [OrderStatus.IN_PRODUCTION]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
      [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
      [OrderStatus.DELIVERED]: [],
      [OrderStatus.CANCELLED]: []
    };

    return validTransitions[currentStatus]?.includes(newStatus) || false;
  }

  getStatusFromContainer(containerId: string): OrderStatus {
    const column = this.columns.find(col => `column-${col.status}` === containerId);
    return column ? column.status : OrderStatus.PENDING;
  }

  updateOrderStatus(order: Order, newStatus: OrderStatus): void {
    this.orderService.updateStatus(order.id, newStatus).subscribe({
      next: () => {
        this.notificationService.show({
          type: 'success',
          message: 'Status atualizado com sucesso',
          title: 'Sucesso'
        });
        // Reload orders to get updated data
        this.loadOrders();
      },
      error: (error) => {
        this.notificationService.show({
          type: 'error',
          message: 'Erro ao atualizar status do pedido',
          title: 'Erro'
        });
        // Reload to restore original state
        this.loadOrders();
      }
    });
  }

  onSearchChange(search: string): void {
    this.searchValue = search;
    this.loadOrders();
  }

  onFilterToggle(): void {
    // Toggle filters visibility - handled by DataFiltersComponent
  }

  onFiltersChange(filters: any): void {
    this.filters = filters;
    this.loadOrders();
  }

  onRefresh(): void {
    this.loadOrders();
  }

  getConnectedColumns(): string[] {
    return this.columns.map(col => `column-${col.status}`);
  }

  navigateToList(): void {
    this.router.navigate(['/admin/orders/list']);
  }

  viewOrder(order: Order): void {
    this.router.navigate(['/admin/orders', order.id]);
  }

  markAsPaid(order: Order): void {
    if (order.payment_status === PaymentStatus.PAID) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Confirmar Pagamento',
        message: `Marcar o pedido "${order.order_number}" como pago?`,
        confirmText: 'Marcar como Pago',
        cancelText: 'Cancelar',
        type: 'info'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.confirmed) {
        this.orderService.markAsPaid(order.id).subscribe({
          next: () => {
            this.notificationService.show({
              type: 'success',
              message: 'Pedido marcado como pago',
              title: 'Sucesso'
            });
            this.loadOrders();
          },
          error: (error) => {
            this.notificationService.show({
              type: 'error',
              message: 'Erro ao marcar pedido como pago',
              title: 'Erro'
            });
          }
        });
      }
    });
  }

  getStatusColor(status: OrderStatus): string {
    const colors: Record<OrderStatus, string> = {
      [OrderStatus.PENDING]: 'yellow',
      [OrderStatus.CONFIRMED]: 'blue',
      [OrderStatus.IN_PRODUCTION]: 'orange',
      [OrderStatus.SHIPPED]: 'purple',
      [OrderStatus.DELIVERED]: 'green',
      [OrderStatus.CANCELLED]: 'red'
    };
    return colors[status] || 'gray';
  }

  getPaymentStatusColor(status: PaymentStatus): string {
    const colors: Record<PaymentStatus, string> = {
      [PaymentStatus.PENDING]: 'yellow',
      [PaymentStatus.PAID]: 'green',
      [PaymentStatus.FAILED]: 'red',
      [PaymentStatus.REFUNDED]: 'gray'
    };
    return colors[status] || 'gray';
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  getOrderAge(order: Order): number {
    if (!order.created_at) return 0;
    const created = new Date(order.created_at);
    const now = new Date();
    return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)); // days
  }

  isOverdue(order: Order): boolean {
    const age = this.getOrderAge(order);
    // Consider orders older than 7 days as potentially overdue (can be customized)
    return age > 7 && order.status !== OrderStatus.DELIVERED && order.status !== OrderStatus.CANCELLED;
  }
}

