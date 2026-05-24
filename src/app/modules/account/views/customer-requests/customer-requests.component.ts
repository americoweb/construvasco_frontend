import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CustomerPortalService } from '../../../../shared/construction/customer-portal.service';
import { ProjectRequest } from '../../../../shared/construction/construction.types';
import {
  matchesRequestFilter,
  projectTypeLabel,
  RequestFilter,
  requestStatusBadgeClass,
  requestStatusLabel,
} from '../../../../shared/construction/request-status.util';

@Component({
  selector: 'app-customer-requests',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './customer-requests.component.html',
  styleUrls: ['./customer-requests.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerRequestsComponent implements OnInit {
  loading = true;
  rows: ProjectRequest[] = [];
  filter: RequestFilter = 'all';

  readonly filters: { id: RequestFilter; label: string }[] = [
    { id: 'all', label: 'Todos' },
    { id: 'active', label: 'Em curso' },
    { id: 'completed', label: 'Concluídos' },
  ];

  constructor(
    private portal: CustomerPortalService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.portal.listRequests().subscribe({
      next: (res) => {
        this.rows = (res.data ?? []).filter((r) => r.status !== 'draft');
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  setFilter(id: RequestFilter): void {
    this.filter = id;
    this.cdr.markForCheck();
  }

  get filteredRows(): ProjectRequest[] {
    return this.rows.filter((r) => matchesRequestFilter(r.status, this.filter));
  }

  pendingQuoteId(req: ProjectRequest): number | null {
    const sent = (req.quotes ?? []).find((q) => q.status === 'sent');
    return sent?.id ?? null;
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
}
