import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { PageHeaderComponent } from '../../../../shared/components/layout/page-header/page-header.component';
import { DataTableComponent, TableColumn, TableAction } from '../../../../shared/components/data/table/data-table.component';
import { DataFiltersComponent, FilterField } from '../../../../shared/components/data/filters/data-filters.component';
import { PaginationComponent } from '../../../../shared/components/data/pagination/pagination.component';
import { ConfirmDialogComponent } from '../../../../shared/components/feedback/confirm-dialog/confirm-dialog.component';
import { NotificationService } from '../../../../shared/components/feedback/notification.service';

import { StaffService } from '../shared/staff.service';
import { Staff, STAFF_ROLES } from '../shared/staff.types';
import { PaginationInfo } from '../../../../core/models/api.types';

@Component({
  selector: 'app-staff-list',
  standalone: true,
  imports: [
    CommonModule,
    PageHeaderComponent,
    DataTableComponent,
    DataFiltersComponent,
    PaginationComponent,
    MatDialogModule,
  ],
  templateUrl: './staff-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StaffListComponent implements OnInit, OnDestroy {
  staff: Staff[] = [];
  loading = false;
  pagination: PaginationInfo = { current_page: 1, per_page: 15, total: 0, last_page: 1 };
  searchValue = '';
  filters: any = {};

  columns: TableColumn[] = [
    { key: 'name',       label: 'Nome',   sortable: true },
    { key: 'identifier', label: 'E-mail', sortable: true },
    {
      key: 'role',
      label: 'Perfil',
      format: (v: any) => v?.display_name ?? '—'
    },
    {
      key: 'is_active',
      label: 'Estado',
      type: 'badge',
      format: (v: boolean) => v ? 'Activo' : 'Inactivo'
    },
    {
      key: 'created_at',
      label: 'Criado em',
      format: (v: string) => v ? new Date(v).toLocaleDateString('pt-BR') : '—'
    },
  ];

  actions: TableAction[] = [
    {
      label: 'Editar',
      icon: 'edit',
      handler: (s: Staff) => this.router.navigate(['/admin/staff', s.id, 'edit'])
    },
    {
      label: 'Remover',
      icon: 'delete',
      color: 'warn',
      handler: (s: Staff) => this.confirmDelete(s)
    }
  ];

  filterFields: FilterField[] = [
    {
      key: 'role',
      label: 'Perfil',
      type: 'select',
      options: STAFF_ROLES
    },
    {
      key: 'is_active',
      label: 'Estado',
      type: 'select',
      options: [
        { value: 'true',  label: 'Activo' },
        { value: 'false', label: 'Inactivo' },
      ]
    }
  ];

  pageHeaderActions = [
    {
      label: 'Novo Membro',
      icon: 'add',
      variant: 'primary' as const,
      callback: () => this.router.navigate(['/admin/staff/create'])
    }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private service: StaffService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
    private notification: NotificationService
  ) {}

  ngOnInit(): void {
    this.load();
    this.service.items$.pipe(takeUntil(this.destroy$)).subscribe(items => {
      this.staff = items;
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
      error: () => this.notification.show({ type: 'error', message: 'Erro ao carregar staff', title: 'Erro' })
    });
  }

  onSearchChange(s: string): void  { this.searchValue = s; this.pagination.current_page = 1; this.load(); }
  onFiltersChange(f: any): void    { this.filters = f; this.pagination.current_page = 1; this.load(); }
  onPageChange(p: number): void    { this.pagination.current_page = p; this.load(); }
  onPageSizeChange(s: number): void { this.pagination.per_page = s; this.pagination.current_page = 1; this.load(); }
  onRefresh(): void                { this.load(); }
  onFilterToggle(): void           {}

  confirmDelete(s: Staff): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Remover Membro',
        message: `Tem a certeza que deseja remover "${s.name}"?`,
        confirmText: 'Remover',
        cancelText: 'Cancelar',
        type: 'danger'
      }
    });
    ref.afterClosed().subscribe(result => {
      if (result?.confirmed) {
        this.service.deleteStaff(s.id).subscribe({
          next: () => {
            this.notification.show({ type: 'success', message: 'Membro removido', title: 'Sucesso' });
            this.load();
          },
          error: () => this.notification.show({ type: 'error', message: 'Erro ao remover', title: 'Erro' })
        });
      }
    });
  }
}
