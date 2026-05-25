import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ConfigService } from '../../../core/services/config.service';
import { API_ENDPOINTS } from '../../../shared/constants/api-endpoints';
import { UserService } from '../../../core/auth/services/user.service';
import { contractPhaseLabel } from '../../../shared/construction/contract-phase.util';

interface ProjectRow {
  id: number;
  name?: string;
  status?: string;
  project_type?: string;
  location?: string;
  current_phase?: string;
  contract_phase?: string;
  contract_phase_label?: string;
  pending_review_count?: number;
  budget?: number | string;
  target_budget?: number | string;
  updated_at?: string;
  client?: { name?: string };
  assignments?: { assigned_user?: { name?: string }; assignment_role?: string }[];
}

export type StaffProjectFilter = 'all' | 'active' | 'construction' | 'review' | 'completed';

@Component({
  selector: 'app-projects-list',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule],
  templateUrl: './projects-list.component.html',
  styleUrls: ['./projects-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectsListComponent implements OnInit {
  loading = true;
  pageReady = false;
  isTechnicianView = false;
  rows: ProjectRow[] = [];
  searchText = '';
  filter: StaffProjectFilter = 'all';

  readonly filters: { id: StaffProjectFilter; label: string; icon: string }[] = [
    { id: 'all', label: 'Todos', icon: 'heroicons_outline:squares-2x2' },
    { id: 'active', label: 'Em curso', icon: 'heroicons_outline:arrow-path' },
    { id: 'construction', label: 'Em obra', icon: 'heroicons_outline:wrench-screwdriver' },
    { id: 'review', label: 'Revisão', icon: 'heroicons_outline:exclamation-circle' },
    { id: 'completed', label: 'Concluídos', icon: 'heroicons_outline:check-badge' },
  ];

  readonly statusOptions = [
    { value: 'active', label: 'Activo' },
    { value: 'in_progress', label: 'Em curso' },
    { value: 'awaiting_payment', label: 'Aguarda pagamento' },
    { value: 'revision', label: 'Revisão' },
    { value: 'completed', label: 'Concluído' },
    { value: 'cancelled', label: 'Cancelado' },
  ];

  constructor(
    private http: HttpClient,
    private config: ConfigService,
    private userService: UserService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const role = String(this.userService.user?.current_tenant_context?.role ?? '').toLowerCase();
    this.isTechnicianView = ['technician', 'designer', 'tecnico', 'desenhista'].includes(role);
    const url = this.isTechnicianView
      ? this.config.getApiUrl(API_ENDPOINTS.TECHNICIAN.PROJECTS)
      : role === 'admin'
        ? this.config.getApiUrl(API_ENDPOINTS.ADMIN.PROJECTS)
        : this.config.getApiUrl(API_ENDPOINTS.MANAGER.PROJECTS);

    this.http.get<{ data: ProjectRow[] }>(url).subscribe({
      next: (res) => {
        this.rows = ((res as { data?: ProjectRow[] }).data ?? []).sort((a, b) => {
          const ua = a.updated_at ?? '';
          const ub = b.updated_at ?? '';
          return ub.localeCompare(ua);
        });
        this.loading = false;
        this.pageReady = true;
        this.cdr.markForCheck();
      },
      error: () => {
        this.rows = [];
        this.loading = false;
        this.pageReady = true;
        this.cdr.markForCheck();
      },
    });
  }

  get filteredRows(): ProjectRow[] {
    let list = this.rows.filter((p) => this.matchesFilter(p, this.filter));
    const q = this.searchText.trim().toLowerCase();
    if (q) {
      list = list.filter((p) => {
        const hay = [
          p.name,
          p.client?.name,
          p.location,
          p.status,
          this.phaseLabel(p),
          String(p.id),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return hay.includes(q);
      });
    }
    return list;
  }

  get constructionCount(): number {
    return this.rows.filter((p) => p.contract_phase === 'construction').length;
  }

  get completedCount(): number {
    return this.rows.filter((p) => this.matchesFilter(p, 'completed')).length;
  }

  get reviewCount(): number {
    return this.rows.filter((p) => (p.pending_review_count ?? 0) > 0).length;
  }

  setFilter(id: StaffProjectFilter): void {
    this.filter = id;
    this.cdr.markForCheck();
  }

  filterCount(id: StaffProjectFilter): number {
    return this.rows.filter((p) => this.matchesFilter(p, id)).length;
  }

  onSearchInput(event: Event): void {
    this.searchText = (event.target as HTMLInputElement).value;
    this.cdr.markForCheck();
  }

  clearSearch(): void {
    this.searchText = '';
    this.cdr.markForCheck();
  }

  private matchesFilter(p: ProjectRow, f: StaffProjectFilter): boolean {
    const phase = p.contract_phase ?? '';
    switch (f) {
      case 'all':
        return true;
      case 'active':
        return phase !== 'completed' && phase !== 'closed';
      case 'construction':
        return phase === 'construction';
      case 'review':
        return (p.pending_review_count ?? 0) > 0;
      case 'completed':
        return phase === 'completed' || phase === 'closed';
      default:
        return true;
    }
  }

  labelStatus(status?: string): string {
    return this.statusOptions.find((s) => s.value === status)?.label ?? status ?? '—';
  }

  phaseLabel(p: ProjectRow): string {
    return p.contract_phase_label ?? contractPhaseLabel(p.contract_phase, p.current_phase);
  }

  phaseBadgeClass(p: ProjectRow): string {
    switch (p.contract_phase) {
      case 'execution_quote':
        return 'stf-prj-badge--warning';
      case 'construction':
        return 'stf-prj-badge--build';
      case 'completed':
        return 'stf-prj-badge--success';
      case 'closed':
        return 'stf-prj-badge--muted';
      case 'architecture':
        return 'stf-prj-badge--info';
      default:
        return 'stf-prj-badge--default';
    }
  }

  phaseAccentClass(p: ProjectRow): string {
    switch (p.contract_phase) {
      case 'execution_quote':
        return 'stf-prj-card--accent-warn';
      case 'construction':
        return 'stf-prj-card--accent-build';
      case 'completed':
        return 'stf-prj-card--accent-success';
      case 'closed':
        return 'stf-prj-card--accent-muted';
      default:
        return 'stf-prj-card--accent-primary';
    }
  }

  phaseIcon(p: ProjectRow): string {
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

  needsAttention(p: ProjectRow): boolean {
    return (
      (p.pending_review_count ?? 0) > 0 ||
      p.contract_phase === 'execution_quote' ||
      p.contract_phase === 'construction' ||
      p.status === 'awaiting_payment'
    );
  }

  teamLabel(p: ProjectRow): string {
    const main = p.assignments?.find((a) => a.assignment_role === 'main')?.assigned_user?.name;
    if (main) return main;
    const any = p.assignments?.[0]?.assigned_user?.name;
    return any ?? '—';
  }

  formatMoney(v?: number | string | null): string {
    if (v === null || v === undefined || v === '') return '—';
    const n = Number(v);
    if (Number.isNaN(n)) return '—';
    return new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(n);
  }

  formatDate(v?: string): string {
    if (!v) return '—';
    return new Date(v).toLocaleDateString('pt-MZ', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
