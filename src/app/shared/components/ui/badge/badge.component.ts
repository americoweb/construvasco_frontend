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
