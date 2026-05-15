import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UserService } from '../../../../core/auth/services/user.service';
import { User } from '../../../../core/auth/models/user.interface';
import { OrderService } from '../../../../modules/admin/orders/shared/order.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit, OnDestroy {
  user: User | null = null;
  stats = {
    totalOrders: 0,
    pendingOrders: 0,
    savedDesigns: 0,
    addresses: 0
  };
  recentOrders: any[] = [];
  isLoading = false;

  private _unsubscribeAll = new Subject<void>();

  constructor(
    private userService: UserService,
    private orderService: OrderService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.userService.user$
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((user: User | null) => {
        this.user = user;
        this.cdr.markForCheck();
      });

    this.loadStats();
    this.loadRecentOrders();
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
  }

  private loadStats(): void {
    this.isLoading = true;
    this.orderService.getUserOrders(1, 100)
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe({
        next: (response) => {
          const orders = response.data || [];
          
          // Calculate stats from orders
          this.stats.totalOrders = orders.length;
          this.stats.pendingOrders = orders.filter((order: any) => 
            order.status === 'pending'
          ).length;
          
          // TODO: contagem de projectos/documentos e endereços quando API existir
          // For now, set to 0
          this.stats.savedDesigns = 0;
          this.stats.addresses = 0;
          
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Failed to load stats:', error);
          this.isLoading = false;
          this.cdr.markForCheck();
        }
      });
  }

  private loadRecentOrders(): void {
    this.orderService.getUserOrders(1, 5)
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe({
        next: (response) => {
          this.recentOrders = (response.data || []).slice(0, 5);
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Failed to load recent orders:', error);
          this.recentOrders = [];
          this.cdr.markForCheck();
        }
      });
  }
}

