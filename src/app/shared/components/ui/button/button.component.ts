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
  changeDetection: ChangeDetectionStrategy.OnPush,
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
    const variantClass =
      {
        primary: 'btn-app--primary',
        secondary: 'btn-app--secondary',
        outline: 'btn-app--outline',
        ghost: 'btn-app--ghost',
        danger: 'btn-app--danger',
      }[this.variant];

    const sizeClass =
      {
        sm: 'btn-app--sm',
        md: 'btn-app--md',
        lg: 'btn-app--lg',
      }[this.size];

    const width = this.fullWidth ? 'btn-app--full' : '';

    return ['btn-app', variantClass, sizeClass, width].filter(Boolean).join(' ');
  }

  onButtonClick(event: Event): void {
    if (!this.disabled && !this.loading) {
      this.onClick.emit(event);
    }
  }
}
