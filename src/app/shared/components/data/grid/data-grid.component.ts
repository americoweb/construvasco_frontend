import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { LoadingComponent } from '../../ui/loading/loading.component';
import { EmptyStateComponent } from '../../ui/empty-state/empty-state.component';
import { CardComponent } from '../../ui/card/card.component';
import { AvatarComponent } from '../../ui/avatar/avatar.component';
import { BadgeComponent } from '../../ui/badge/badge.component';

export interface GridItem {
  id: string | number;
  title: string;
  subtitle?: string;
  description?: string;
  image?: string;
  status?: string;
  tags?: string[];
  metadata?: { [key: string]: any };
}

export interface GridAction {
  label: string;
  icon?: string;
  color?: 'primary' | 'warn' | 'accent';
  handler: (item: GridItem) => void;
  condition?: (item: GridItem) => boolean;
}

@Component({
  selector: 'app-data-grid',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatCheckboxModule,
    LoadingComponent,
    EmptyStateComponent,
    CardComponent,
    AvatarComponent,
    BadgeComponent
  ],
  templateUrl: './data-grid.component.html',
  styleUrls: ['./data-grid.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DataGridComponent {
  @Input() items: GridItem[] = [];
  @Input() loading = false;
  @Input() selectable = false;
  @Input() columns: 'auto' | 1 | 2 | 3 | 4 | 5 | 6 = 'auto';
  @Input() gap: 'sm' | 'md' | 'lg' = 'md';
  @Input() actions: GridAction[] = [];
  @Input() emptyMessage = 'No items found';
  @Input() emptyIcon = 'grid_view';

  @Output() itemClick = new EventEmitter<GridItem>();
  @Output() selectionChange = new EventEmitter<GridItem[]>();

  selectedItems: Set<string | number> = new Set();

  get gridClasses(): string {
    const baseClasses = 'grid';
    
    const columnClasses = {
      'auto': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
      1: 'grid-cols-1',
      2: 'grid-cols-1 sm:grid-cols-2',
      3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
      4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
      5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5',
      6: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6'
    };

    const gapClasses = {
      sm: 'gap-2',
      md: 'gap-4',
      lg: 'gap-6'
    };

    return [baseClasses, columnClasses[this.columns], gapClasses[this.gap]].join(' ');
  }

  toggleSelection(item: GridItem): void {
    if (this.selectedItems.has(item.id)) {
      this.selectedItems.delete(item.id);
    } else {
      this.selectedItems.add(item.id);
    }
    this.emitSelectionChange();
  }

  isSelected(item: GridItem): boolean {
    return this.selectedItems.has(item.id);
  }

  selectAll(): void {
    if (this.isAllSelected()) {
      this.selectedItems.clear();
    } else {
      this.items.forEach(item => this.selectedItems.add(item.id));
    }
    this.emitSelectionChange();
  }

  isAllSelected(): boolean {
    return this.items.length > 0 && this.selectedItems.size === this.items.length;
  }

  private emitSelectionChange(): void {
    const selected = this.items.filter(item => this.selectedItems.has(item.id));
    this.selectionChange.emit(selected);
  }

  onItemClick(item: GridItem): void {
    this.itemClick.emit(item);
  }

  shouldShowAction(action: GridAction, item: GridItem): boolean {
    return action.condition ? action.condition(item) : true;
  }

  executeAction(action: GridAction, item: GridItem, event: Event): void {
    event.stopPropagation();
    action.handler(item);
  }

  trackByItem(index: number, item: GridItem): string | number {
    return item.id;
  }

  getStatusVariant(status: string): 'default' | 'primary' | 'success' | 'warning' | 'danger' {
    const statusMap: { [key: string]: any } = {
      'active': 'success',
      'inactive': 'default',
      'pending': 'warning',
      'error': 'danger',
      'draft': 'default'
    };
    return statusMap[status?.toLowerCase()] || 'default';
  }
}
