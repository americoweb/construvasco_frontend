import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatPaginatorModule, PageEvent, MatPaginatorIntl } from '@angular/material/paginator';
import { PaginationInfo } from '../../../../core/models/api.types';
import { AppMatPaginatorIntl } from './app-mat-paginator-intl';

export type { PaginationInfo };

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule, MatPaginatorModule],
  providers: [{ provide: MatPaginatorIntl, useClass: AppMatPaginatorIntl }],
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginationComponent {
  @Input() pagination: PaginationInfo = {
    current_page: 1,
    per_page: 10,
    total: 0,
    last_page: 1,
  };
  @Input() pageSizeOptions: number[] = [10, 25, 50, 100];
  @Input() showPageSize = true;
  /** Mantido por compatibilidade; o MatPaginator mostra sempre o intervalo. */
  @Input() showInfo = true;
  /** Já não usado (paginação é a do Material). */
  @Input() maxVisiblePages = 5;

  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  /** pageIndex 0-based, coerente com total e last_page da API. */
  get safePageIndex(): number {
    const total = this.pagination.total ?? 0;
    if (total <= 0) {
      return 0;
    }
    const lastPage = Math.max(1, this.pagination.last_page || 1);
    const maxIndex = lastPage - 1;
    const idx = (this.pagination.current_page ?? 1) - 1;
    return Math.max(0, Math.min(idx, maxIndex));
  }

  onMatPage(event: PageEvent): void {
    const sizeChanged = event.pageSize !== this.pagination.per_page;
    if (sizeChanged) {
      this.pageSizeChange.emit(event.pageSize);
      return;
    }
    const newPage = event.pageIndex + 1;
    if (newPage !== this.pagination.current_page) {
      this.pageChange.emit(newPage);
    }
  }
}
