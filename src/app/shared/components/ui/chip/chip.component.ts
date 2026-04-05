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
