import { Component, Input, ChangeDetectionStrategy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './avatar.component.html',
  styleUrls: ['./avatar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AvatarComponent implements OnChanges {
  @Input() src?: string;
  @Input() alt = '';
  @Input() name = '';
  @Input() size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number = 'md';
  @Input() shape: 'circle' | 'square' = 'circle';

  imageError = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['src']) {
      // Reset image error when src changes
      if (this.imageError && changes['src'].currentValue) {
        this.imageError = false;
      }
    }
  }

  get classes(): string {
    const baseClasses = 'inline-flex items-center justify-center bg-gray-100 text-gray-600 font-medium';
    
    // Handle numeric size
    if (typeof this.size === 'number') {
      const sizeClasses = `w-${this.size} h-${this.size}`;
      const textSize = this.size <= 24 ? 'text-xs' : 
                      this.size <= 32 ? 'text-sm' : 
                      this.size <= 40 ? 'text-base' : 
                      this.size <= 48 ? 'text-lg' : 'text-xl';
      const shapeClass = this.shape === 'circle' ? 'rounded-full' : 'rounded-md';
      return [baseClasses, sizeClasses, textSize, shapeClass].join(' ');
    }
    
    // Handle predefined sizes
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

  get style(): string {
    if (typeof this.size === 'number') {
      return `width: ${this.size}px; height: ${this.size}px;`;
    }
    return '';
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
