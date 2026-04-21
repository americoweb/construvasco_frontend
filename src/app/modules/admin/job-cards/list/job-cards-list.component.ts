import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { PageHeaderComponent } from '../../../../shared/components/layout/page-header/page-header.component';
import { DataTableComponent, TableColumn, TableAction } from '../../../../shared/components/data/table/data-table.component';
import { DataFiltersComponent, FilterField } from '../../../../shared/components/data/filters/data-filters.component';
import { PaginationComponent } from '../../../../shared/components/data/pagination/pagination.component';
import { ButtonComponent } from '../../../../shared/components/ui/button/button.component';
import { ConfirmDialogComponent } from '../../../../shared/components/feedback/confirm-dialog/confirm-dialog.component';
import { NotificationService } from '../../../../shared/components/feedback/notification.service';

import { JobCardService } from '../shared/job-card.service';
import {
  JobCard,
  JobCardStatus,
  JobCardPriority,
  ClientTier,
  JOB_CARD_STATUS_LABELS,
  JOB_CARD_STATUS_COLORS,
  JOB_CARD_PRIORITY_LABELS,
  JOB_CARD_PRIORITY_COLORS
} from '../shared/job-card.types';
import { PaginationInfo } from '../../../../core/models/api.types';

@Component({
  selector: 'app-job-cards-list',
  standalone: true,
  imports: [
    CommonModule,
    PageHeaderComponent,
    DataTableComponent,
    DataFiltersComponent,
    PaginationComponent,
    ButtonComponent,
    MatDialogModule
  ],
  templateUrl: './job-cards-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JobCardsListComponent implements OnInit, OnDestroy {
  jobCards: JobCard[] = [];
  loading = false;
  pagination: PaginationInfo = { current_page: 1, per_page: 15, total: 0, last_page: 1 };
  searchValue = '';
  filters: any = {};

  columns: TableColumn[] = [
    {
      key: 'job_number',
      label: 'Nº Job',
      sortable: true
    },
    {
      key: 'title',
      label: 'Título',
      sortable: true
    },
    {
      key: 'status',
      label: 'Status',
      type: 'badge',
      format: (v: JobCardStatus) => JOB_CARD_STATUS_LABELS[v] ?? v
    },
    {
      key: 'priority',
      label: 'Prioridade',
      type: 'badge',
      format: (v: JobCardPriority) => JOB_CARD_PRIORITY_LABELS[v] ?? v
    },
    {
      key: 'priority_override',
      label: 'Urgente',
      format: (v: boolean) => v ? '⚠️ SIM' : '—'
    },
    {
      key: 'client',
      label: 'Cliente',
      format: (v: any) => v?.name ?? '—'
    },
    {
      key: 'designer',
      label: 'Designer',
      format: (v: any) => v?.name ?? '—'
    },
    {
      key: 'deadline',
      label: 'Prazo',
      sortable: true,
      format: (v: string) => this.formatDate(v)
    },
    {
      key: 'revision_count',
      label: 'Revisões',
      format: (v: number, row: JobCard) => `${v}/${row.revision_limit}`
    }
  ];

  actions: TableAction[] = [
    {
      label: 'Ver',
      icon: 'visibility',
      handler: (jc: JobCard) => this.view(jc)
    },
    {
      label: 'Kanban',
      icon: 'view_kanban',
      handler: () => this.router.navigate(['/admin/job-cards/kanban'])
    },
    {
      label: 'Cancelar',
      icon: 'cancel',
      color: 'warn',
      handler: (jc: JobCard) => this.confirmCancel(jc),
      condition: (jc: JobCard) => jc.can_be_cancelled
    }
  ];

  filterFields: FilterField[] = [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: Object.values(JobCardStatus).map(v => ({
        value: v,
        label: JOB_CARD_STATUS_LABELS[v]
      }))
    },
    {
      key: 'priority',
      label: 'Prioridade',
      type: 'select',
      options: Object.values(JobCardPriority).map(v => ({
        value: v,
        label: JOB_CARD_PRIORITY_LABELS[v]
      }))
    },
    {
      key: 'client_tier',
      label: 'Tier do Cliente',
      type: 'select',
      options: [
        { value: ClientTier.VIP,    label: 'VIP' },
        { value: ClientTier.NORMAL, label: 'Normal' },
        { value: ClientTier.NEW,    label: 'Novo' },
      ]
    }
  ];

  pageHeaderActions = [
    {
      label: 'Novo Job Card',
      icon: 'add',
      variant: 'primary' as const,
      callback: () => this.router.navigate(['/admin/job-cards/create'])
    },
    {
      label: 'Kanban',
      icon: 'view_kanban',
      variant: 'secondary' as const,
      callback: () => this.router.navigate(['/admin/job-cards/kanban'])
    }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private service: JobCardService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
    private notification: NotificationService
  ) {}

  ngOnInit(): void {
    this.load();
    this.service.items$.pipe(takeUntil(this.destroy$)).subscribe(items => {
      this.jobCards = items;
      this.cdr.markForCheck();
    });
    this.service.loading$.pipe(takeUntil(this.destroy$)).subscribe(l => {
      this.loading = l;
      this.cdr.markForCheck();
    });
    this.service.pagination$.pipe(takeUntil(this.destroy$)).subscribe(p => {
      this.pagination = p;
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  load(): void {
    const params: any = {
      page: this.pagination.current_page,
      per_page: this.pagination.per_page,
      ...this.filters
    };
    if (this.searchValue) params.search = this.searchValue;

    this.service.get(params).subscribe({
      next: res => { if (res.meta) this.pagination = res.meta; },
      error: () => this.notification.show({ type: 'error', message: 'Erro ao carregar Job Cards', title: 'Erro' })
    });
  }

  onSearchChange(s: string): void  { this.searchValue = s; this.pagination.current_page = 1; this.load(); }
  onFiltersChange(f: any): void     { this.filters = f; this.pagination.current_page = 1; this.load(); }
  onPageChange(p: number): void     { this.pagination.current_page = p; this.load(); }
  onPageSizeChange(s: number): void { this.pagination.per_page = s; this.pagination.current_page = 1; this.load(); }
  onRefresh(): void                 { this.load(); }
  onFilterToggle(): void            {}

  view(jc: JobCard): void { this.router.navigate(['/admin/job-cards', jc.id]); }

  confirmCancel(jc: JobCard): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Cancelar Job Card',
        message: `Tem a certeza que deseja cancelar o Job Card "${jc.job_number} — ${jc.title}"?`,
        confirmText: 'Cancelar Job',
        cancelText: 'Não',
        type: 'danger'
      }
    });
    ref.afterClosed().subscribe(result => {
      if (result?.confirmed) {
        this.service.cancel(jc.id).subscribe({
          next: () => {
            this.notification.show({ type: 'success', message: 'Job Card cancelado', title: 'Sucesso' });
            this.load();
          },
          error: () => this.notification.show({ type: 'error', message: 'Erro ao cancelar', title: 'Erro' })
        });
      }
    });
  }

  getStatusColor(s: JobCardStatus): string { return JOB_CARD_STATUS_COLORS[s] ?? 'gray'; }
  getPriorityColor(p: JobCardPriority): string { return JOB_CARD_PRIORITY_COLORS[p] ?? 'gray'; }

  formatDate(d: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
}
