/**
 * Admin order cockpit (embedded in Job Card detail or full Order detail page).
 *
 * Domain rule: OrderStatus transitions (payment, shipping, triage) are driven only by
 * Order APIs here; JobCardStatus remains on the Job Card tab — avoid updating both from
 * one UI action unless the backend explicitly synchronises them.
 */
import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CardComponent } from '../../../../../shared/components/ui/card/card.component';
import { BadgeComponent } from '../../../../../shared/components/ui/badge/badge.component';
import { DataTableComponent, TableColumn } from '../../../../../shared/components/data/table/data-table.component';
import { ButtonComponent } from '../../../../../shared/components/ui/button/button.component';
import { NotificationService } from '../../../../../shared/components/feedback/notification.service';
import { OrderService } from '../../shared/order.service';
import { Order, OrderItem, OrderStatusHistory, OrderStatus, PaymentStatus } from '../../shared/order.types';
import { ConfirmDialogComponent } from '../../../../../shared/components/feedback/confirm-dialog/confirm-dialog.component';
import {
  OrderStatusUpdateDialogComponent,
  OrderStatusUpdateDialogData,
  OrderStatusUpdateDialogResult,
} from '../order-status-update-dialog/order-status-update-dialog.component';

@Component({
  selector: 'app-order-detail-panel',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CardComponent,
    BadgeComponent,
    DataTableComponent,
    ButtonComponent,
    MatDialogModule,
  ],
  templateUrl: './order-detail-panel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderDetailPanelComponent {
  @Input({ required: true }) order!: Order;

  /** When true, shows a short hint that this view is the unified cockpit inside a job card. */
  @Input() embedded = false;

  @Output() orderUpdated = new EventEmitter<Order>();

  activeTab: 'info' | 'items' | 'history' = 'info';

  itemColumns: TableColumn[] = [
    { key: 'product_name', label: 'Produto', sortable: true },
    { key: 'color_name', label: 'Cor', sortable: true },
    { key: 'print_area_name', label: 'Área de Impressão', sortable: true },
    { key: 'quantity', label: 'Quantidade', sortable: true },
    { key: 'formatted_unit_price', label: 'Preço Unitário', sortable: false, format: (value: string) => value || '-' },
    { key: 'formatted_total', label: 'Total', sortable: false, format: (value: string) => value || '-' },
  ];

  historyColumns: TableColumn[] = [
    { key: 'new_status_label', label: 'Status', sortable: true },
    { key: 'previous_status_label', label: 'Status Anterior', sortable: true },
    { key: 'notes', label: 'Observações', sortable: false },
    { key: 'created_at', label: 'Data', sortable: true, format: (value: string) => this.formatDateTime(value) },
  ];

  panelActions = [
    {
      label: 'Atualizar Status',
      icon: 'update',
      variant: 'primary' as const,
      callback: () => this.showStatusUpdateDialog(),
    },
    {
      label: 'Marcar como Pago',
      icon: 'payment',
      variant: 'secondary' as const,
      callback: () => this.markAsPaid(),
      condition: () => this.order?.payment_status === PaymentStatus.PENDING,
    },
  ];

  constructor(
    private orderService: OrderService,
    private cdr: ChangeDetectorRef,
    private notificationService: NotificationService,
    private dialog: MatDialog
  ) {}

  get items(): OrderItem[] {
    return this.order?.items ?? [];
  }

  get statusHistory(): OrderStatusHistory[] {
    return this.order?.status_history ?? [];
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
        orderNumber: this.order.order_number,
      } as OrderStatusUpdateDialogData,
    });

    dialogRef.afterClosed().subscribe((result: OrderStatusUpdateDialogResult | undefined) => {
      if (result && result.status && this.order) {
        this.orderService.updateStatus(this.order.id, result.status, result.notes).subscribe({
          next: (response) => {
            if (response.data) {
              this.notificationService.show({
                type: 'success',
                message: 'Status do pedido atualizado com sucesso',
                title: 'Sucesso',
              });
              this.orderUpdated.emit(response.data);
            }
          },
          error: () => {
            this.notificationService.show({
              type: 'error',
              message: 'Erro ao atualizar status do pedido',
              title: 'Erro',
            });
          },
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
        type: 'info',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.confirmed && this.order) {
        this.orderService.markAsPaid(this.order.id).subscribe({
          next: (response) => {
            if (response.data) {
              this.notificationService.show({
                type: 'success',
                message: 'Pedido marcado como pago com sucesso',
                title: 'Sucesso',
              });
              this.orderUpdated.emit(response.data);
            }
          },
          error: () => {
            this.notificationService.show({
              type: 'error',
              message: 'Erro ao marcar pedido como pago',
              title: 'Erro',
            });
          },
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
        type: 'danger',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.confirmed && this.order) {
        this.orderService.cancel(this.order.id).subscribe({
          next: () => {
            this.notificationService.show({
              type: 'success',
              message: 'Pedido cancelado com sucesso',
              title: 'Sucesso',
            });
            this.orderService.getOrderWithDetails(this.order!.id).subscribe({
              next: (r) => {
                if (r.data) this.orderUpdated.emit(r.data);
              },
            });
          },
          error: () => {
            this.notificationService.show({
              type: 'error',
              message: 'Erro ao cancelar pedido',
              title: 'Erro',
            });
          },
        });
      }
    });
  }

  getStatusColor(status: OrderStatus): string {
    const colors: Partial<Record<OrderStatus, string>> = {
      [OrderStatus.PENDING]: 'yellow',
      [OrderStatus.TRIAGED]: 'blue',
      [OrderStatus.ASSIGNED]: 'indigo',
      [OrderStatus.IN_DESIGN]: 'purple',
      [OrderStatus.AWAITING_CLIENT]: 'orange',
      [OrderStatus.APPROVED]: 'teal',
      [OrderStatus.IN_EXECUTION]: 'cyan',
      [OrderStatus.CONFIRMED]: 'blue',
      [OrderStatus.IN_PRODUCTION]: 'orange',
      [OrderStatus.SHIPPED]: 'purple',
      [OrderStatus.DELIVERED]: 'green',
      [OrderStatus.CANCELLED]: 'red',
    };
    return colors[status] || 'gray';
  }

  getPaymentStatusColor(status: PaymentStatus): string {
    const colors: Record<PaymentStatus, string> = {
      [PaymentStatus.PENDING]: 'yellow',
      [PaymentStatus.PAID]: 'green',
      [PaymentStatus.FAILED]: 'red',
      [PaymentStatus.REFUNDED]: 'gray',
    };
    return colors[status] || 'gray';
  }

  badgeColorForOrder(): string {
    return this.order.status_color || this.getStatusColor(this.order.status);
  }

  badgeColorForPayment(): string {
    return this.order.payment_status_color || this.getPaymentStatusColor(this.order.payment_status);
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
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
      minute: '2-digit',
    });
  }
}
