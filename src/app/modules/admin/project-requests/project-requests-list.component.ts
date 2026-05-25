import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ProjectRequestService } from '../../../shared/construction/project-request.service';
import { ProjectRequest } from '../../../shared/construction/construction.types';

export type StaffRequestFilter = '' | 'attention' | 'review' | 'quoted' | 'closed';

@Component({
  selector: 'app-project-requests-list',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule],
  templateUrl: './project-requests-list.component.html',
  styleUrls: ['./project-requests-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectRequestsListComponent implements OnInit {
  loading = true;
  pageReady = false;
  rows: ProjectRequest[] = [];
  filtered: ProjectRequest[] = [];
  searchText = '';
  statusFilter: StaffRequestFilter = '';

  readonly filterPills: { id: StaffRequestFilter; label: string }[] = [
    { id: '', label: 'Todos' },
    { id: 'attention', label: 'Atenção' },
    { id: 'review', label: 'Em análise' },
    { id: 'quoted', label: 'Orçamentados' },
    { id: 'closed', label: 'Fechados' },
  ];

  readonly statusOptions = [
    { value: 'submitted', label: 'Submetido' },
    { value: 'under_review', label: 'Em análise' },
    { value: 'quoted', label: 'Orçamentado' },
    { value: 'quote_rejected', label: 'Orçamento recusado' },
    { value: 'approved', label: 'Aprovado' },
    { value: 'rejected', label: 'Recusado' },
    { value: 'converted_to_project', label: 'Convertido' },
  ];

  constructor(
    private requests: ProjectRequestService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.requests.listManager().subscribe({
      next: (res) => {
        this.rows = res.data ?? [];
        this.applyFilter();
        this.loading = false;
        this.pageReady = true;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.pageReady = true;
        this.cdr.markForCheck();
      },
    });
  }

  get attentionCount(): number {
    return this.rows.filter((r) => r.status === 'quote_rejected').length;
  }

  get inReviewCount(): number {
    return this.rows.filter((r) => r.status === 'submitted' || r.status === 'under_review').length;
  }

  get quotedCount(): number {
    return this.rows.filter((r) => r.status === 'quoted').length;
  }

  setStatusFilter(id: StaffRequestFilter): void {
    this.statusFilter = id;
    this.applyFilter();
    this.cdr.markForCheck();
  }

  onSearchInput(event: Event): void {
    this.searchText = (event.target as HTMLInputElement).value;
    this.applyFilter();
    this.cdr.markForCheck();
  }

  clearSearch(): void {
    this.searchText = '';
    this.applyFilter();
    this.cdr.markForCheck();
  }

  countForFilter(id: StaffRequestFilter): number {
    return this.rows.filter((r) => this.matchesStatusFilter(r, id)).length;
  }

  applyFilter(): void {
    const q = this.searchText.trim().toLowerCase();
    this.filtered = this.rows.filter((r) => {
      if (!this.matchesStatusFilter(r, this.statusFilter)) return false;
      if (!q) return true;
      const client = (r.user?.name ?? r.user?.identifier ?? '').toLowerCase();
      return (
        String(r.reference_code ?? '').toLowerCase().includes(q) ||
        String(r.title ?? '').toLowerCase().includes(q) ||
        client.includes(q)
      );
    });
  }

  private matchesStatusFilter(r: ProjectRequest, filter: StaffRequestFilter): boolean {
    if (!filter) return true;
    const s = r.status;
    switch (filter) {
      case 'attention':
        return s === 'quote_rejected';
      case 'review':
        return s === 'submitted' || s === 'under_review';
      case 'quoted':
        return s === 'quoted';
      case 'closed':
        return s === 'approved' || s === 'rejected' || s === 'converted_to_project';
      default:
        return true;
    }
  }

  statusLabel(status?: string): string {
    return this.statusOptions.find((s) => s.value === status)?.label ?? status ?? '—';
  }
}
