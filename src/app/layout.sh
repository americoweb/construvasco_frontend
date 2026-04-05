#!/bin/bash

# Create Layout Components Structure for iHRM
# Run this script from src/app/ directory

echo "Creating shared layout components structure..."

# Create layout directories
mkdir -p shared/components/layout/{page-header,breadcrumb}

# Create Page Header Component
echo "Creating Page Header component..."
cat > shared/components/layout/page-header/page-header.component.ts << 'EOF'
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
EOF

cat > shared/components/layout/page-header/page-header.component.html << 'EOF'
<div class="bg-white border-b border-gray-200 px-4 py-4 sm:px-6 lg:px-8">
  <div class="flex flex-col space-y-4">
    
    <!-- Top Section: Breadcrumbs -->
    <div *ngIf="breadcrumbs.length > 0">
      <app-breadcrumb [items]="breadcrumbs"></app-breadcrumb>
    </div>

    <!-- Middle Section: Title and Actions -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
      
      <!-- Left: Title and Subtitle -->
      <div class="flex-1 min-w-0">
        <h1 class="text-2xl font-bold text-gray-900 sm:text-3xl sm:truncate">
          {{ title }}
        </h1>
        <p *ngIf="subtitle" class="mt-1 text-sm text-gray-500">
          {{ subtitle }}
        </p>
      </div>

      <!-- Right: Action Buttons -->
      <div class="mt-4 sm:mt-0 sm:ml-4">
        <div class="flex items-center space-x-3">
          
          <!-- Refresh Button -->
          <button
            *ngIf="showFilters || showSearch"
            type="button"
            class="inline-flex items-center p-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            [disabled]="loading"
            (click)="onRefresh()">
            <mat-icon 
              class="h-4 w-4" 
              [class.animate-spin]="loading">
              refresh
            </mat-icon>
          </button>

          <!-- View Toggle -->
          <div *ngIf="showViewToggle && viewOptions.length > 0" class="flex bg-gray-100 rounded-lg p-1">
            <button
              *ngFor="let option of viewOptions; trackBy: trackByValue"
              type="button"
              class="px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
              [class]="currentView === option.value 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'"
              (click)="onViewChange(option.value)">
              <mat-icon class="h-4 w-4">{{ option.icon }}</mat-icon>
              <span class="ml-2 hidden sm:inline">{{ option.label }}</span>
            </button>
          </div>

          <!-- Action Buttons -->
          <div class="flex items-center space-x-2">
            <app-button
              *ngFor="let action of actions"
              [variant]="action.variant || 'primary'"
              [icon]="action.icon"
              [disabled]="action.disabled"
              (onClick)="onActionClick(action)">
              {{ action.label }}
            </app-button>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Section: Search and Filters -->
    <div *ngIf="showSearch || showFilters" class="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
      
      <!-- Search -->
      <div *ngIf="showSearch" class="flex-1 max-w-lg">
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <mat-icon class="h-5 w-5 text-gray-400">search</mat-icon>
          </div>
          <input
            type="text"
            class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            [placeholder]="searchPlaceholder"
            [value]="searchValue"
            (input)="onSearchChange($event.target?.value || '')">
        </div>
      </div>

      <!-- Filters Toggle -->
      <div *ngIf="showFilters" class="flex items-center">
        <button
          type="button"
          class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          (click)="onFilterToggle()">
          <mat-icon class="h-4 w-4 mr-2">filter_list</mat-icon>
          Filters
        </button>
      </div>
    </div>

    <!-- Slot for custom content -->
    <div class="content-slot">
      <ng-content></ng-content>
    </div>
  </div>
</div>
EOF

cat > shared/components/layout/page-header/page-header.component.scss << 'EOF'
:host {
  display: block;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.content-slot:empty {
  display: none;
}

// Responsive adjustments
@media (max-width: 640px) {
  .space-x-3 > * + * {
    margin-left: 0.5rem;
  }
  
  .space-x-2 > * + * {
    margin-left: 0.25rem;
  }
}

// Focus styles
button:focus-visible,
input:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

// Hover transitions
button {
  transition: all 0.2s ease-in-out;
}

// View toggle specific styles
.view-toggle-button {
  position: relative;
  overflow: hidden;
}

.view-toggle-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.view-toggle-button:hover::before {
  left: 100%;
}
EOF

# Create Breadcrumb Component
echo "Creating Breadcrumb component..."
cat > shared/components/layout/breadcrumb/breadcrumb.component.ts << 'EOF'
import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

export interface BreadcrumbItem {
  label: string;
  url?: string;
  icon?: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './breadcrumb.component.html',
  styleUrls: ['./breadcrumb.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BreadcrumbComponent {
  @Input() items: BreadcrumbItem[] = [];
  @Input() separator: 'chevron' | 'slash' | 'arrow' = 'chevron';
  @Input() showHome = true;
  @Input() homeIcon = 'home';
  @Input() homeUrl = '/';
  @Input() maxItems = 0; // 0 means no limit
  @Input() showIcons = true;

  get processedItems(): BreadcrumbItem[] {
    let processedItems = [...this.items];
    
    // Add home item if requested
    if (this.showHome && !processedItems.some(item => item.url === this.homeUrl)) {
      processedItems.unshift({
        label: 'Home',
        url: this.homeUrl,
        icon: this.homeIcon
      });
    }

    // Limit items if maxItems is set
    if (this.maxItems > 0 && processedItems.length > this.maxItems) {
      const start = processedItems.slice(0, 1); // Keep first item
      const end = processedItems.slice(-(this.maxItems - 2)); // Keep last (maxItems - 2) items
      const ellipsis = { label: '...', disabled: true };
      processedItems = [...start, ellipsis, ...end];
    }

    return processedItems;
  }

  get separatorIcon(): string {
    const icons = {
      chevron: 'chevron_right',
      slash: 'more_vert',
      arrow: 'arrow_forward_ios'
    };
    return icons[this.separator];
  }

  trackByIndex(index: number): number {
    return index;
  }

  isClickable(item: BreadcrumbItem, index: number): boolean {
    const items = this.processedItems;
    return !item.disabled && 
           item.url !== undefined && 
           index < items.length - 1; // Last item is not clickable
  }
}
EOF

cat > shared/components/layout/breadcrumb/breadcrumb.component.html << 'EOF'
<nav class="flex" aria-label="Breadcrumb">
  <ol class="flex items-center space-x-1 sm:space-x-2">
    
    <li 
      *ngFor="let item of processedItems; let i = index; let last = last; trackBy: trackByIndex"
      class="flex items-center">
      
      <!-- Breadcrumb Item -->
      <div class="flex items-center">
        
        <!-- Clickable Link -->
        <a 
          *ngIf="isClickable(item, i)"
          [routerLink]="item.url"
          class="group flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors duration-200"
          [attr.aria-current]="last ? 'page' : null">
          
          <!-- Icon -->
          <mat-icon 
            *ngIf="item.icon && showIcons" 
            class="h-4 w-4 mr-1 text-gray-400 group-hover:text-gray-500">
            {{ item.icon }}
          </mat-icon>
          
          <!-- Label -->
          <span class="hover:underline">{{ item.label }}</span>
        </a>

        <!-- Non-clickable Item (current page or disabled) -->
        <span 
          *ngIf="!isClickable(item, i)"
          class="flex items-center text-sm font-medium"
          [class]="last ? 'text-gray-900' : 'text-gray-500'"
          [attr.aria-current]="last ? 'page' : null">
          
          <!-- Icon -->
          <mat-icon 
            *ngIf="item.icon && showIcons" 
            class="h-4 w-4 mr-1"
            [class]="last ? 'text-gray-700' : 'text-gray-400'">
            {{ item.icon }}
          </mat-icon>
          
          <!-- Label -->
          {{ item.label }}
        </span>
      </div>

      <!-- Separator -->
      <mat-icon 
        *ngIf="!last"
        class="h-4 w-4 mx-1 sm:mx-2 text-gray-300"
        [attr.aria-hidden]="true">
        {{ separatorIcon }}
      </mat-icon>
    </li>
  </ol>
</nav>
EOF

cat > shared/components/layout/breadcrumb/breadcrumb.component.scss << 'EOF'
:host {
  display: block;
}

// Breadcrumb responsive behavior
@media (max-width: 640px) {
  // Hide icons on very small screens
  .breadcrumb-icon {
    display: none;
  }
  
  // Reduce spacing
  .space-x-2 > * + * {
    margin-left: 0.25rem;
  }
  
  // Truncate long labels
  .breadcrumb-label {
    max-width: 100px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

// Hover effects
a {
  position: relative;
  text-decoration: none;
}

a::before {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 1px;
  background-color: currentColor;
  transition: width 0.2s ease-in-out;
}

a:hover::before {
  width: 100%;
}

// Focus styles
a:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
  border-radius: 4px;
}

// Animation for separator icons
mat-icon {
  transition: transform 0.2s ease-in-out;
}

// Current page styling
[aria-current="page"] {
  font-weight: 600;
  color: #1f2937;
}

// Ellipsis styling
.ellipsis {
  color: #6b7280;
  font-weight: 500;
  cursor: default;
  user-select: none;
}

// Loading state
.breadcrumb-loading {
  .breadcrumb-item {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: loading 1.5s infinite;
    border-radius: 4px;
    height: 20px;
    width: 80px;
  }
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

// Dark mode support (if using CSS variables)
@media (prefers-color-scheme: dark) {
  .text-gray-500 {
    color: #9ca3af;
  }
  
  .text-gray-700 {
    color: #d1d5db;
  }
  
  .text-gray-900 {
    color: #f9fafb;
  }
  
  .text-gray-300 {
    color: #6b7280;
  }
  
  .text-gray-400 {
    color: #9ca3af;
  }
}
EOF

# Update layout index file
echo "Creating layout index file..."
cat > shared/components/layout/index.ts << 'EOF'
export * from './page-header/page-header.component';
export * from './breadcrumb/breadcrumb.component';
EOF

# Update main components index file
cat > shared/components/index.ts << 'EOF'
export * from './ui';
export * from './layout';
EOF

echo "✅ Layout Components structure created successfully!"
echo ""
echo "📁 Created components:"
echo "   - Page Header (with search, filters, actions, breadcrumbs)"
echo "   - Breadcrumb (with navigation, icons, separators)"
echo ""
echo "🚀 Usage examples:"
echo ""
echo "Page Header:"
echo '   <app-page-header'
echo '     title="Candidates"'
echo '     subtitle="Manage your recruitment pipeline"'
echo '     [breadcrumbs]="breadcrumbItems"'
echo '     [showSearch]="true"'
echo '     [showFilters]="true"'
echo '     [actions]="headerActions"'
echo '     (searchChange)="onSearch($event)">'
echo '   </app-page-header>'
echo ""
echo "Breadcrumb:"
echo '   <app-breadcrumb'
echo '     [items]="breadcrumbItems"'
echo '     separator="chevron"'
echo '     [showHome]="true">'
echo '   </app-breadcrumb>'
echo ""
echo "📋 Features included:"
echo "   ✅ Responsive design"
echo "   ✅ Search functionality"
echo "   ✅ Filter toggle"
echo "   ✅ View switching (list/grid/kanban)"
echo "   ✅ Action buttons"
echo "   ✅ Loading states"
echo "   ✅ Accessibility (ARIA labels, keyboard navigation)"
echo "   ✅ Router integration"
echo "   ✅ Icon support"
echo "   ✅ Customizable separators"
echo "   ✅ Max items limit with ellipsis"
echo "   ✅ Dark mode support"
EOF

chmod +x create_layout_components_structure.sh