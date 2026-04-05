import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { LoadingComponent } from '../../ui/loading/loading.component';
import { EmptyStateComponent } from '../../ui/empty-state/empty-state.component';
import { AvatarComponent } from '../../ui/avatar/avatar.component';
import { BadgeComponent } from '../../ui/badge/badge.component';

export interface ListItem {
  id: string | number;
  title: string;
  subtitle?: string;
  description?: string;
  avatar?: string;
  status?: string;
  metadata?: { [key: string]: any };
}

export interface ListAction {
  label: string;
  icon?: string;
  color?: 'primary' | 'warn' | 'accent';
  handler: (item: ListItem) => void;
  condition?: (item: ListItem) => boolean;
}

@Component({
  selector: 'app-data-list',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatCheckboxModule,
    LoadingComponent,
    EmptyStateComponent,
    AvatarComponent,
    BadgeComponent
  ],
  templateUrl: './data-list.component.html',
  styleUrls: ['./data-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DataListComponent {
  @Input() items: ListItem[] = [];
  @Input() loading = false;
  @Input() selectable = false;
  @Input() showAvatar = true;
  @Input() showStatus = true;
  @Input() actions: ListAction[] = [];
  @Input() emptyMessage = 'No items found';
  @Input() emptyIcon = 'list';

  @Output() itemClick = new EventEmitter<ListItem>();
  @Output() selectionChange = new EventEmitter<ListItem[]>();

  selectedItems: Set<string | number> = new Set();

  toggleSelection(item: ListItem): void {
    if (this.selectedItems.has(item.id)) {
      this.selectedItems.delete(item.id);
    } else {
      this.selectedItems.add(item.id);
    }
    this.emitSelectionChange();
  }

  isSelected(item: ListItem): boolean {
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

  onItemClick(item: ListItem): void {
    this.itemClick.emit(item);
  }

  shouldShowAction(action: ListAction, item: ListItem): boolean {
    return action.condition ? action.condition(item) : true;
  }

  executeAction(action: ListAction, item: ListItem, event: Event): void {
    event.stopPropagation();
    action.handler(item);
  }

  trackByItem(index: number, item: ListItem): string | number {
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
