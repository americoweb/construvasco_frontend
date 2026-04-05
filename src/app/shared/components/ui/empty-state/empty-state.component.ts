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
