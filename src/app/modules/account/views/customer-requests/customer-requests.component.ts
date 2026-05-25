import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
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
  imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule],
  templateUrl: './customer-requests.component.html',
  styleUrls: ['./customer-requests.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerRequestsComponent implements OnInit {
  loading = true;
  rows: ProjectRequest[] = [];
  filter: RequestFilter = 'all';
  searchQuery = '';

  readonly filters: { id: RequestFilter; label: string; icon: string }[] = [
    { id: 'all', label: 'Todos', icon: 'heroicons_outline:squares-2x2' },
    { id: 'active', label: 'Em curso', icon: 'heroicons_outline:arrow-path' },
    { id: 'completed', label: 'Concluídos', icon: 'heroicons_outline:check-badge' },
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

  onSearchInput(event: Event): void {
    this.searchQuery = (event.target as HTMLInputElement).value;
    this.cdr.markForCheck();
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.cdr.markForCheck();
  }

  get pendingQuotesCount(): number {
    return this.rows.filter((r) => this.hasPendingQuote(r)).length;
  }

  get activeCount(): number {
    return this.rows.filter((r) => matchesRequestFilter(r.status, 'active')).length;
  }

  get completedCount(): number {
    return this.rows.filter((r) => matchesRequestFilter(r.status, 'completed')).length;
  }

  filterCount(id: RequestFilter): number {
    if (id === 'all') {
      return this.rows.length;
    }
    return this.rows.filter((r) => matchesRequestFilter(r.status, id)).length;
  }

  get filteredRows(): ProjectRequest[] {
    let list = this.rows.filter((r) => matchesRequestFilter(r.status, this.filter));

    const q = this.searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (r) =>
          (r.title ?? '').toLowerCase().includes(q) ||
          (r.reference_code ?? '').toLowerCase().includes(q) ||
          projectTypeLabel(r.project_type).toLowerCase().includes(q)
      );
    }

    return [...list].sort((a, b) => {
      const aPending = this.hasPendingQuote(a) ? 1 : 0;
      const bPending = this.hasPendingQuote(b) ? 1 : 0;
      if (bPending !== aPending) {
        return bPending - aPending;
      }
      const da = a.submitted_at ?? '';
      const db = b.submitted_at ?? '';
      return db.localeCompare(da);
    });
  }

  hasPendingQuote(req: ProjectRequest): boolean {
    return !!this.pendingQuoteId(req);
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

  statusAccentClass(r: ProjectRequest): string {
    switch (r.status) {
      case 'quoted':
        return 'req-card--accent-warn';
      case 'converted':
        return 'req-card--accent-success';
      case 'cancelled':
        return 'req-card--accent-muted';
      default:
        return 'req-card--accent-primary';
    }
  }

  typeLabel(r: ProjectRequest): string {
    return projectTypeLabel(r.project_type);
  }
}
