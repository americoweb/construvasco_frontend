import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CustomerPortalService } from '../../../../shared/construction/customer-portal.service';
import { ConstructionProject } from '../../../../shared/construction/construction.types';
import { projectPhaseLabel } from '../../../../shared/construction/contract-phase.util';
import { projectTypeLabel } from '../../../../shared/construction/request-status.util';

export type ProjectFilter = 'all' | 'active' | 'completed';

@Component({
  selector: 'app-customer-projects',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule],
  templateUrl: './customer-projects.component.html',
  styleUrls: ['./customer-projects.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerProjectsComponent implements OnInit {
  loading = true;
  rows: ConstructionProject[] = [];
  filter: ProjectFilter = 'all';
  searchQuery = '';

  readonly filters: { id: ProjectFilter; label: string; icon: string }[] = [
    { id: 'all', label: 'Todos', icon: 'heroicons_outline:squares-2x2' },
    { id: 'active', label: 'Em curso', icon: 'heroicons_outline:arrow-path' },
    { id: 'completed', label: 'Concluídos', icon: 'heroicons_outline:check-badge' },
  ];

  constructor(
    private portal: CustomerPortalService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.portal.listProjects().subscribe({
      next: (res) => {
        this.rows = (res.data ?? []).sort((a, b) => {
          const ua = a.updated_at ?? '';
          const ub = b.updated_at ?? '';
          return ub.localeCompare(ua);
        });
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  setFilter(id: ProjectFilter): void {
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

  filterCount(id: ProjectFilter): number {
    return this.rows.filter((p) => this.matchesFilter(p, id)).length;
  }

  get inProgressCount(): number {
    return this.rows.filter((p) => this.matchesFilter(p, 'active')).length;
  }

  get completedCount(): number {
    return this.rows.filter((p) => this.matchesFilter(p, 'completed')).length;
  }

  get constructionCount(): number {
    return this.rows.filter((p) => p.contract_phase === 'construction').length;
  }

  get filteredRows(): ConstructionProject[] {
    let list = this.rows.filter((p) => this.matchesFilter(p, this.filter));

    const q = this.searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          (p.name ?? '').toLowerCase().includes(q) ||
          this.reference(p).toLowerCase().includes(q) ||
          (p.location ?? '').toLowerCase().includes(q) ||
          projectTypeLabel(p.project_type).toLowerCase().includes(q)
      );
    }

    return list;
  }

  private matchesFilter(p: ConstructionProject, f: ProjectFilter): boolean {
    const phase = p.contract_phase ?? '';
    if (f === 'all') {
      return true;
    }
    if (f === 'completed') {
      return phase === 'completed' || phase === 'closed';
    }
    return phase !== 'completed' && phase !== 'closed';
  }

  reference(p: ConstructionProject): string {
    return p.project_request?.reference_code || `CV-PRJ-${p.id}`;
  }

  phaseLabel(p: ConstructionProject): string {
    return projectPhaseLabel(p);
  }

  phaseBadgeClass(p: ConstructionProject): string {
    switch (p.contract_phase) {
      case 'execution_quote':
        return 'cp-badge--warning';
      case 'construction':
        return 'cp-badge--primary';
      case 'completed':
        return 'cp-badge--success';
      case 'closed':
        return 'cp-badge--neutral';
      default:
        return 'cp-badge--primary';
    }
  }

  phaseAccentClass(p: ConstructionProject): string {
    switch (p.contract_phase) {
      case 'execution_quote':
        return 'prj-card--accent-warn';
      case 'construction':
        return 'prj-card--accent-build';
      case 'completed':
        return 'prj-card--accent-success';
      case 'closed':
        return 'prj-card--accent-muted';
      default:
        return 'prj-card--accent-primary';
    }
  }

  phaseIcon(p: ConstructionProject): string {
    switch (p.contract_phase) {
      case 'execution_quote':
        return 'heroicons_outline:clipboard-document-list';
      case 'construction':
        return 'heroicons_outline:wrench-screwdriver';
      case 'completed':
        return 'heroicons_outline:check-badge';
      case 'closed':
        return 'heroicons_outline:archive-box';
      default:
        return 'heroicons_outline:pencil-square';
    }
  }

  typeLabel(p: ConstructionProject): string {
    return projectTypeLabel(p.project_type);
  }

  needsAttention(p: ConstructionProject): boolean {
    return p.contract_phase === 'execution_quote' || p.contract_phase === 'construction';
  }
}
