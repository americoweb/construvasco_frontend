import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { PageHeaderComponent } from '../../../../shared/components/layout/page-header/page-header.component';
import { CardComponent } from '../../../../shared/components/ui/card/card.component';
import { BadgeComponent } from '../../../../shared/components/ui/badge/badge.component';
import { DataTableComponent, TableColumn } from '../../../../shared/components/data/table/data-table.component';
import { ButtonComponent } from '../../../../shared/components/ui/button/button.component';
import { LoadingComponent } from '../../../../shared/components/ui/loading/loading.component';
import { EmptyStateComponent } from '../../../../shared/components/ui/empty-state/empty-state.component';
import { NotificationService } from '../../../../shared/components/feedback/notification.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { OrderService } from '../shared/order.service';
import { Order, OrderItem, OrderStatusHistory, OrderStatus, PaymentStatus } from '../shared/order.types';
import { ConfirmDialogComponent } from '../../../../shared/components/feedback/confirm-dialog/confirm-dialog.component';
import { OrderStatusUpdateDialogComponent, OrderStatusUpdateDialogData, OrderStatusUpdateDialogResult } from '../components/order-status-update-dialog/order-status-update-dialog.component';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    PageHeaderComponent,
    CardComponent,
    BadgeComponent,
    DataTableComponent,
    ButtonComponent,
    LoadingComponent,
    EmptyStateComponent,
    MatDialogModule
  ],
  templateUrl: './order-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrderDetailComponent implements OnInit, OnDestroy {
  order: Order | null = null;
  items: OrderItem[] = [];
  statusHistory: OrderStatusHistory[] = [];
  loading = false;
  activeTab: 'info' | 'items' | 'history' = 'info';

  pageHeaderActions = [
    {
      label: 'Atualizar Status',
      icon: 'update',
      variant: 'primary' as const,
      callback: () => this.showStatusUpdateDialog()
    },
    {
      label: 'Marcar como Pago',
      icon: 'payment',
      variant: 'secondary' as const,
      callback: () => this.markAsPaid(),
      condition: () => this.order?.payment_status === PaymentStatus.PENDING
    }
  ];

  itemColumns: TableColumn[] = [
    { key: 'product_name', label: 'Produto', sortable: true },
    { key: 'color_name', label: 'Cor', sortable: true },
    { key: 'print_area_name', label: 'Área de Impressão', sortable: true },
    { key: 'quantity', label: 'Quantidade', sortable: true },
    { key: 'formatted_unit_price', label: 'Preço Unitário', sortable: false, format: (value: string) => value || '-' },
    { key: 'formatted_total', label: 'Total', sortable: false, format: (value: string) => value || '-' }
  ];

  historyColumns: TableColumn[] = [
    { key: 'new_status_label', label: 'Status', sortable: true },
    { key: 'previous_status_label', label: 'Status Anterior', sortable: true },
    { key: 'notes', label: 'Observações', sortable: false },
    { key: 'created_at', label: 'Data', sortable: true, format: (value: string) => this.formatDateTime(value) }
  ];

  breadcrumbs = [
    { label: 'Pedidos', url: '/admin/orders' },
    { label: 'Detalhes' }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private orderService: OrderService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private notificationService: NotificationService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = +params['id'];
      if (id) {
        this.loadOrder(id);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadOrder(id: number): void {
    this.loading = true;
    this.orderService.getOrderWithDetails(id).subscribe({
      next: (response) => {
        if (response.data) {
          this.order = response.data;
          this.items = response.data.items || [];
          this.statusHistory = response.data.status_history || [];
          this.breadcrumbs[1] = { label: `Pedido ${this.order.order_number}` };
        }
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.loading = false;
        this.notificationService.show({
          type: 'error',
          message: 'Erro ao carregar pedido',
          title: 'Erro'
        });
        this.router.navigate(['/admin/orders']);
        this.cdr.markForCheck();
      }
    });
  }

  setActiveTab(tab: 'info' | 'items' | 'history'): void {
    this.activeTab = tab;
    this.cdr.markForCheck();
  }

  showStatusUpdateDialog(): void {
    if (!this.order) return;

    const dialogRef = this.dialog.open(OrderStatusUpdateDialogComponent, {
      width: '500px',
      data: {
        currentStatus: this.order.status,
        orderNumber: this.order.order_number
      } as OrderStatusUpdateDialogData
    });

    dialogRef.afterClosed().subscribe((result: OrderStatusUpdateDialogResult | undefined) => {
      if (result && result.status) {
        this.orderService.updateStatus(this.order.id, result.status, result.notes).subscribe({
          next: (response) => {
            this.notificationService.show({
              type: 'success',
              message: 'Status do pedido atualizado com sucesso',
              title: 'Sucesso'
            });
            this.loadOrder(this.order!.id);
          },
          error: (error) => {
            this.notificationService.show({
              type: 'error',
              message: 'Erro ao atualizar status do pedido',
              title: 'Erro'
            });
          }
        });
      }
    });
  }

  markAsPaid(): void {
    if (!this.order) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Confirmar Pagamento',
        message: `Marcar o pedido "${this.order.order_number}" como pago?`,
        confirmText: 'Marcar como Pago',
        cancelText: 'Cancelar',
        type: 'info'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.confirmed) {
        this.orderService.markAsPaid(this.order.id).subscribe({
          next: (response) => {
            this.notificationService.show({
              type: 'success',
              message: 'Pedido marcado como pago com sucesso',
              title: 'Sucesso'
            });
            this.loadOrder(this.order!.id);
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

  cancelOrder(): void {
    if (!this.order || !this.order.can_be_cancelled) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Confirmar Cancelamento',
        message: `Tem certeza que deseja cancelar o pedido "${this.order.order_number}"?`,
        confirmText: 'Cancelar Pedido',
        cancelText: 'Não',
        type: 'danger'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.confirmed) {
        this.orderService.cancel(this.order.id).subscribe({
          next: () => {
            this.notificationService.show({
              type: 'success',
              message: 'Pedido cancelado com sucesso',
              title: 'Sucesso'
            });
            this.loadOrder(this.order!.id);
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

  formatDateTime(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

