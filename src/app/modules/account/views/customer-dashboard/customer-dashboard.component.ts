import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { forkJoin } from 'rxjs';
import { UserService } from '../../../../core/auth/services/user.service';
import { CustomerPortalService } from '../../../../shared/construction/customer-portal.service';
import { CustomerDashboard, ProjectRequest } from '../../../../shared/construction/construction.types';
import {
  projectTypeLabel,
  requestStatusBadgeClass,
  requestStatusLabel,
} from '../../../../shared/construction/request-status.util';

@Component({
  selector: 'app-customer-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './customer-dashboard.component.html',
  styleUrls: ['./customer-dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerDashboardComponent implements OnInit {
  loading = true;
  firstName = 'Cliente';
  stats: CustomerDashboard | null = null;
  recentRequests: ProjectRequest[] = [];

  constructor(
    private portal: CustomerPortalService,
    private userService: UserService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const fullName = this.userService.user?.name ?? 'Cliente';
    this.firstName = fullName.trim().split(/\s+/)[0] || 'Cliente';

    forkJoin({
      dashboard: this.portal.dashboard(),
      requests: this.portal.listRequests(),
    }).subscribe({
      next: ({ dashboard, requests }) => {
        this.stats = dashboard.data;
        this.recentRequests = (requests.data ?? [])
          .filter((r) => r.status !== 'draft')
          .sort((a, b) => {
            const da = a.submitted_at ?? a.reviewed_at ?? '';
            const db = b.submitted_at ?? b.reviewed_at ?? '';
            return db.localeCompare(da);
          })
          .slice(0, 3);
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  statusLabel(r: ProjectRequest): string {
    return requestStatusLabel(r.status);
  }

  statusClass(r: ProjectRequest): string {
    return requestStatusBadgeClass(r.status);
  }

  typeLabel(r: ProjectRequest): string {
    return projectTypeLabel(r.project_type);
  }

  hasNewQuote(r: ProjectRequest): boolean {
    return !!(r.quotes ?? []).some((q) => q.status === 'sent');
  }
}
