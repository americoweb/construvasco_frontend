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
