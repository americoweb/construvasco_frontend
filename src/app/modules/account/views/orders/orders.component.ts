import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { OrderService } from '../../../../modules/admin/orders/shared/order.service';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrdersComponent implements OnInit, OnDestroy {
  activeTab = 'todos';
  orders: any[] = [];
  filteredOrders: any[] = [];
  searchTerm = '';
  isLoading = false;

  tabs = [
    { id: 'todos', label: 'Todos' },
    { id: 'pendente', label: 'Pendente' },
    { id: 'producao', label: 'Em Produção' },
    { id: 'enviado', label: 'Enviado' },
    { id: 'concluido', label: 'Concluído' },
    { id: 'cancelado', label: 'Cancelado' }
  ];

  private _unsubscribeAll = new Subject<void>();

  constructor(
    private orderService: OrderService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
  }

  loadOrders(): void {
    this.isLoading = true;
    this.orderService.getUserOrders(1, 50)
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe({
        next: (response) => {
          this.orders = response.data || [];
          this.filterOrders();
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Failed to load orders:', error);
          this.orders = [];
          this.filteredOrders = [];
          this.isLoading = false;
          this.cdr.markForCheck();
        }
      });
  }

  setActiveTab(tabId: string): void {
    this.activeTab = tabId;
    this.filterOrders();
  }

  filterOrders(): void {
    let filtered = [...this.orders];

    // Filter by status
    if (this.activeTab !== 'todos') {
      const statusMap: { [key: string]: string } = {
        'pendente': 'pending',
        'producao': 'in_production',
        'enviado': 'shipped',
        'concluido': 'delivered',
        'cancelado': 'cancelled'
      };
      const status = statusMap[this.activeTab];
      if (status) {
        filtered = filtered.filter(order => order.status === status);
      }
    }

    // Filter by search term
    if (this.searchTerm.trim()) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(order => 
        order.order_number?.toLowerCase().includes(search) ||
        order.shipping_name?.toLowerCase().includes(search) ||
        order.billing_email?.toLowerCase().includes(search)
      );
    }

    this.filteredOrders = filtered;
    this.cdr.markForCheck();
  }
}

