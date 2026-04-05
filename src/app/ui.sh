#!/bin/bash

# Create UI Components Structure for iHRM
# Run this script from src/app/ directory

echo "Creating shared UI components structure..."

# Create base directories
mkdir -p shared/components/ui/{button,card,badge,avatar,chip,loading,empty-state}

# Create Button Component
echo "Creating Button component..."
cat > shared/components/ui/button/button.component.ts << 'EOF'
import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatRippleModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule, MatRippleModule, MatIconModule],
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ButtonComponent {
  @Input() variant: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' = 'primary';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled = false;
  @Input() loading = false;
  @Input() fullWidth = false;
  @Input() icon?: string;
  @Input() iconPosition: 'left' | 'right' = 'left';

  @Output() onClick = new EventEmitter<Event>();

  get classes(): string {
    const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 disabled:cursor-not-allowed';
    
    const variantClasses = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 disabled:bg-blue-300',
      secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500 disabled:bg-gray-300',
      outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400',
      ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-blue-500 disabled:text-gray-400',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 disabled:bg-red-300'
    };

    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg'
    };

    const widthClass = this.fullWidth ? 'w-full' : '';

    return [baseClasses, variantClasses[this.variant], sizeClasses[this.size], widthClass]
      .filter(Boolean)
      .join(' ');
  }

  onButtonClick(event: Event): void {
    if (!this.disabled && !this.loading) {
      this.onClick.emit(event);
    }
  }
}
EOF

cat > shared/components/ui/button/button.component.html << 'EOF'
<button
  [type]="type"
  [disabled]="disabled || loading"
  [class]="classes"
  [matRipple]="!disabled"
  (click)="onButtonClick($event)">
  
  <!-- Loading spinner -->
  <mat-icon *ngIf="loading" class="animate-spin mr-2">autorenew</mat-icon>
  
  <!-- Left icon -->
  <mat-icon *ngIf="icon && iconPosition === 'left' && !loading" 
            [class]="'mr-2 text-' + size">{{ icon }}</mat-icon>
  
  <!-- Content -->
  <span>
    <ng-content></ng-content>
  </span>
  
  <!-- Right icon -->
  <mat-icon *ngIf="icon && iconPosition === 'right' && !loading" 
            [class]="'ml-2 text-' + size">{{ icon }}</mat-icon>
</button>
EOF

cat > shared/components/ui/button/button.component.scss << 'EOF'
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

button:focus-visible {
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
}
EOF

# Create Card Component
echo "Creating Card component..."
cat > shared/components/ui/card/card.component.ts << 'EOF'
import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardComponent {
  @Input() padding: 'none' | 'sm' | 'md' | 'lg' = 'md';
  @Input() shadow: 'none' | 'sm' | 'md' | 'lg' = 'sm';
  @Input() rounded: 'none' | 'sm' | 'md' | 'lg' = 'md';
  @Input() border = false;
  @Input() hover = false;

  get classes(): string {
    const baseClasses = 'bg-white';
    
    const paddingClasses = {
      none: 'p-0',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8'
    };

    const shadowClasses = {
      none: 'shadow-none',
      sm: 'shadow-sm',
      md: 'shadow-md',
      lg: 'shadow-lg'
    };

    const roundedClasses = {
      none: 'rounded-none',
      sm: 'rounded-sm',
      md: 'rounded-lg',
      lg: 'rounded-xl'
    };

    const borderClass = this.border ? 'border border-gray-200' : '';
    const hoverClass = this.hover ? 'hover:shadow-md transition-shadow duration-200' : '';

    return [
      baseClasses,
      paddingClasses[this.padding],
      shadowClasses[this.shadow],
      roundedClasses[this.rounded],
      borderClass,
      hoverClass
    ].filter(Boolean).join(' ');
  }
}
EOF

cat > shared/components/ui/card/card.component.html << 'EOF'
<div [class]="classes">
  <!-- Header slot -->
  <ng-content select="[slot=header]"></ng-content>
  
  <!-- Default content -->
  <ng-content></ng-content>
  
  <!-- Footer slot -->
  <ng-content select="[slot=footer]"></ng-content>
</div>
EOF

cat > shared/components/ui/card/card.component.scss << 'EOF'
:host {
  display: block;
}
EOF

# Create Badge Component
echo "Creating Badge component..."
cat > shared/components/ui/badge/badge.component.ts << 'EOF'
import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './badge.component.html',
  styleUrls: ['./badge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BadgeComponent {
  @Input() variant: 'default' | 'primary' | 'success' | 'warning' | 'danger' = 'default';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() outlined = false;
  @Input() rounded = false;

  get classes(): string {
    const baseClasses = 'inline-flex items-center font-medium';
    
    const variantClasses = {
      default: this.outlined ? 'border border-gray-300 text-gray-700' : 'bg-gray-100 text-gray-800',
      primary: this.outlined ? 'border border-blue-300 text-blue-700' : 'bg-blue-100 text-blue-800',
      success: this.outlined ? 'border border-green-300 text-green-700' : 'bg-green-100 text-green-800',
      warning: this.outlined ? 'border border-yellow-300 text-yellow-700' : 'bg-yellow-100 text-yellow-800',
      danger: this.outlined ? 'border border-red-300 text-red-700' : 'bg-red-100 text-red-800'
    };

    const sizeClasses = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-1 text-sm',
      lg: 'px-3 py-1.5 text-base'
    };

    const shapeClass = this.rounded ? 'rounded-full' : 'rounded';

    return [
      baseClasses,
      variantClasses[this.variant],
      sizeClasses[this.size],
      shapeClass
    ].filter(Boolean).join(' ');
  }
}
EOF

cat > shared/components/ui/badge/badge.component.html << 'EOF'
<span [class]="classes">
  <ng-content></ng-content>
</span>
EOF

cat > shared/components/ui/badge/badge.component.scss << 'EOF'
:host {
  display: inline-block;
}
EOF

# Create Avatar Component
echo "Creating Avatar component..."
cat > shared/components/ui/avatar/avatar.component.ts << 'EOF'
import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './avatar.component.html',
  styleUrls: ['./avatar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AvatarComponent {
  @Input() src?: string;
  @Input() alt = '';
  @Input() name = '';
  @Input() size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' = 'md';
  @Input() shape: 'circle' | 'square' = 'circle';

  imageError = false;

  get classes(): string {
    const baseClasses = 'inline-flex items-center justify-center bg-gray-100 text-gray-600 font-medium';
    
    const sizeClasses = {
      xs: 'w-6 h-6 text-xs',
      sm: 'w-8 h-8 text-sm',
      md: 'w-10 h-10 text-base',
      lg: 'w-12 h-12 text-lg',
      xl: 'w-16 h-16 text-xl'
    };

    const shapeClass = this.shape === 'circle' ? 'rounded-full' : 'rounded-md';

    return [baseClasses, sizeClasses[this.size], shapeClass].join(' ');
  }

  get initials(): string {
    if (!this.name) return '';
    
    const names = this.name.trim().split(' ');
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    }
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  }

  onImageError(): void {
    this.imageError = true;
  }
}
EOF

cat > shared/components/ui/avatar/avatar.component.html << 'EOF'
<div [class]="classes">
  <img 
    *ngIf="src && !imageError" 
    [src]="src" 
    [alt]="alt || name"
    class="w-full h-full object-cover"
    [class.rounded-full]="shape === 'circle'"
    [class.rounded-md]="shape === 'square'"
    (error)="onImageError()">
  
  <span *ngIf="!src || imageError">{{ initials }}</span>
</div>
EOF

cat > shared/components/ui/avatar/avatar.component.scss << 'EOF'
:host {
  display: inline-block;
}
EOF

# Create Chip Component
echo "Creating Chip component..."
cat > shared/components/ui/chip/chip.component.ts << 'EOF'
import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-chip',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './chip.component.html',
  styleUrls: ['./chip.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChipComponent {
  @Input() variant: 'default' | 'primary' | 'success' | 'warning' | 'danger' = 'default';
  @Input() size: 'sm' | 'md' = 'md';
  @Input() removable = false;
  @Input() disabled = false;
  @Input() selected = false;

  @Output() remove = new EventEmitter<void>();
  @Output() click = new EventEmitter<void>();

  get classes(): string {
    const baseClasses = 'inline-flex items-center font-medium rounded-full transition-colors duration-200';
    
    const variantClasses = {
      default: this.selected ? 'bg-gray-200 text-gray-900' : 'bg-gray-100 text-gray-800 hover:bg-gray-200',
      primary: this.selected ? 'bg-blue-200 text-blue-900' : 'bg-blue-100 text-blue-800 hover:bg-blue-200',
      success: this.selected ? 'bg-green-200 text-green-900' : 'bg-green-100 text-green-800 hover:bg-green-200',
      warning: this.selected ? 'bg-yellow-200 text-yellow-900' : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
      danger: this.selected ? 'bg-red-200 text-red-900' : 'bg-red-100 text-red-800 hover:bg-red-200'
    };

    const sizeClasses = {
      sm: 'px-2 py-1 text-xs',
      md: 'px-3 py-1.5 text-sm'
    };

    const disabledClass = this.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';

    return [
      baseClasses,
      variantClasses[this.variant],
      sizeClasses[this.size],
      disabledClass
    ].filter(Boolean).join(' ');
  }

  onChipClick(): void {
    if (!this.disabled) {
      this.click.emit();
    }
  }

  onRemoveClick(event: Event): void {
    event.stopPropagation();
    if (!this.disabled) {
      this.remove.emit();
    }
  }
}
EOF

cat > shared/components/ui/chip/chip.component.html << 'EOF'
<span [class]="classes" (click)="onChipClick()">
  <ng-content></ng-content>
  
  <button 
    *ngIf="removable"
    type="button"
    class="ml-1 -mr-1 p-0.5 rounded-full hover:bg-black hover:bg-opacity-10 focus:outline-none"
    (click)="onRemoveClick($event)">
    <mat-icon class="w-3 h-3 text-current">close</mat-icon>
  </button>
</span>
EOF

cat > shared/components/ui/chip/chip.component.scss << 'EOF'
:host {
  display: inline-block;
}

mat-icon {
  font-size: 12px;
  width: 12px;
  height: 12px;
}
EOF

# Create Loading Component
echo "Creating Loading component..."
cat > shared/components/ui/loading/loading.component.ts << 'EOF'
import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loading.component.html',
  styleUrls: ['./loading.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoadingComponent {
  @Input() type: 'spinner' | 'dots' | 'skeleton' = 'spinner';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() text = '';
  @Input() rows = 3; // For skeleton type

  get spinnerClasses(): string {
    const sizeClasses = {
      sm: 'w-4 h-4',
      md: 'w-8 h-8',
      lg: 'w-12 h-12'
    };
    return `animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[this.size]}`;
  }

  get dotsClasses(): string {
    const sizeClasses = {
      sm: 'w-2 h-2',
      md: 'w-3 h-3',
      lg: 'w-4 h-4'
    };
    return `bg-blue-600 rounded-full ${sizeClasses[this.size]}`;
  }

  getSkeletonRows(): number[] {
    return Array.from({ length: this.rows }, (_, i) => i);
  }
}
EOF

cat > shared/components/ui/loading/loading.component.html << 'EOF'
<div class="flex flex-col items-center justify-center p-4">
  <!-- Spinner -->
  <div *ngIf="type === 'spinner'" [class]="spinnerClasses"></div>
  
  <!-- Dots -->
  <div *ngIf="type === 'dots'" class="flex space-x-1">
    <div [class]="dotsClasses" style="animation: bounce 1.4s infinite ease-in-out both; animation-delay: -0.32s"></div>
    <div [class]="dotsClasses" style="animation: bounce 1.4s infinite ease-in-out both; animation-delay: -0.16s"></div>
    <div [class]="dotsClasses" style="animation: bounce 1.4s infinite ease-in-out both;"></div>
  </div>
  
  <!-- Skeleton -->
  <div *ngIf="type === 'skeleton'" class="w-full space-y-3">
    <div *ngFor="let row of getSkeletonRows()" 
         class="animate-pulse bg-gray-200 rounded"
         [style.height]="size === 'sm' ? '12px' : size === 'md' ? '16px' : '20px'"
         [style.width]="row === rows - 1 ? '75%' : '100%'">
    </div>
  </div>
  
  <!-- Loading text -->
  <p *ngIf="text" class="mt-2 text-sm text-gray-600">{{ text }}</p>
</div>
EOF

cat > shared/components/ui/loading/loading.component.scss << 'EOF'
@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
EOF

# Create Empty State Component
echo "Creating Empty State component..."
cat > shared/components/ui/empty-state/empty-state.component.ts << 'EOF'
import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, MatIconModule, ButtonComponent],
  templateUrl: './empty-state.component.html',
  styleUrls: ['./empty-state.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmptyStateComponent {
  @Input() icon = 'inbox';
  @Input() title = 'No data found';
  @Input() message = '';
  @Input() actionText = '';
  @Input() actionIcon = '';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';

  @Output() actionClick = new EventEmitter<void>();

  get iconSize(): string {
    const sizes = {
      sm: 'text-4xl',
      md: 'text-6xl',
      lg: 'text-8xl'
    };
    return sizes[this.size];
  }

  get titleSize(): string {
    const sizes = {
      sm: 'text-lg',
      md: 'text-xl',
      lg: 'text-2xl'
    };
    return sizes[this.size];
  }

  onActionClick(): void {
    this.actionClick.emit();
  }
}
EOF

cat > shared/components/ui/empty-state/empty-state.component.html << 'EOF'
<div class="text-center py-12">
  <!-- Icon -->
  <mat-icon [class]="'text-gray-400 mb-4 ' + iconSize">{{ icon }}</mat-icon>
  
  <!-- Title -->
  <h3 [class]="'font-semibold text-gray-900 mb-2 ' + titleSize">{{ title }}</h3>
  
  <!-- Message -->
  <p *ngIf="message" class="text-gray-600 mb-6 max-w-sm mx-auto">{{ message }}</p>
  
  <!-- Action Button -->
  <app-button 
    *ngIf="actionText"
    variant="primary"
    [icon]="actionIcon"
    (onClick)="onActionClick()">
    {{ actionText }}
  </app-button>
</div>
EOF

cat > shared/components/ui/empty-state/empty-state.component.scss << 'EOF'
:host {
  display: block;
}
EOF

# Create index.ts files for easier imports
echo "Creating index files..."

cat > shared/components/ui/index.ts << 'EOF'
export * from './button/button.component';
export * from './card/card.component';
export * from './badge/badge.component';
export * from './avatar/avatar.component';
export * from './chip/chip.component';
export * from './loading/loading.component';
export * from './empty-state/empty-state.component';
EOF

cat > shared/components/index.ts << 'EOF'
export * from './ui';
EOF

echo "✅ UI Components structure created successfully!"
echo ""
echo "📁 Created components:"
echo "   - Button (with variants, sizes, loading states)"
echo "   - Card (with padding, shadow, border options)"
echo "   - Badge (with variants and outlined style)"
echo "   - Avatar (with image fallback to initials)"
echo "   - Chip (with removable and selectable options)"
echo "   - Loading (spinner, dots, skeleton types)"
echo "   - Empty State (with customizable icon and action)"
echo ""
echo "🚀 Usage examples:"
echo "   <app-button variant=\"primary\" size=\"md\">Click me</app-button>"
echo "   <app-card padding=\"md\" shadow=\"sm\">Content</app-card>"
echo "   <app-badge variant=\"success\">Active</app-badge>"
echo "   <app-avatar name=\"John Doe\" size=\"md\"></app-avatar>"
echo "   <app-chip removable (remove)=\"onRemove()\">Tag</app-chip>"
echo "   <app-loading type=\"spinner\" size=\"md\"></app-loading>"
echo "   <app-empty-state title=\"No candidates\" actionText=\"Add Candidate\"></app-empty-state>"
EOF

chmod +x create_ui_components_structure.sh