import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialogConfig, ConfirmDialogResult } from '../feedback.types';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule
  ],
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfirmDialogComponent {
  constructor(
    private dialogRef: MatDialogRef<ConfirmDialogComponent, ConfirmDialogResult>,
    @Inject(MAT_DIALOG_DATA) public config: ConfirmDialogConfig
  ) {
    // Set default values
    this.config = {
      title: 'Confirm Action',
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      confirmColor: 'primary',
      type: 'default',
      ...config
    };
  }

  onConfirm(): void {
    this.dialogRef.close({ confirmed: true });
  }

  onCancel(): void {
    this.dialogRef.close({ confirmed: false });
  }

  get iconName(): string {
    if (this.config.icon) return this.config.icon;
    
    const typeIcons = {
      default: 'help_outline',
      danger: 'warning',
      warning: 'warning',
      info: 'info'
    };

    return typeIcons[this.config.type || 'default'];
  }

  get iconColor(): string {
    const typeColors = {
      default: 'text-blue-500',
      danger: 'text-red-500',
      warning: 'text-yellow-500',
      info: 'text-blue-500'
    };

    return typeColors[this.config.type || 'default'];
  }

  get titleClasses(): string {
    const typeClasses = {
      default: 'text-gray-900',
      danger: 'text-red-900',
      warning: 'text-yellow-900',
      info: 'text-blue-900'
    };

    return `text-lg font-semibold ${typeClasses[this.config.type || 'default']}`;
  }

  get confirmButtonColor(): 'primary' | 'accent' | 'warn' {
    if (this.config.type === 'danger') return 'warn';
    return this.config.confirmColor || 'primary';
  }
}
