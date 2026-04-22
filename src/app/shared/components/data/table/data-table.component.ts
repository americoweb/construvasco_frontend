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
  type?: 'text' | 'date' | 'badge' | 'avatar' | 'actions' | 'custom' | 'color' | 'image';
  sortable?: boolean;
  width?: string;
  sticky?: boolean;
  format?: (value: any, row?: any) => string;
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
    return column.format ? column.format(value, element) : value;
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

  getBadgeClass(value: any, element?: any): string {
    // Use status_color from backend if available (for orders)
    if (element && element.status_color) {
      const colorMap: Record<string, string> = {
        'yellow': 'bg-yellow-100 text-yellow-800',
        'blue': 'bg-blue-100 text-blue-800',
        'orange': 'bg-orange-100 text-orange-800',
        'purple': 'bg-purple-100 text-purple-800',
        'green': 'bg-green-100 text-green-800',
        'red': 'bg-red-100 text-red-800',
        'gray': 'bg-gray-100 text-gray-800'
      };
      return colorMap[element.status_color] || 'bg-gray-100 text-gray-800';
    }
    
    // Use payment_status_color from backend if available
    if (element && element.payment_status_color) {
      const colorMap: Record<string, string> = {
        'yellow': 'bg-yellow-100 text-yellow-800',
        'blue': 'bg-blue-100 text-blue-800',
        'orange': 'bg-orange-100 text-orange-800',
        'purple': 'bg-purple-100 text-purple-800',
        'green': 'bg-green-100 text-green-800',
        'red': 'bg-red-100 text-red-800',
        'gray': 'bg-gray-100 text-gray-800'
      };
      return colorMap[element.payment_status_color] || 'bg-gray-100 text-gray-800';
    }
    
    if (typeof value === 'boolean') {
      return value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
    }
    
    if (typeof value === 'string') {
      const lowerValue = value.toLowerCase();
      
      // Order Status colors
      if (lowerValue.includes('pendente') || lowerValue.includes('pending')) {
        return 'bg-yellow-100 text-yellow-800';
      }
      if (lowerValue.includes('confirmado') || lowerValue.includes('confirmed')) {
        return 'bg-blue-100 text-blue-800';
      }
      if (lowerValue.includes('em produção') || lowerValue.includes('in production') || lowerValue.includes('produção')) {
        return 'bg-orange-100 text-orange-800';
      }
      if (lowerValue.includes('enviado') || lowerValue.includes('shipped')) {
        return 'bg-purple-100 text-purple-800';
      }
      if (lowerValue.includes('entregue') || lowerValue.includes('delivered')) {
        return 'bg-green-100 text-green-800';
      }
      if (lowerValue.includes('cancelado') || lowerValue.includes('cancelled')) {
        return 'bg-red-100 text-red-800';
      }
      
      // Payment Status colors
      if (lowerValue.includes('pago') || lowerValue.includes('paid')) {
        return 'bg-green-100 text-green-800';
      }
      if (lowerValue.includes('falhou') || lowerValue.includes('failed')) {
        return 'bg-red-100 text-red-800';
      }
      if (lowerValue.includes('reembolsado') || lowerValue.includes('refunded')) {
        return 'bg-gray-100 text-gray-800';
      }
      
      // Generic status colors
      if (lowerValue.includes('ativo') || lowerValue.includes('active') || lowerValue === 'sim' || lowerValue === 'yes') {
        return 'bg-green-100 text-green-800';
      }
      if (lowerValue.includes('inativo') || lowerValue.includes('inactive') || lowerValue === 'não' || lowerValue === 'no') {
        return 'bg-gray-100 text-gray-800';
      }
      if (lowerValue.includes('erro') || lowerValue.includes('error')) {
        return 'bg-red-100 text-red-800';
      }
      if (lowerValue.includes('completo') || lowerValue.includes('completed') || lowerValue.includes('sucesso') || lowerValue.includes('success')) {
        return 'bg-blue-100 text-blue-800';
      }
      if (lowerValue === 'online') {
        return 'bg-indigo-100 text-indigo-800 font-semibold border border-indigo-200';
      }
      if (lowerValue === 'walk-in') {
        return 'bg-gray-100 text-gray-600 border border-gray-200';
      }
    }
    
    // Default badge style
    return 'bg-gray-100 text-gray-800';
  }

  getInitials(name: string): string {
    if (!name) return '';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
}
