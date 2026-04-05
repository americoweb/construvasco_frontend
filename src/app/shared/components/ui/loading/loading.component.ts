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
