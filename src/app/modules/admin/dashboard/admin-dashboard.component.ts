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
import {
  AdminDashboardService,
  AdminDashboardStats,
  AdminProjectSummary,
} from './admin-dashboard.service';
import { PendingPaymentRow } from '../../../shared/construction/construction.types';
import { formatMoneyMt } from '../../../shared/construction/payment.util';
import { ApiResponse } from '../../../core/models/api.types';
import { UserService } from '../../../core/auth/services/user.service';

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
  recentProjects: AdminProjectSummary[] = [];
  userRole = '';
  isTechnician = false;
  isManager = false;
  pendingPayments: PendingPaymentRow[] = [];
  pendingPaymentsCount = 0;
  pendingConstructionQuotesCount = 0;
  pendingConstructionQuotes: { id: number; name?: string; client?: { name?: string } }[] = [];

  today = new Date().toLocaleDateString('pt-MZ', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
  });

  private _destroy$ = new Subject<void>();

  constructor(
    private adminDashboardService: AdminDashboardService,
    private userService: UserService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.userRole = String(this.userService.user?.current_tenant_context?.role ?? '').toLowerCase().trim();
    this.isTechnician = ['technician', 'designer', 'tecnico', 'desenhista'].includes(this.userRole);
    this.isManager = ['admin', 'project_manager', 'gestor'].includes(this.userRole);
  }

  ngOnInit(): void {
    this.load();
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  private load(): void {
    this.userRole = String(this.userService.user?.current_tenant_context?.role ?? '')
      .toLowerCase()
      .trim();
    this.isTechnician = ['technician', 'designer', 'tecnico', 'desenhista'].includes(this.userRole);
    this.isManager = ['admin', 'project_manager', 'gestor'].includes(this.userRole);

    this.loading = true;
    this.cdr.markForCheck();

    forkJoin({
      stats: this.adminDashboardService.getStats(this.userRole).pipe(
        catchError(() =>
          of({
            data: null,
            pending_payments: [],
            pending_construction_quote_requests_count: 0,
            pending_construction_quote_requests: [],
          })
        )
      ),
      projects: this.adminDashboardService.getRecentProjects(this.userRole).pipe(
        catchError(() => of({ data: [] }))
      )
    })
      .pipe(takeUntil(this._destroy$))
      .subscribe({
        next: ({ stats, projects }) => {
          this.stats = stats.data ?? null;
          this.pendingPaymentsCount =
            stats.data?.pending_payments_count ?? stats.data?.payments_pending ?? 0;
          this.pendingPayments = (stats.pending_payments ?? []).slice(0, 5);
          this.pendingConstructionQuotesCount = stats.pending_construction_quote_requests_count ?? 0;
          this.pendingConstructionQuotes = (stats.pending_construction_quote_requests ?? []).slice(0, 5);
          const list = projects.data ?? [];
          this.recentProjects = list.slice(0, 8);
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.stats = null;
          this.recentProjects = [];
          this.loading = false;
          this.cdr.markForCheck();
        }
      });
  }

  projectLabel(project: AdminProjectSummary): string {
    return project.title || project.name || `Projecto #${project.id}`;
  }

  formatMoney(value?: number | string): string {
    return formatMoneyMt(value);
  }

  paymentClientLabel(row: PendingPaymentRow): string {
    return row.user?.name || row.project?.client?.name || 'Cliente';
  }

  formatDate(value: string | undefined): string {
    if (!value) { return '—'; }
    return new Date(value).toLocaleDateString('pt-MZ', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  }
}
