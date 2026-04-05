import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';

export interface PaginationInfo {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from?: number;
  to?: number;
}

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    FormsModule
  ],
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaginationComponent {
  @Input() pagination: PaginationInfo = {
    current_page: 1,
    per_page: 10,
    total: 0,
    last_page: 1
  };
  @Input() pageSizeOptions = [10, 25, 50, 100];
  @Input() showPageSize = true;
  @Input() showInfo = true;
  @Input() maxVisiblePages = 5;

  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  get visiblePages(): number[] {
    const pages: number[] = [];
    const start = Math.max(1, this.pagination.current_page - Math.floor(this.maxVisiblePages / 2));
    const end = Math.min(this.pagination.last_page, start + this.maxVisiblePages - 1);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  get showEllipsisBefore(): boolean {
    return this.visiblePages[0] > 1;
  }

  get showEllipsisAfter(): boolean {
    return this.visiblePages[this.visiblePages.length - 1] < this.pagination.last_page;
  }

  get startItem(): number {
    return this.pagination.from || ((this.pagination.current_page - 1) * this.pagination.per_page + 1);
  }

  get endItem(): number {
    return this.pagination.to || Math.min(this.pagination.current_page * this.pagination.per_page, this.pagination.total);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.pagination.last_page && page !== this.pagination.current_page) {
      this.pageChange.emit(page);
    }
  }

  goToFirstPage(): void {
    this.goToPage(1);
  }

  goToLastPage(): void {
    this.goToPage(this.pagination.last_page);
  }

  goToPreviousPage(): void {
    this.goToPage(this.pagination.current_page - 1);
  }

  goToNextPage(): void {
    this.goToPage(this.pagination.current_page + 1);
  }

  onPageSizeChange(newSize: number): void {
    if (newSize !== this.pagination.per_page) {
      this.pageSizeChange.emit(newSize);
    }
  }
}
