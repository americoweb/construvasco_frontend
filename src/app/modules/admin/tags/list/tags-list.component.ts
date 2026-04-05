import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { PageHeaderComponent } from '../../../../shared/components/layout/page-header/page-header.component';
import { DataTableComponent, TableColumn, TableAction } from '../../../../shared/components/data/table/data-table.component';
import { PaginationComponent } from '../../../../shared/components/data/pagination/pagination.component';
import { ConfirmDialogComponent } from '../../../../shared/components/feedback/confirm-dialog/confirm-dialog.component';
import { NotificationService } from '../../../../shared/components/feedback/notification.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TagService } from '../shared/tag.service';
import { Tag } from '../shared/tag.types';
import { PaginationInfo } from '../../../../core/models/api.types';

@Component({
  selector: 'app-tags-list',
  standalone: true,
  imports: [
    CommonModule,
    PageHeaderComponent,
    DataTableComponent,
    PaginationComponent,
    MatDialogModule
  ],
  templateUrl: './tags-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TagsListComponent implements OnInit, OnDestroy {
  tags: Tag[] = [];
  loading = false;
  pagination: PaginationInfo = {
    current_page: 1,
    per_page: 15,
    total: 0,
    last_page: 1
  };
  searchValue = '';
  
  columns: TableColumn[] = [
    { key: 'name', label: 'Nome', sortable: true },
    { 
      key: 'color', 
      label: 'Cor', 
      type: 'badge',
      format: (value: string) => value || 'Sem cor'
    },
    { key: 'products_count', label: 'Produtos', sortable: false }
  ];

  actions: TableAction[] = [
    {
      label: 'Ver',
      icon: 'visibility',
      handler: (tag: Tag) => this.viewTag(tag)
    },
    {
      label: 'Editar',
      icon: 'edit',
      handler: (tag: Tag) => this.editTag(tag)
    },
    {
      label: 'Excluir',
      icon: 'delete',
      color: 'warn',
      handler: (tag: Tag) => this.deleteTag(tag)
    }
  ];

  pageHeaderActions = [
    {
      label: 'Nova Tag',
      icon: 'add',
      variant: 'primary' as const,
      callback: () => this.createTag()
    }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private tagService: TagService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private notificationService: NotificationService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadTags();
    this.subscribeToService();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToService(): void {
    this.tagService.items$.pipe(takeUntil(this.destroy$)).subscribe(tags => {
      this.tags = tags;
      this.cdr.markForCheck();
    });

    this.tagService.loading$.pipe(takeUntil(this.destroy$)).subscribe(loading => {
      this.loading = loading;
      this.cdr.markForCheck();
    });

    this.tagService.pagination$.pipe(takeUntil(this.destroy$)).subscribe(pagination => {
      this.pagination = pagination;
      this.cdr.markForCheck();
    });
  }

  loadTags(): void {
    const params: any = {
      page: this.pagination.current_page,
      per_page: this.pagination.per_page
    };

    if (this.searchValue) {
      params.search = this.searchValue;
    }

    this.tagService.get(params).subscribe({
      next: (response) => {
        if (response.meta) {
          this.pagination = response.meta;
        }
      },
      error: (error) => {
        this.notificationService.show({
          type: 'error',
          message: 'Erro ao carregar tags',
          title: 'Erro'
        });
      }
    });
  }

  onSearchChange(search: string): void {
    this.searchValue = search;
    this.pagination.current_page = 1;
    this.loadTags();
  }

  onPageChange(page: number): void {
    this.pagination.current_page = page;
    this.loadTags();
  }

  onPageSizeChange(pageSize: number): void {
    this.pagination.per_page = pageSize;
    this.pagination.current_page = 1;
    this.loadTags();
  }

  onRefresh(): void {
    this.loadTags();
  }

  createTag(): void {
    this.router.navigate(['/admin/tags/create']);
  }

  viewTag(tag: Tag): void {
    this.router.navigate(['/admin/tags', tag.id]);
  }

  editTag(tag: Tag): void {
    this.router.navigate(['/admin/tags', tag.id, 'edit']);
  }

  deleteTag(tag: Tag): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Confirmar Exclusão',
        message: `Tem certeza que deseja excluir a tag "${tag.name}"?`,
        confirmText: 'Excluir',
        cancelText: 'Cancelar',
        type: 'danger'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.confirmed) {
        this.tagService.delete(tag.id).subscribe({
          next: () => {
            this.notificationService.show({
              type: 'success',
              message: 'Tag excluída com sucesso',
              title: 'Sucesso'
            });
            this.loadTags();
          },
          error: (error) => {
            this.notificationService.show({
              type: 'error',
              message: 'Erro ao excluir tag',
              title: 'Erro'
            });
          }
        });
      }
    });
  }
}

