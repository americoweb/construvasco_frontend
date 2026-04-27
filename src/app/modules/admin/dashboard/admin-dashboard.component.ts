import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Subject, takeUntil, forkJoin, of, catchError } from 'rxjs';
import { PageHeaderComponent } from '../../../shared/components/layout/page-header/page-header.component';
import { AdminDashboardService, AdminDashboardStats } from './admin-dashboard.service';
import { JobCardService } from '../job-cards/shared/job-card.service';
import { JobCard, JobCardStatus } from '../job-cards/shared/job-card.types';
import { ApiResponse } from '../../../core/models/api.types';
import { UserService } from '../../../core/auth/services/user.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, NgClass, RouterLink, PageHeaderComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  loading = true;
  stats: AdminDashboardStats | null = null;
  recentJobCards: JobCard[] = [];
  userRole: string = '';

  today = new Date().toLocaleDateString('pt-MZ', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
  });

  private _destroy$ = new Subject<void>();

  constructor(
    private adminDashboardService: AdminDashboardService,
    private jobCardService: JobCardService,
    private userService: UserService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.userRole = String(this.userService.user?.current_tenant_context?.role ?? '').toLowerCase().trim();
  }

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
      jobCards: this.jobCardService.get({ page: 1, per_page: 8 }).pipe(
        catchError(() => of({ data: [] } as ApiResponse<JobCard[]>))
      )
    })
      .pipe(takeUntil(this._destroy$))
      .subscribe({
        next: ({ stats, jobCards }) => {
          this.stats = stats.data ?? null;
          this.recentJobCards = ((jobCards as any).data || (jobCards as any).items || []) as JobCard[];
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.stats = null;
          this.recentJobCards = [];
          this.loading = false;
          this.cdr.markForCheck();
        }
      });
  }

  openJobCard(jc: JobCard): void {
    this.router.navigate(['/admin/job-cards', jc.id]);
  }

  statusClass(status: JobCardStatus): Record<string, boolean> {
    const map: Record<JobCardStatus, string> = {
      [JobCardStatus.DRAFT]:      'bg-gray-100 text-gray-600',
      [JobCardStatus.BRIEFING]:   'bg-blue-100 text-blue-700',
      [JobCardStatus.DESIGN]:     'bg-purple-100 text-purple-700',
      [JobCardStatus.REVISION]:   'bg-yellow-100 text-yellow-700',
      [JobCardStatus.APPROVAL]:   'bg-amber-100 text-amber-700',
      [JobCardStatus.PRODUCTION]: 'bg-indigo-100 text-indigo-700',
      [JobCardStatus.DONE]:       'bg-green-100 text-green-700',
      [JobCardStatus.CANCELLED]:  'bg-red-100 text-red-700',
    };
    const cls = map[status] ?? 'bg-gray-100 text-gray-600';
    return cls.split(' ').reduce((acc, c) => ({ ...acc, [c]: true }), {});
  }

  formatDate(value: string | undefined): string {
    if (!value) { return '—'; }
    return new Date(value).toLocaleDateString('pt-MZ', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  }
}
