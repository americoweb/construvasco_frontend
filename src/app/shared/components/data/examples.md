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
