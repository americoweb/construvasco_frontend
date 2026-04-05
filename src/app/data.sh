#!/bin/bash

# Create Data Display Components Structure for Angular App
# Run this script from src/app/ directory

echo "🚀 Creating data display components structure..."

# Create base directories
mkdir -p shared/components/data/{table,list,grid,pagination,filters}

# =============================================================================
# DATA TABLE COMPONENT
# =============================================================================

echo "📊 Creating Data Table component..."
cat > shared/components/data/table/data-table.component.ts << 'EOF'
import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort, Sort } from '@angular/material/sort';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { SelectionModel } from '@angular/cdk/collections';
import { LoadingComponent } from '../../ui/loading/loading.component';
import { EmptyStateComponent } from '../../ui/empty-state/empty-state.component';

export interface TableColumn {
  key: string;
  label: string;
  type?: 'text' | 'date' | 'badge' | 'avatar' | 'actions' | 'custom';
  sortable?: boolean;
  width?: string;
  sticky?: boolean;
  format?: (value: any) => string;
  cellClass?: string;
}

export interface TableAction {
  label: string;
  icon?: string;
  color?: 'primary' | 'warn' | 'accent';
  handler: (item: any) => void;
  condition?: (item: any) => boolean;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatSortModule,
    MatCheckboxModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    LoadingComponent,
    EmptyStateComponent
  ],
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DataTableComponent {
  @Input() data: any[] = [];
  @Input() columns: TableColumn[] = [];
  @Input() loading = false;
  @Input() selectable = false;
  @Input() actions: TableAction[] = [];
  @Input() emptyMessage = 'No data available';
  @Input() emptyIcon = 'inbox';
  @Input() trackByFn?: (index: number, item: any) => any;

  @Output() selectionChange = new EventEmitter<any[]>();
  @Output() sortChange = new EventEmitter<Sort>();
  @Output() rowClick = new EventEmitter<any>();

  @ViewChild(MatSort) sort!: MatSort;

  dataSource = new MatTableDataSource<any>([]);
  selection = new SelectionModel<any>(true, []);

  ngOnInit(): void {
    this.updateDataSource();
  }

  ngOnChanges(): void {
    this.updateDataSource();
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
  }

  private updateDataSource(): void {
    this.dataSource.data = this.data;
    this.selection.clear();
  }

  get displayedColumns(): string[] {
    const columns = [];
    if (this.selectable) columns.push('select');
    columns.push(...this.columns.map(col => col.key));
    if (this.actions.length > 0) columns.push('actions');
    return columns;
  }

  isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  toggleAllRows(): void {
    if (this.isAllSelected()) {
      this.selection.clear();
    } else {
      this.selection.select(...this.dataSource.data);
    }
    this.emitSelectionChange();
  }

  toggleRow(row: any): void {
    this.selection.toggle(row);
    this.emitSelectionChange();
  }

  private emitSelectionChange(): void {
    this.selectionChange.emit(this.selection.selected);
  }

  onSortChange(sort: Sort): void {
    this.sortChange.emit(sort);
  }

  onRowClick(row: any): void {
    this.rowClick.emit(row);
  }

  getCellValue(element: any, column: TableColumn): any {
    const value = this.getNestedProperty(element, column.key);
    return column.format ? column.format(value) : value;
  }

  private getNestedProperty(obj: any, path: string): any {
    return path.split('.').reduce((o, p) => o?.[p], obj);
  }

  trackByIndex(index: number): number {
    return index;
  }

  trackByKey(index: number, item: any): any {
    return this.trackByFn ? this.trackByFn(index, item) : item.id || index;
  }

  shouldShowAction(action: TableAction, item: any): boolean {
    return action.condition ? action.condition(item) : true;
  }

  executeAction(action: TableAction, item: any, event: Event): void {
    event.stopPropagation();
    action.handler(item);
  }
}
EOF

cat > shared/components/data/table/data-table.component.html << 'EOF'
<div class="data-table-container">
  <!-- Loading State -->
  <app-loading *ngIf="loading" type="skeleton" [rows]="5"></app-loading>

  <!-- Table -->
  <div *ngIf="!loading && data.length > 0" class="overflow-x-auto">
    <table mat-table [dataSource]="dataSource" matSort 
           (matSortChange)="onSortChange($event)"
           class="w-full">

      <!-- Selection Column -->
      <ng-container matColumnDef="select" *ngIf="selectable">
        <th mat-header-cell *matHeaderCellDef class="w-12">
          <mat-checkbox
            [checked]="selection.hasValue() && isAllSelected()"
            [indeterminate]="selection.hasValue() && !isAllSelected()"
            (change)="toggleAllRows()">
          </mat-checkbox>
        </th>
        <td mat-cell *matCellDef="let row" class="w-12">
          <mat-checkbox
            [checked]="selection.isSelected(row)"
            (change)="toggleRow(row)"
            (click)="$event.stopPropagation()">
          </mat-checkbox>
        </td>
      </ng-container>

      <!-- Dynamic Columns -->
      <ng-container *ngFor="let column of columns; trackBy: trackByIndex" 
                    [matColumnDef]="column.key">
        <th mat-header-cell *matHeaderCellDef 
            [mat-sort-header]="column.sortable ? column.key : null"
            [style.width]="column.width"
            [class.sticky]="column.sticky">
          {{ column.label }}
        </th>
        <td mat-cell *matCellDef="let element; trackBy: trackByKey" 
            [style.width]="column.width"
            [ngClass]="column.cellClass"
            [class.sticky]="column.sticky">
          
          <!-- Text Type -->
          <span *ngIf="!column.type || column.type === 'text'">
            {{ getCellValue(element, column) }}
          </span>

          <!-- Date Type -->
          <span *ngIf="column.type === 'date'">
            {{ getCellValue(element, column) | date:'MMM dd, yyyy' }}
          </span>

          <!-- Badge Type -->
          <span *ngIf="column.type === 'badge'" 
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                [ngClass]="getBadgeClass(getCellValue(element, column))">
            {{ getCellValue(element, column) }}
          </span>

          <!-- Avatar Type -->
          <div *ngIf="column.type === 'avatar'" class="flex items-center">
            <div class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-3">
              <span class="text-sm font-medium text-gray-600">
                {{ getInitials(getCellValue(element, column)) }}
              </span>
            </div>
            <span>{{ getCellValue(element, column) }}</span>
          </div>

          <!-- Custom Type -->
          <ng-container *ngIf="column.type === 'custom'">
            <ng-content [select]="'[slot=' + column.key + ']'"></ng-content>
          </ng-container>
        </td>
      </ng-container>

      <!-- Actions Column -->
      <ng-container matColumnDef="actions" *ngIf="actions.length > 0">
        <th mat-header-cell *matHeaderCellDef class="w-20">Actions</th>
        <td mat-cell *matCellDef="let element" class="w-20">
          <button mat-icon-button [matMenuTriggerFor]="actionsMenu"
                  (click)="$event.stopPropagation()">
            <mat-icon>more_vert</mat-icon>
          </button>
          <mat-menu #actionsMenu="matMenu">
            <button *ngFor="let action of actions"
                    mat-menu-item
                    [disabled]="!shouldShowAction(action, element)"
                    (click)="executeAction(action, element, $event)">
              <mat-icon *ngIf="action.icon" [color]="action.color">{{ action.icon }}</mat-icon>
              <span>{{ action.label }}</span>
            </button>
          </mat-menu>
        </td>
      </ng-container>

      <!-- Header and Row Definitions -->
      <tr mat-header-row *matHeaderRowDef="displayedColumns; sticky: true"></tr>
      <tr mat-row *matRowDef="let row; columns: displayedColumns;"
          class="hover:bg-gray-50 cursor-pointer transition-colors"
          (click)="onRowClick(row)"></tr>
    </table>
  </div>

  <!-- Empty State -->
  <app-empty-state 
    *ngIf="!loading && data.length === 0"
    [title]="emptyMessage"
    [icon]="emptyIcon">
  </app-empty-state>
</div>
EOF

cat > shared/components/data/table/data-table.component.scss << 'EOF'
.data-table-container {
  .mat-mdc-table {
    background: transparent;
  }

  .mat-mdc-header-cell {
    font-weight: 600;
    color: #374151;
    border-bottom: 1px solid #e5e7eb;
  }

  .mat-mdc-cell {
    border-bottom: 1px solid #f3f4f6;
  }

  .mat-mdc-row:hover {
    background-color: #f9fafb;
  }

  .sticky {
    position: sticky;
    left: 0;
    z-index: 1;
    background: white;
  }
}
EOF

# =============================================================================
# DATA LIST COMPONENT
# =============================================================================

echo "📋 Creating Data List component..."
cat > shared/components/data/list/data-list.component.ts << 'EOF'
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
EOF

cat > shared/components/data/list/data-list.component.html << 'EOF'
<div class="data-list-container">
  <!-- Loading State -->
  <app-loading *ngIf="loading" type="skeleton" [rows]="5"></app-loading>

  <!-- Selection Header -->
  <div *ngIf="selectable && items.length > 0 && !loading" 
       class="flex items-center justify-between p-4 bg-gray-50 border-b">
    <div class="flex items-center">
      <mat-checkbox
        [checked]="isAllSelected()"
        [indeterminate]="selectedItems.size > 0 && !isAllSelected()"
        (change)="selectAll()">
      </mat-checkbox>
      <span class="ml-2 text-sm text-gray-600">
        {{ selectedItems.size }} of {{ items.length }} selected
      </span>
    </div>
  </div>

  <!-- List Items -->
  <div *ngIf="!loading && items.length > 0" class="divide-y divide-gray-200">
    <div *ngFor="let item of items; trackBy: trackByItem"
         class="p-4 hover:bg-gray-50 cursor-pointer transition-colors duration-200"
         (click)="onItemClick(item)">
      
      <div class="flex items-center justify-between">
        <!-- Left Content -->
        <div class="flex items-center flex-1 min-w-0">
          
          <!-- Selection Checkbox -->
          <mat-checkbox *ngIf="selectable"
                        class="mr-3"
                        [checked]="isSelected(item)"
                        (change)="toggleSelection(item)"
                        (click)="$event.stopPropagation()">
          </mat-checkbox>

          <!-- Avatar -->
          <app-avatar *ngIf="showAvatar"
                      [src]="item.avatar"
                      [name]="item.title"
                      size="md"
                      class="mr-3">
          </app-avatar>

          <!-- Content -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-medium text-gray-900 truncate">
                {{ item.title }}
              </h3>
              
              <!-- Status Badge -->
              <app-badge *ngIf="showStatus && item.status"
                         [variant]="getStatusVariant(item.status)"
                         size="sm"
                         class="ml-2">
                {{ item.status }}
              </app-badge>
            </div>

            <!-- Subtitle -->
            <p *ngIf="item.subtitle" 
               class="mt-1 text-sm text-gray-600 truncate">
              {{ item.subtitle }}
            </p>

            <!-- Description -->
            <p *ngIf="item.description" 
               class="mt-1 text-sm text-gray-500 line-clamp-2">
              {{ item.description }}
            </p>

            <!-- Metadata -->
            <div *ngIf="item.metadata" 
                 class="mt-2 flex flex-wrap gap-2">
              <span *ngFor="let meta of getMetadataEntries(item.metadata)"
                    class="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-600">
                <strong class="mr-1">{{ meta.key }}:</strong>
                {{ meta.value }}
              </span>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div *ngIf="actions.length > 0" class="ml-4">
          <button mat-icon-button [matMenuTriggerFor]="actionsMenu"
                  (click)="$event.stopPropagation()">
            <mat-icon>more_vert</mat-icon>
          </button>
          <mat-menu #actionsMenu="matMenu">
            <button *ngFor="let action of actions"
                    mat-menu-item
                    [disabled]="!shouldShowAction(action, item)"
                    (click)="executeAction(action, item, $event)">
              <mat-icon *ngIf="action.icon" [color]="action.color">{{ action.icon }}</mat-icon>
              <span>{{ action.label }}</span>
            </button>
          </mat-menu>
        </div>
      </div>
    </div>
  </div>

  <!-- Empty State -->
  <app-empty-state 
    *ngIf="!loading && items.length === 0"
    [title]="emptyMessage"
    [icon]="emptyIcon">
  </app-empty-state>
</div>
EOF

cat > shared/components/data/list/data-list.component.scss << 'EOF'
.data-list-container {
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  overflow: hidden;

  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}
EOF

# =============================================================================
# DATA GRID COMPONENT
# =============================================================================

echo "📱 Creating Data Grid component..."
cat > shared/components/data/grid/data-grid.component.ts << 'EOF'
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
EOF

cat > shared/components/data/grid/data-grid.component.html << 'EOF'
<div class="data-grid-container">
  <!-- Loading State -->
  <div *ngIf="loading" [class]="gridClasses">
    <div *ngFor="let i of [1,2,3,4,5,6]" class="animate-pulse">
      <div class="bg-gray-200 rounded-lg h-64"></div>
    </div>
  </div>

  <!-- Selection Header -->
  <div *ngIf="selectable && items.length > 0 && !loading" 
       class="flex items-center justify-between p-4 bg-gray-50 border-b mb-4 rounded-lg">
    <div class="flex items-center">
      <mat-checkbox
        [checked]="isAllSelected()"
        [indeterminate]="selectedItems.size > 0 && !isAllSelected()"
        (change)="selectAll()">
      </mat-checkbox>
      <span class="ml-2 text-sm text-gray-600">
        {{ selectedItems.size }} of {{ items.length }} selected
      </span>
    </div>
  </div>

  <!-- Grid Items -->
  <div *ngIf="!loading && items.length > 0" [class]="gridClasses">
    <app-card *ngFor="let item of items; trackBy: trackByItem"
              hover="true"
              class="cursor-pointer transition-all duration-200"
              [class.ring-2]="isSelected(item)"
              [class.ring-blue-500]="isSelected(item)"
              (click)="onItemClick(item)">
      
      <!-- Selection Checkbox -->
      <div *ngIf="selectable" class="absolute top-2 left-2 z-10">
        <mat-checkbox
          [checked]="isSelected(item)"
          (change)="toggleSelection(item)"
          (click)="$event.stopPropagation()">
        </mat-checkbox>
      </div>

      <!-- Actions Menu -->
      <div *ngIf="actions.length > 0" class="absolute top-2 right-2 z-10">
        <button mat-icon-button [matMenuTriggerFor]="actionsMenu"
                (click)="$event.stopPropagation()"
                class="opacity-0 group-hover:opacity-100 transition-opacity">
          <mat-icon>more_vert</mat-icon>
        </button>
        <mat-menu #actionsMenu="matMenu">
          <button *ngFor="let action of actions"
                  mat-menu-item
                  [disabled]="!shouldShowAction(action, item)"
                  (click)="executeAction(action, item, $event)">
            <mat-icon *ngIf="action.icon" [color]="action.color">{{ action.icon }}</mat-icon>
            <span>{{ action.label }}</span>
          </button>
        </mat-menu>
      </div>

      <!-- Image/Avatar -->
      <div *ngIf="item.image" class="w-full h-48 bg-gray-200 rounded-lg mb-4 overflow-hidden">
        <img [src]="item.image" [alt]="item.title" 
             class="w-full h-full object-cover">
      </div>

      <!-- Header -->
      <div class="flex items-start justify-between mb-3">
        <div class="flex-1 min-w-0">
          <h3 class="text-lg font-semibold text-gray-900 truncate">
            {{ item.title }}
          </h3>
          <p *ngIf="item.subtitle" class="text-sm text-gray-600 truncate">
            {{ item.subtitle }}
          </p>
        </div>
        
        <!-- Status Badge -->
        <app-badge *ngIf="item.status"
                   [variant]="getStatusVariant(item.status)"
                   size="sm"
                   class="ml-2">
          {{ item.status }}
        </app-badge>
      </div>

      <!-- Description -->
      <p *ngIf="item.description" 
         class="text-sm text-gray-600 mb-4 line-clamp-3">
        {{ item.description }}
      </p>

      <!-- Tags -->
      <div *ngIf="item.tags && item.tags.length > 0" 
           class="flex flex-wrap gap-1 mb-4">
        <span *ngFor="let tag of item.tags.slice(0, 3)"
              class="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
          {{ tag }}
        </span>
        <span *ngIf="item.tags.length > 3"
              class="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-600">
          +{{ item.tags.length - 3 }} more
        </span>
      </div>

      <!-- Metadata -->
      <div *ngIf="item.metadata" 
           class="border-t border-gray-200 pt-3">
        <div class="grid grid-cols-2 gap-2 text-xs">
          <div *ngFor="let meta of getMetadataEntries(item.metadata).slice(0, 4)">
            <span class="text-gray-500">{{ meta.key }}:</span>
            <span class="font-medium text-gray-900 ml-1">{{ meta.value }}</span>
          </div>
        </div>
      </div>
    </app-card>
  </div>

  <!-- Empty State -->
  <app-empty-state 
    *ngIf="!loading && items.length === 0"
    [title]="emptyMessage"
    [icon]="emptyIcon">
  </app-empty-state>
</div>
EOF

cat > shared/components/data/grid/data-grid.component.scss << 'EOF'
.data-grid-container {
  app-card {
    position: relative;
    
    &:hover {
      .group-hover\:opacity-100 {
        opacity: 1;
      }
    }
  }

  .line-clamp-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}
EOF

# =============================================================================
# PAGINATION COMPONENT
# =============================================================================

echo "📄 Creating Pagination component..."
cat > shared/components/data/pagination/pagination.component.ts << 'EOF'
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
EOF

cat > shared/components/data/pagination/pagination.component.html << 'EOF'
<div class="pagination-container flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white border-t border-gray-200">
  
  <!-- Info and Page Size -->
  <div class="flex flex-col sm:flex-row items-center gap-4">
    <!-- Items Info -->
    <div *ngIf="showInfo" class="text-sm text-gray-700">
      Showing {{ startItem }} to {{ endItem }} of {{ pagination.total }} results
    </div>

    <!-- Page Size Selector -->
    <div *ngIf="showPageSize" class="flex items-center gap-2">
      <label class="text-sm text-gray-700">Show:</label>
      <mat-select 
        [value]="pagination.per_page"
        (selectionChange)="onPageSizeChange($event.value)"
        class="text-sm">
        <mat-option *ngFor="let size of pageSizeOptions" [value]="size">
          {{ size }}
        </mat-option>
      </mat-select>
      <span class="text-sm text-gray-700">per page</span>
    </div>
  </div>

  <!-- Pagination Controls -->
  <div class="flex items-center gap-1" *ngIf="pagination.last_page > 1">
    
    <!-- First Page -->
    <button mat-icon-button
            [disabled]="pagination.current_page === 1"
            (click)="goToFirstPage()"
            class="text-gray-500 hover:text-gray-700">
      <mat-icon>first_page</mat-icon>
    </button>

    <!-- Previous Page -->
    <button mat-icon-button
            [disabled]="pagination.current_page === 1"
            (click)="goToPreviousPage()"
            class="text-gray-500 hover:text-gray-700">
      <mat-icon>chevron_left</mat-icon>
    </button>

    <!-- Ellipsis Before -->
    <span *ngIf="showEllipsisBefore" class="px-2 text-gray-500">...</span>

    <!-- Page Numbers -->
    <button *ngFor="let page of visiblePages"
            mat-button
            [class]="page === pagination.current_page ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'"
            (click)="goToPage(page)"
            class="min-w-10 h-10">
      {{ page }}
    </button>

    <!-- Ellipsis After -->
    <span *ngIf="showEllipsisAfter" class="px-2 text-gray-500">...</span>

    <!-- Next Page -->
    <button mat-icon-button
            [disabled]="pagination.current_page === pagination.last_page"
            (click)="goToNextPage()"
            class="text-gray-500 hover:text-gray-700">
      <mat-icon>chevron_right</mat-icon>
    </button>

    <!-- Last Page -->
    <button mat-icon-button
            [disabled]="pagination.current_page === pagination.last_page"
            (click)="goToLastPage()"
            class="text-gray-500 hover:text-gray-700">
      <mat-icon>last_page</mat-icon>
    </button>
  </div>
</div>
EOF

cat > shared/components/data/pagination/pagination.component.scss << 'EOF'
.pagination-container {
  .mat-mdc-select {
    min-width: 60px;
  }

  .mat-mdc-button {
    min-width: 40px;
    
    &.bg-blue-600 {
      background-color: #2563eb;
      color: white;
      
      &:hover {
        background-color: #1d4ed8;
      }
    }
  }

  .mat-mdc-icon-button[disabled] {
    opacity: 0.5;
  }
}
EOF

# =============================================================================
# FILTERS COMPONENT
# =============================================================================

echo "🔍 Creating Filters component..."
cat > shared/components/data/filters/data-filters.component.ts << 'EOF'
import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

export interface FilterField {
  key: string;
  label: string;
  type: 'text' | 'select' | 'multiselect' | 'date' | 'daterange' | 'number';
  options?: { value: any; label: string }[];
  placeholder?: string;
  multiple?: boolean;
}

@Component({
  selector: 'app-data-filters',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule
  ],
  templateUrl: './data-filters.component.html',
  styleUrls: ['./data-filters.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DataFiltersComponent {
  @Input() fields: FilterField[] = [];
  @Input() initialValues: any = {};
  @Input() debounceTime = 300;

  @Output() filtersChange = new EventEmitter<any>();
  @Output() reset = new EventEmitter<void>();

  filterForm!: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.createForm();
    this.subscribeToChanges();
  }

  ngOnChanges(): void {
    if (this.filterForm) {
      this.updateFormValues();
    }
  }

  private createForm(): void {
    const controls: any = {};
    
    this.fields.forEach(field => {
      const initialValue = this.initialValues[field.key] || this.getDefaultValue(field);
      controls[field.key] = [initialValue];
    });

    this.filterForm = this.fb.group(controls);
  }

  private updateFormValues(): void {
    this.fields.forEach(field => {
      const control = this.filterForm.get(field.key);
      const newValue = this.initialValues[field.key] || this.getDefaultValue(field);
      if (control && control.value !== newValue) {
        control.setValue(newValue, { emitEvent: false });
      }
    });
  }

  private getDefaultValue(field: FilterField): any {
    switch (field.type) {
      case 'multiselect':
        return [];
      case 'select':
        return null;
      case 'text':
      case 'number':
        return '';
      case 'date':
      case 'daterange':
        return null;
      default:
        return null;
    }
  }

  private subscribeToChanges(): void {
    this.filterForm.valueChanges
      .pipe(
        debounceTime(this.debounceTime),
        distinctUntilChanged()
      )
      .subscribe(values => {
        const cleanedValues = this.cleanFilterValues(values);
        this.filtersChange.emit(cleanedValues);
      });
  }

  private cleanFilterValues(values: any): any {
    const cleaned: any = {};
    
    Object.keys(values).forEach(key => {
      const value = values[key];
      if (value !== null && value !== undefined && value !== '' && 
          !(Array.isArray(value) && value.length === 0)) {
        cleaned[key] = value;
      }
    });

    return cleaned;
  }

  onReset(): void {
    this.filterForm.reset();
    this.fields.forEach(field => {
      const control = this.filterForm.get(field.key);
      if (control) {
        control.setValue(this.getDefaultValue(field));
      }
    });
    this.reset.emit();
  }

  hasActiveFilters(): boolean {
    const values = this.filterForm.value;
    return Object.keys(values).some(key => {
      const value = values[key];
      return value !== null && value !== undefined && value !== '' && 
             !(Array.isArray(value) && value.length === 0);
    });
  }

  getActiveFiltersCount(): number {
    const values = this.cleanFilterValues(this.filterForm.value);
    return Object.keys(values).length;
  }

  removeFilter(fieldKey: string): void {
    const control = this.filterForm.get(fieldKey);
    if (control) {
      const field = this.fields.find(f => f.key === fieldKey);
      if (field) {
        control.setValue(this.getDefaultValue(field));
      }
    }
  }

  getFieldValue(fieldKey: string): any {
    return this.filterForm.get(fieldKey)?.value;
  }

  getFieldDisplayValue(field: FilterField): string {
    const value = this.getFieldValue(field.key);
    
    if (!value || (Array.isArray(value) && value.length === 0)) {
      return '';
    }

    if (field.type === 'select' || field.type === 'multiselect') {
      if (Array.isArray(value)) {
        const labels = value.map(v => {
          const option = field.options?.find(opt => opt.value === v);
          return option?.label || v;
        });
        return labels.join(', ');
      } else {
        const option = field.options?.find(opt => opt.value === value);
        return option?.label || value;
      }
    }

    if (field.type === 'date') {
      return new Date(value).toLocaleDateString();
    }

    return value.toString();
  }
}
EOF

cat > shared/components/data/filters/data-filters.component.html << 'EOF'
<div class="data-filters bg-white border border-gray-200 rounded-lg p-4">
  
  <!-- Filter Header -->
  <div class="flex items-center justify-between mb-4">
    <h3 class="text-lg font-medium text-gray-900">Filters</h3>
    <div class="flex items-center gap-2">
      <span *ngIf="hasActiveFilters()" 
            class="text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded">
        {{ getActiveFiltersCount() }} active
      </span>
      <button mat-button
              color="primary"
              (click)="onReset()"
              [disabled]="!hasActiveFilters()">
        <mat-icon>clear</mat-icon>
        Reset
      </button>
    </div>
  </div>

  <!-- Active Filters Chips -->
  <div *ngIf="hasActiveFilters()" class="mb-4">
    <div class="flex flex-wrap gap-2">
      <mat-chip *ngFor="let field of fields"
                [removable]="true"
                (removed)="removeFilter(field.key)"
                class="text-sm">
        <strong>{{ field.label }}:</strong>
        <span class="ml-1">{{ getFieldDisplayValue(field) }}</span>
        <mat-icon matChipRemove>cancel</mat-icon>
      </mat-chip>
    </div>
  </div>

  <!-- Filter Form -->
  <form [formGroup]="filterForm" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    
    <ng-container *ngFor="let field of fields">
      
      <!-- Text Input -->
      <mat-form-field *ngIf="field.type === 'text'" appearance="outline">
        <mat-label>{{ field.label }}</mat-label>
        <input matInput 
               [formControlName]="field.key"
               [placeholder]="field.placeholder">
      </mat-form-field>

      <!-- Number Input -->
      <mat-form-field *ngIf="field.type === 'number'" appearance="outline">
        <mat-label>{{ field.label }}</mat-label>
        <input matInput 
               type="number"
               [formControlName]="field.key"
               [placeholder]="field.placeholder">
      </mat-form-field>

      <!-- Select -->
      <mat-form-field *ngIf="field.type === 'select'" appearance="outline">
        <mat-label>{{ field.label }}</mat-label>
        <mat-select [formControlName]="field.key"
                    [placeholder]="field.placeholder">
          <mat-option value="">All</mat-option>
          <mat-option *ngFor="let option of field.options" 
                      [value]="option.value">
            {{ option.label }}
          </mat-option>
        </mat-select>
      </mat-form-field>

      <!-- Multi Select -->
      <mat-form-field *ngIf="field.type === 'multiselect'" appearance="outline">
        <mat-label>{{ field.label }}</mat-label>
        <mat-select [formControlName]="field.key"
                    multiple
                    [placeholder]="field.placeholder">
          <mat-option *ngFor="let option of field.options" 
                      [value]="option.value">
            {{ option.label }}
          </mat-option>
        </mat-select>
      </mat-form-field>

      <!-- Date -->
      <mat-form-field *ngIf="field.type === 'date'" appearance="outline">
        <mat-label>{{ field.label }}</mat-label>
        <input matInput 
               [matDatepicker]="picker"
               [formControlName]="field.key"
               [placeholder]="field.placeholder">
        <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
        <mat-datepicker #picker></mat-datepicker>
      </mat-form-field>

    </ng-container>
  </form>
</div>
EOF

cat > shared/components/data/filters/data-filters.component.scss << 'EOF'
.data-filters {
  .mat-mdc-form-field {
    width: 100%;
  }

  .mat-mdc-chip {
    max-width: 200px;
    
    span {
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
}
EOF

# =============================================================================
# CREATE INDEX FILES
# =============================================================================

echo "📝 Creating index files..."

cat > shared/components/data/index.ts << 'EOF'
export * from './table/data-table.component';
export * from './list/data-list.component';
export * from './grid/data-grid.component';
export * from './pagination/pagination.component';
export * from './filters/data-filters.component';
EOF

# Update main components index
cat > shared/components/index.ts << 'EOF'
export * from './ui';
export * from './layout';
export * from './data';
EOF

# =============================================================================
# CREATE EXAMPLE USAGE COMPONENT
# =============================================================================

echo "📖 Creating usage examples..."
cat > shared/components/data/examples.md << 'EOF'
# Data Components Usage Examples

## Data Table
```typescript
// Component
export class UserListComponent {
  users = [
    { id: 1, name: 'John Doe', email: 'john@example.com', status: 'active' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'inactive' }
  ];

  columns: TableColumn[] = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'status', label: 'Status', type: 'badge' }
  ];

  actions: TableAction[] = [
    {
      label: 'Edit',
      icon: 'edit',
      handler: (user) => this.editUser(user)
    },
    {
      label: 'Delete',
      icon: 'delete',
      color: 'warn',
      handler: (user) => this.deleteUser(user)
    }
  ];
}
```

```html
<!-- Template -->
<app-data-table
  [data]="users"
  [columns]="columns"
  [actions]="actions"
  [loading]="loading"
  [selectable]="true"
  (selectionChange)="onSelectionChange($event)"
  (sortChange)="onSortChange($event)">
</app-data-table>
```

## Data List
```html
<app-data-list
  [items]="listItems"
  [loading]="loading"
  [selectable]="true"
  [actions]="listActions"
  (itemClick)="onItemClick($event)">
</app-data-list>
```

## Data Grid
```html
<app-data-grid
  [items]="gridItems"
  [loading]="loading"
  [columns]="4"
  gap="md"
  [actions]="gridActions"
  (itemClick)="onItemClick($event)">
</app-data-grid>
```

## Pagination
```html
<app-pagination
  [pagination]="paginationInfo"
  [pageSizeOptions]="[10, 25, 50]"
  (pageChange)="onPageChange($event)"
  (pageSizeChange)="onPageSizeChange($event)">
</app-pagination>
```

## Filters
```typescript
filterFields: FilterField[] = [
  {
    key: 'name',
    label: 'Name',
    type: 'text',
    placeholder: 'Search by name...'
  },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' }
    ]
  },
  {
    key: 'created_date',
    label: 'Created Date',
    type: 'date'
  }
];
```

```html
<app-data-filters
  [fields]="filterFields"
  [initialValues]="currentFilters"
  (filtersChange)="onFiltersChange($event)"
  (reset)="onFiltersReset()">
</app-data-filters>
```
EOF

echo "✅ Data Components structure created successfully!"
echo ""
echo "📊 Created components:"
echo "   ✅ Data Table (with sorting, selection, actions)"
echo "   ✅ Data List (with avatars, badges, actions)"  
echo "   ✅ Data Grid (responsive grid with cards)"
echo "   ✅ Pagination (with page size options)"
echo "   ✅ Data Filters (dynamic form-based filters)"
echo ""
echo "🚀 Key Features:"
echo "   • Responsive design for all screen sizes"
echo "   • Loading states and empty state handling"
echo "   • Selection support (single/multiple)"
echo "   • Customizable actions with permissions"
echo "   • Sorting and filtering capabilities"
echo "   • Type-safe interfaces"
echo "   • Accessibility support"
echo "   • Material Design + Tailwind styling"
echo ""
echo "📋 Usage:"
echo "   Import any component: import { DataTableComponent } from './shared/components/data';"
echo "   Check examples.md for detailed implementation examples"
echo ""
echo "💡 Next steps:"
echo "   1. Add these components to your feature modules"
echo "   2. Customize styling as needed"
echo "   3. Add more field types to filters if needed"
echo "   4. Test with real data from your API"