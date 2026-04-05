import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../../ui/button/button.component';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';

export interface PageHeaderAction {
  label: string;
  icon?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  callback: () => void;
  disabled?: boolean;
}

export interface BreadcrumbItem {
  label: string;
  url?: string;
  icon?: string;
}

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    ButtonComponent,
    BreadcrumbComponent
  ],
  templateUrl: './page-header.component.html',
  styleUrls: ['./page-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PageHeaderComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() breadcrumbs: BreadcrumbItem[] = [];
  @Input() showSearch = false;
  @Input() searchPlaceholder = 'Search...';
  @Input() searchValue = '';
  @Input() showFilters = false;
  @Input() showViewToggle = false;
  @Input() currentView = 'list';
  @Input() viewOptions: { value: string; label: string; icon: string }[] = [];
  @Input() actions: PageHeaderAction[] = [];
  @Input() loading = false;

  @Output() searchChange = new EventEmitter<string>();
  @Output() filterToggle = new EventEmitter<void>();
  @Output() viewChange = new EventEmitter<string>();
  @Output() refresh = new EventEmitter<void>();

  onSearchChange(value: string): void {
    this.searchValue = value;
    this.searchChange.emit(value);
  }

  onFilterToggle(): void {
    this.filterToggle.emit();
  }

  onViewChange(view: string): void {
    this.currentView = view;
    this.viewChange.emit(view);
  }

  onRefresh(): void {
    this.refresh.emit();
  }

  onActionClick(action: PageHeaderAction): void {
    if (!action.disabled) {
      action.callback();
    }
  }

  trackByValue(index: number, item: any): string {
    return item.value;
  }
}
