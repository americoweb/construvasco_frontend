import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Subject, takeUntil, forkJoin, of, catchError } from 'rxjs';
import { PageHeaderComponent } from '../../../shared/components/layout/page-header/page-header.component';
import { AdminDashboardService, AdminDashboardStats } from './admin-dashboard.service';
import { OrderService } from '../orders/shared/order.service';
import { Order } from '../orders/shared/order.types';
import { ApiResponse } from '../../../core/models/api.types';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, PageHeaderComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  loading = true;
  stats: AdminDashboardStats | null = null;
  recentOrders: Order[] = [];

  private _destroy$ = new Subject<void>();

  constructor(
    private adminDashboardService: AdminDashboardService,
    private orderService: OrderService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.load();
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  private load(): void {
    this.loading = true;
    this.cdr.markForCheck();

    forkJoin({
      stats: this.adminDashboardService.getStats().pipe(
        catchError(() => of({ data: undefined } as ApiResponse<AdminDashboardStats>))
      ),
      orders: this.orderService.get({ page: 1, per_page: 5 }).pipe(
        catchError(() => of({ data: [] } as ApiResponse<Order[]>))
      )
    })
      .pipe(takeUntil(this._destroy$))
      .subscribe({
        next: ({ stats, orders }) => {
          this.stats = stats.data ?? null;
          this.recentOrders = (orders.data || orders.items || []) as Order[];
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.stats = null;
          this.recentOrders = [];
          this.loading = false;
          this.cdr.markForCheck();
        }
      });
  }

  openOrder(order: Order): void {
    this.router.navigate(['/admin/orders', order.id]);
  }

  formatDate(value: string | undefined): string {
    if (!value) {
      return '—';
    }
    return new Date(value).toLocaleString('pt-MZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
