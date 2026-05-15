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
  /** Semantic colour token (e.g. from API status_color). When set, overrides `variant` styling. */
  @Input() color?: string;

  @Input() variant: 'default' | 'primary' | 'success' | 'warning' | 'danger' = 'default';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() outlined = false;
  @Input() rounded = false;

  get classes(): string {
    const baseClasses = 'inline-flex items-center font-medium';
    const sizeClasses = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-1 text-sm',
      lg: 'px-3 py-1.5 text-base',
    };
    const shapeClass = this.rounded ? 'rounded-full' : 'rounded';

    if (this.color) {
      const tone = BadgeComponent.colorToneClasses[this.color] ?? BadgeComponent.colorToneClasses['gray'];
      return [baseClasses, tone, sizeClasses[this.size], shapeClass].join(' ');
    }

    const variantClasses = {
      default: this.outlined ? 'border border-gray-300 text-gray-700' : 'bg-gray-100 text-gray-800',
      primary: this.outlined ? 'border border-blue-300 text-blue-700' : 'bg-blue-100 text-blue-800',
      success: this.outlined ? 'border border-green-300 text-green-700' : 'bg-green-100 text-green-800',
      warning: this.outlined ? 'border border-yellow-300 text-yellow-700' : 'bg-yellow-100 text-yellow-800',
      danger: this.outlined ? 'border border-red-300 text-red-700' : 'bg-red-100 text-red-800',
    };

    return [
      baseClasses,
      variantClasses[this.variant],
      sizeClasses[this.size],
      shapeClass,
    ]
      .filter(Boolean)
      .join(' ');
  }

  private static readonly colorToneClasses: Record<string, string> = {
    gray: 'bg-gray-100 text-gray-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    blue: 'bg-blue-100 text-blue-800',
    indigo: 'bg-indigo-100 text-indigo-800',
    purple: 'bg-purple-100 text-purple-800',
    orange: 'bg-orange-100 text-orange-800',
    teal: 'bg-teal-100 text-teal-800',
    cyan: 'bg-cyan-100 text-cyan-800',
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
  };
}
