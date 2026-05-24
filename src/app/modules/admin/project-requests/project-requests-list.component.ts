import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProjectRequestService } from '../../../shared/construction/project-request.service';
import { ProjectRequest } from '../../../shared/construction/construction.types';

@Component({
  selector: 'app-project-requests-list',
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
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './project-requests-list.component.html',
  styleUrls: ['./project-requests-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectRequestsListComponent implements OnInit {
  loading = true;
  rows: ProjectRequest[] = [];
  filtered: ProjectRequest[] = [];
  searchText = '';
  statusFilter = '';

  readonly columns = ['ref', 'title', 'client', 'type', 'status', 'date', 'actions'];

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
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  applyFilter(): void {
    const q = this.searchText.trim().toLowerCase();
    this.filtered = this.rows.filter((r) => {
      if (this.statusFilter && r.status !== this.statusFilter) return false;
      if (!q) return true;
      const client = (r.user?.name ?? r.user?.identifier ?? '').toLowerCase();
      return (
        String(r.reference_code ?? '').toLowerCase().includes(q) ||
        String(r.title ?? '').toLowerCase().includes(q) ||
        client.includes(q)
      );
    });
  }

  statusLabel(status?: string): string {
    return this.statusOptions.find((s) => s.value === status)?.label ?? status ?? '—';
  }
}
