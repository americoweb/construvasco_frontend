import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import {
  MatPaginatorIntl,
  MatPaginatorModule,
  PageEvent,
} from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { OrderService } from '../../../../modules/admin/orders/shared/order.service';
import { AppMatPaginatorIntl } from '../../../../shared/components/data/pagination/app-mat-paginator-intl';
import { PaginationInfo } from '../../../../core/models/api.types';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
  ],
  providers: [{ provide: MatPaginatorIntl, useClass: AppMatPaginatorIntl }],
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdersComponent implements OnInit, OnDestroy {
  activeTab = 'todos';
  orders: any[] = [];
  searchTerm = '';
  isLoading = false;

  pageIndex = 0;
  pageSize = 8;
  totalCount = 0;

  readonly pageSizeOptions = [8, 16, 24];

  readonly tabs = [
    { id: 'todos', label: 'Todos' },
    { id: 'pendente', label: 'Pendente' },
    { id: 'producao', label: 'Em produção' },
    { id: 'enviado', label: 'Enviado' },
    { id: 'concluido', label: 'Concluído' },
    { id: 'cancelado', label: 'Cancelado' },
  ];

  private readonly search$ = new Subject<string>();
  private readonly _unsubscribeAll = new Subject<void>();

  constructor(
    private orderService: OrderService,
    private cdr: ChangeDetectorRef
  ) {}

  get activeTabIndex(): number {
    const idx = this.tabs.findIndex((tab) => tab.id === this.activeTab);
    return idx >= 0 ? idx : 0;
  }

  ngOnInit(): void {
    this.search$
      .pipe(debounceTime(380), distinctUntilChanged(), takeUntil(this._unsubscribeAll))
      .subscribe(() => {
        this.pageIndex = 0;
        this.loadOrders();
      });
    this.loadOrders();
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
  }

  onSearchInput(value: string): void {
    this.searchTerm = value;
    this.search$.next(value);
  }

  setActiveTab(tabId: string): void {
    if (this.activeTab === tabId) {
      return;
    }
    this.activeTab = tabId;
    this.pageIndex = 0;
    this.loadOrders();
  }

  setActiveTabByIndex(index: number): void {
    const tab = this.tabs[index];
    if (!tab) {
      return;
    }
    this.setActiveTab(tab.id);
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadOrders();
  }

  loadOrders(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    const status = this.tabToApiStatus(this.activeTab);
    const page = this.pageIndex + 1;

    this.orderService
      .getUserOrders(page, this.pageSize, {
        status,
        search: this.searchTerm.trim() || undefined,
      })
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe({
        next: (response) => {
          this.orders = response.data ?? [];
          this.applyMeta(response.meta);
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.orders = [];
          this.totalCount = 0;
          this.isLoading = false;
          this.cdr.markForCheck();
        },
      });
  }

  chipFor(order: any): Record<string, boolean> {
    const status = String(order?.status ?? '');
    return {
      chip: true,
      'chip--pending': status === 'pending',
      'chip--producao':
        status === 'in_production' ||
        status === 'confirmed' ||
        status === 'triaged' ||
        status === 'assigned' ||
        status === 'in_design' ||
        status === 'awaiting_client' ||
        status === 'approved' ||
        status === 'in_execution',
      'chip--enviado': status === 'shipped',
      'chip--concluido': status === 'delivered',
      'chip--cancelado': status === 'cancelled',
    };
  }

  itemPreviewLines(order: any): string[] {
    const items = order?.items ?? [];
    if (!items.length) {
      return [];
    }
    return items.slice(0, 2).map((it: any) => {
      const name = it.product_name ?? 'Item';
      const qty = it.quantity ?? 0;
      return `${qty}× ${name}`;
    });
  }

  moreItemsCount(order: any): number {
    const n = order?.items?.length ?? 0;
    return n > 2 ? n - 2 : 0;
  }

  private tabToApiStatus(tabId: string): string | undefined {
    if (tabId === 'todos') {
      return undefined;
    }
    const map: Record<string, string> = {
      pendente: 'pending',
      producao: 'in_production',
      enviado: 'shipped',
      concluido: 'delivered',
      cancelado: 'cancelled',
    };
    return map[tabId];
  }

  private applyMeta(meta: PaginationInfo | undefined): void {
    if (!meta) {
      this.totalCount = this.orders.length;
      return;
    }
    this.totalCount = meta.total ?? this.orders.length;
  }
}
