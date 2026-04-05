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
