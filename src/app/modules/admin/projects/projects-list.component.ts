import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ConfigService } from '../../../core/services/config.service';
import { API_ENDPOINTS } from '../../../shared/constants/api-endpoints';
import { UserService } from '../../../core/auth/services/user.service';

interface ProjectRow {
  id: number;
  name?: string;
  status?: string;
  project_type?: string;
  location?: string;
  current_phase?: string;
  budget?: number | string;
  target_budget?: number | string;
  updated_at?: string;
  client?: { name?: string };
  assignments?: { assigned_user?: { name?: string }; assignment_role?: string }[];
}

@Component({
  selector: 'app-projects-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './projects-list.component.html',
  styleUrls: ['./projects-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectsListComponent implements OnInit {
  loading = true;
  isTechnicianView = false;
  rows: ProjectRow[] = [];
  filteredRows: ProjectRow[] = [];
  searchText = '';
  statusFilter = '';

  readonly displayedColumns = [
    'name',
    'client',
    'status',
    'phase',
    'location',
    'budget',
    'team',
    'updated',
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
        this.rows = (res as { data?: ProjectRow[] }).data ?? [];
        this.applyFilter();
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.rows = [];
        this.filteredRows = [];
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  applyFilter(): void {
    const q = this.searchText.trim().toLowerCase();
    this.filteredRows = this.rows.filter((p) => {
      if (this.statusFilter && p.status !== this.statusFilter) return false;
      if (!q) return true;
      const hay = [
        p.name,
        p.client?.name,
        p.location,
        p.status,
        p.current_phase,
        String(p.id),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
    this.cdr.markForCheck();
  }

  labelStatus(status?: string): string {
    return this.statusOptions.find((s) => s.value === status)?.label ?? status ?? '—';
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
    return new Date(v).toLocaleDateString('pt-MZ');
  }
}
