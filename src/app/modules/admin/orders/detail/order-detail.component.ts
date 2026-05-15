import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { PageHeaderComponent } from '../../../../shared/components/layout/page-header/page-header.component';
import { LoadingComponent } from '../../../../shared/components/ui/loading/loading.component';
import { NotificationService } from '../../../../shared/components/feedback/notification.service';
import { OrderService } from '../shared/order.service';
import { Order, PaymentStatus } from '../shared/order.types';
import { OrderDetailPanelComponent } from '../components/order-detail-panel/order-detail-panel.component';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [
    CommonModule,
    PageHeaderComponent,
    LoadingComponent,
    OrderDetailPanelComponent,
  ],
  templateUrl: './order-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderDetailComponent implements OnInit, OnDestroy {
  @ViewChild(OrderDetailPanelComponent) orderPanel?: OrderDetailPanelComponent;

  order: Order | null = null;
  loading = false;

  pageHeaderActions = [
    {
      label: 'Atualizar Status',
      icon: 'update',
      variant: 'primary' as const,
      callback: () => this.orderPanel?.showStatusUpdateDialog(),
    },
    {
      label: 'Marcar como Pago',
      icon: 'payment',
      variant: 'secondary' as const,
      callback: () => this.orderPanel?.markAsPaid(),
      condition: () => this.order?.payment_status === PaymentStatus.PENDING,
    },
  ];

  breadcrumbs = [{ label: 'Pedidos', url: '/admin/orders' }, { label: 'Detalhes' }];

  private destroy$ = new Subject<void>();

  constructor(
    private orderService: OrderService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
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
          this.breadcrumbs[1] = { label: `Pedido ${this.order.order_number}` };
          this.maybeRedirectToJobCard();
        }
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.notificationService.show({
          type: 'error',
          message: 'Erro ao carregar pedido',
          title: 'Erro',
        });
        this.router.navigate(['/admin/orders']);
        this.cdr.markForCheck();
      },
    });
  }

  /**
   * Operational cockpit defaults to the job card when a link exists.
   * Use `?stay=1` on the URL to keep the legacy order-only view (auditing, bookmarks).
   */
  private maybeRedirectToJobCard(): void {
    const stay = this.route.snapshot.queryParamMap.get('stay');
    if (stay === '1') return;
    const jcId = this.order?.job_card_id;
    if (!jcId || !this.order) return;
    this.router.navigate(['/admin/job-cards', jcId], {
      queryParams: { tab: 'pedido' },
      replaceUrl: true,
    });
  }

  onOrderUpdated(next: Order): void {
    this.order = next;
    this.breadcrumbs[1] = { label: `Pedido ${next.order_number}` };
    this.cdr.markForCheck();
  }
}
