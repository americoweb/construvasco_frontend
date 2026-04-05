#!/bin/bash

# Create Feedback Components Structure for Angular App
# Run this script from src/app/ directory

echo "💬 Creating feedback components structure..."

# Create base directories
mkdir -p shared/components/feedback/{notification,modal,confirm-dialog}

# =============================================================================
# FEEDBACK INTERFACES AND TYPES
# =============================================================================

echo "🔧 Creating feedback interfaces..."
cat > shared/components/feedback/feedback.types.ts << 'EOF'
export interface NotificationConfig {
  id?: string;
  title?: string;
  message: string;
  type: NotificationType;
  duration?: number; // in milliseconds, 0 for persistent
  position?: NotificationPosition;
  action?: NotificationAction;
  dismissible?: boolean;
  icon?: string;
  timestamp?: Date;
}

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export type NotificationPosition = 
  | 'top-right' 
  | 'top-left' 
  | 'top-center'
  | 'bottom-right' 
  | 'bottom-left' 
  | 'bottom-center';

export interface NotificationAction {
  label: string;
  handler: () => void;
}

export interface ModalConfig {
  id?: string;
  title?: string;
  size?: ModalSize;
  backdrop?: boolean;
  keyboard?: boolean;
  centered?: boolean;
  scrollable?: boolean;
  fullscreen?: boolean | ModalBreakpoint;
  panelClass?: string | string[];
}

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl';
export type ModalBreakpoint = 'sm-down' | 'md-down' | 'lg-down' | 'xl-down';

export interface ConfirmDialogConfig {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: 'primary' | 'accent' | 'warn';
  type?: ConfirmDialogType;
  icon?: string;
  width?: string;
}

export type ConfirmDialogType = 'default' | 'danger' | 'warning' | 'info';

export interface ConfirmDialogResult {
  confirmed: boolean;
  data?: any;
}
EOF

# =============================================================================
# NOTIFICATION SERVICE
# =============================================================================

echo "🔔 Creating Notification Service..."
cat > shared/components/feedback/notification.service.ts << 'EOF'
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { NotificationConfig, NotificationType } from './feedback.types';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notifications = new BehaviorSubject<NotificationConfig[]>([]);
  private idCounter = 0;

  get notifications$(): Observable<NotificationConfig[]> {
    return this.notifications.asObservable();
  }

  show(config: Partial<NotificationConfig>): string {
    const notification: NotificationConfig = {
      id: this.generateId(),
      type: 'info',
      duration: 5000,
      position: 'top-right',
      dismissible: true,
      timestamp: new Date(),
      ...config,
      message: config.message || ''
    };

    const current = this.notifications.value;
    this.notifications.next([...current, notification]);

    // Auto-dismiss if duration is set
    if (notification.duration && notification.duration > 0) {
      setTimeout(() => {
        this.dismiss(notification.id!);
      }, notification.duration);
    }

    return notification.id!;
  }

  success(message: string, title?: string, options?: Partial<NotificationConfig>): string {
    return this.show({
      message,
      title,
      type: 'success',
      icon: 'check_circle',
      ...options
    });
  }

  error(message: string, title?: string, options?: Partial<NotificationConfig>): string {
    return this.show({
      message,
      title,
      type: 'error',
      icon: 'error',
      duration: 0, // Persistent by default for errors
      ...options
    });
  }

  warning(message: string, title?: string, options?: Partial<NotificationConfig>): string {
    return this.show({
      message,
      title,
      type: 'warning',
      icon: 'warning',
      ...options
    });
  }

  info(message: string, title?: string, options?: Partial<NotificationConfig>): string {
    return this.show({
      message,
      title,
      type: 'info',
      icon: 'info',
      ...options
    });
  }

  dismiss(id: string): void {
    const current = this.notifications.value;
    this.notifications.next(current.filter(n => n.id !== id));
  }

  dismissAll(): void {
    this.notifications.next([]);
  }

  getNotificationsByPosition(position: string): NotificationConfig[] {
    return this.notifications.value.filter(n => n.position === position);
  }

  private generateId(): string {
    return `notification-${++this.idCounter}-${Date.now()}`;
  }
}
EOF

# =============================================================================
# NOTIFICATION COMPONENT
# =============================================================================

echo "🔔 Creating Notification component..."
cat > shared/components/feedback/notification/notification.component.ts << 'EOF'
import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { NotificationConfig } from '../feedback.types';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ transform: 'translateX(100%)', opacity: 0 }))
      ])
    ]),
    trigger('slideInLeft', [
      transition(':enter', [
        style({ transform: 'translateX(-100%)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ transform: 'translateX(-100%)', opacity: 0 }))
      ])
    ]),
    trigger('slideInTop', [
      transition(':enter', [
        style({ transform: 'translateY(-100%)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ transform: 'translateY(-100%)', opacity: 0 }))
      ])
    ]),
    trigger('slideInBottom', [
      transition(':enter', [
        style({ transform: 'translateY(100%)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ transform: 'translateY(100%)', opacity: 0 }))
      ])
    ])
  ]
})
export class NotificationComponent {
  @Input() notification!: NotificationConfig;
  @Output() dismiss = new EventEmitter<string>();
  @Output() actionClick = new EventEmitter<string>();

  onDismiss(): void {
    if (this.notification.dismissible !== false) {
      this.dismiss.emit(this.notification.id);
    }
  }

  onActionClick(): void {
    if (this.notification.action) {
      this.notification.action.handler();
      this.actionClick.emit(this.notification.id);
    }
  }

  get notificationClasses(): string {
    const baseClasses = 'notification-item relative flex items-start p-4 rounded-lg shadow-lg border max-w-sm';
    
    const typeClasses = {
      success: 'bg-green-50 border-green-200 text-green-800',
      error: 'bg-red-50 border-red-200 text-red-800',
      warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      info: 'bg-blue-50 border-blue-200 text-blue-800'
    };

    return `${baseClasses} ${typeClasses[this.notification.type]}`;
  }

  get iconColor(): string {
    const colors = {
      success: 'text-green-500',
      error: 'text-red-500',
      warning: 'text-yellow-500',
      info: 'text-blue-500'
    };

    return colors[this.notification.type];
  }

  get animationTrigger(): string {
    const position = this.notification.position || 'top-right';
    
    if (position.includes('left')) return 'slideInLeft';
    if (position.includes('right')) return 'slideIn';
    if (position.includes('top')) return 'slideInTop';
    if (position.includes('bottom')) return 'slideInBottom';
    
    return 'slideIn';
  }

  get defaultIcon(): string {
    if (this.notification.icon) return this.notification.icon;
    
    const icons = {
      success: 'check_circle',
      error: 'error',
      warning: 'warning',
      info: 'info'
    };

    return icons[this.notification.type];
  }

  get timeAgo(): string {
    if (!this.notification.timestamp) return '';
    
    const now = new Date();
    const diff = now.getTime() - this.notification.timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 minute ago';
    if (minutes < 60) return `${minutes} minutes ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return '1 hour ago';
    if (hours < 24) return `${hours} hours ago`;
    
    return this.notification.timestamp.toLocaleDateString();
  }
}
EOF

cat > shared/components/feedback/notification/notification.component.html << 'EOF'
<div 
  [class]="notificationClasses"
  [@slideIn]
  role="alert"
  [attr.aria-live]="notification.type === 'error' ? 'assertive' : 'polite'"
  [attr.aria-atomic]="true">
  
  <!-- Icon -->
  <div class="flex-shrink-0 mr-3">
    <mat-icon [class]="iconColor" class="text-xl">{{ defaultIcon }}</mat-icon>
  </div>

  <!-- Content -->
  <div class="flex-1 min-w-0">
    <!-- Title -->
    <h3 *ngIf="notification.title" class="text-sm font-semibold mb-1">
      {{ notification.title }}
    </h3>

    <!-- Message -->
    <p class="text-sm">{{ notification.message }}</p>

    <!-- Timestamp -->
    <p *ngIf="notification.timestamp" class="text-xs opacity-75 mt-1">
      {{ timeAgo }}
    </p>

    <!-- Action Button -->
    <button
      *ngIf="notification.action"
      type="button"
      class="mt-2 text-sm font-medium underline hover:no-underline focus:outline-none"
      (click)="onActionClick()">
      {{ notification.action.label }}
    </button>
  </div>

  <!-- Dismiss Button -->
  <button
    *ngIf="notification.dismissible !== false"
    type="button"
    mat-icon-button
    class="flex-shrink-0 ml-2 -mr-1 -mt-1"
    (click)="onDismiss()"
    [attr.aria-label]="'Dismiss notification'">
    <mat-icon class="text-sm">close</mat-icon>
  </button>
</div>
EOF

cat > shared/components/feedback/notification/notification.component.scss << 'EOF'
.notification-item {
  margin-bottom: 0.75rem;
  transition: all 0.3s ease;
  backdrop-filter: blur(8px);

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  }

  .mat-mdc-icon-button {
    width: 24px;
    height: 24px;
    line-height: 24px;
    
    .mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }
  }
}

// Dark mode support
@media (prefers-color-scheme: dark) {
  .notification-item {
    &.bg-green-50 { background-color: rgba(34, 197, 94, 0.1); }
    &.bg-red-50 { background-color: rgba(239, 68, 68, 0.1); }
    &.bg-yellow-50 { background-color: rgba(245, 158, 11, 0.1); }
    &.bg-blue-50 { background-color: rgba(59, 130, 246, 0.1); }
  }
}
EOF

# =============================================================================
# NOTIFICATION CONTAINER COMPONENT
# =============================================================================

echo "📋 Creating Notification Container component..."
cat > shared/components/feedback/notification-container.component.ts << 'EOF'
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationComponent } from './notification/notification.component';
import { NotificationService } from './notification.service';
import { NotificationConfig } from './feedback.types';

@Component({
  selector: 'app-notification-container',
  standalone: true,
  imports: [CommonModule, NotificationComponent],
  template: `
    <!-- Notification containers for each position -->
    <div class="notification-containers fixed inset-0 pointer-events-none z-50 p-4">
      
      <!-- Top Right -->
      <div class="absolute top-0 right-0 flex flex-col items-end">
        <app-notification
          *ngFor="let notification of getNotificationsByPosition('top-right')"
          [notification]="notification"
          (dismiss)="onDismiss($event)"
          (actionClick)="onActionClick($event)"
          class="pointer-events-auto">
        </app-notification>
      </div>

      <!-- Top Left -->
      <div class="absolute top-0 left-0 flex flex-col items-start">
        <app-notification
          *ngFor="let notification of getNotificationsByPosition('top-left')"
          [notification]="notification"
          (dismiss)="onDismiss($event)"
          (actionClick)="onActionClick($event)"
          class="pointer-events-auto">
        </app-notification>
      </div>

      <!-- Top Center -->
      <div class="absolute top-0 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
        <app-notification
          *ngFor="let notification of getNotificationsByPosition('top-center')"
          [notification]="notification"
          (dismiss)="onDismiss($event)"
          (actionClick)="onActionClick($event)"
          class="pointer-events-auto">
        </app-notification>
      </div>

      <!-- Bottom Right -->
      <div class="absolute bottom-0 right-0 flex flex-col-reverse items-end">
        <app-notification
          *ngFor="let notification of getNotificationsByPosition('bottom-right')"
          [notification]="notification"
          (dismiss)="onDismiss($event)"
          (actionClick)="onActionClick($event)"
          class="pointer-events-auto">
        </app-notification>
      </div>

      <!-- Bottom Left -->
      <div class="absolute bottom-0 left-0 flex flex-col-reverse items-start">
        <app-notification
          *ngFor="let notification of getNotificationsByPosition('bottom-left')"
          [notification]="notification"
          (dismiss)="onDismiss($event)"
          (actionClick)="onActionClick($event)"
          class="pointer-events-auto">
        </app-notification>
      </div>

      <!-- Bottom Center -->
      <div class="absolute bottom-0 left-1/2 transform -translate-x-1/2 flex flex-col-reverse items-center">
        <app-notification
          *ngFor="let notification of getNotificationsByPosition('bottom-center')"
          [notification]="notification"
          (dismiss)="onDismiss($event)"
          (actionClick)="onActionClick($event)"
          class="pointer-events-auto">
        </app-notification>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationContainerComponent {
  constructor(private notificationService: NotificationService) {}

  get notifications$() {
    return this.notificationService.notifications$;
  }

  getNotificationsByPosition(position: string): NotificationConfig[] {
    return this.notificationService.getNotificationsByPosition(position);
  }

  onDismiss(id: string): void {
    this.notificationService.dismiss(id);
  }

  onActionClick(id: string): void {
    // Action is already handled in the notification component
    // This is just for additional tracking if needed
  }
}
EOF

# =============================================================================
# MODAL COMPONENT
# =============================================================================

echo "🪟 Creating Modal component..."
cat > shared/components/feedback/modal/modal.component.ts << 'EOF'
import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { ModalConfig } from '../feedback.types';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('backdropFade', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0 }))
      ])
    ]),
    trigger('modalSlide', [
      transition(':enter', [
        style({ transform: 'scale(0.95)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'scale(1)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ transform: 'scale(0.95)', opacity: 0 }))
      ])
    ])
  ]
})
export class ModalComponent {
  @Input() config: ModalConfig = {};
  @Input() visible = false;
  @Input() showCloseButton = true;
  @Input() showHeader = true;

  @Output() close = new EventEmitter<void>();
  @Output() backdropClick = new EventEmitter<void>();

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent): void {
    if (this.config.keyboard !== false && this.visible) {
      this.onClose();
    }
  }

  onClose(): void {
    this.close.emit();
  }

  onBackdropClick(event: Event): void {
    if (this.config.backdrop !== false) {
      this.backdropClick.emit();
      this.onClose();
    }
  }

  onModalClick(event: Event): void {
    // Prevent backdrop click when clicking inside modal
    event.stopPropagation();
  }

  get modalClasses(): string {
    const baseClasses = 'modal-content bg-white rounded-lg shadow-xl transform transition-all';
    
    const sizeClasses = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl'
    };

    const size = this.config.size || 'md';
    const sizeClass = sizeClasses[size];

    let positionClasses = 'mx-auto';
    if (this.config.centered) {
      positionClasses += ' my-auto';
    } else {
      positionClasses += ' mt-20 mb-8';
    }

    let additionalClasses = '';
    if (this.config.fullscreen === true) {
      additionalClasses = 'w-full h-full max-w-none max-h-none rounded-none';
    } else if (this.config.fullscreen && typeof this.config.fullscreen === 'string') {
      // Handle responsive fullscreen
      const breakpoint = this.config.fullscreen;
      additionalClasses = `${breakpoint}:w-full ${breakpoint}:h-full ${breakpoint}:max-w-none ${breakpoint}:max-h-none ${breakpoint}:rounded-none`;
    }

    const customClasses = Array.isArray(this.config.panelClass) 
      ? this.config.panelClass.join(' ')
      : this.config.panelClass || '';

    return [baseClasses, sizeClass, positionClasses, additionalClasses, customClasses]
      .filter(Boolean)
      .join(' ');
  }

  get containerClasses(): string {
    let classes = 'flex min-h-screen items-start justify-center p-4';
    
    if (this.config.centered) {
      classes = 'flex min-h-screen items-center justify-center p-4';
    }

    if (this.config.scrollable) {
      classes += ' overflow-y-auto';
    }

    return classes;
  }
}
EOF

cat > shared/components/feedback/modal/modal.component.html << 'EOF'
<!-- Modal Backdrop -->
<div 
  *ngIf="visible"
  class="modal-backdrop fixed inset-0 z-50 bg-black bg-opacity-50"
  [@backdropFade]
  (click)="onBackdropClick($event)">
  
  <!-- Modal Container -->
  <div [class]="containerClasses">
    
    <!-- Modal Content -->
    <div 
      [class]="modalClasses"
      [@modalSlide]
      (click)="onModalClick($event)"
      role="dialog"
      [attr.aria-modal]="true"
      [attr.aria-labelledby]="config.title ? 'modal-title' : null">
      
      <!-- Modal Header -->
      <div 
        *ngIf="showHeader && (config.title || showCloseButton)"
        class="modal-header flex items-center justify-between p-6 border-b border-gray-200">
        
        <h2 
          *ngIf="config.title"
          id="modal-title"
          class="text-lg font-semibold text-gray-900">
          {{ config.title }}
        </h2>
        
        <div class="flex-1" *ngIf="!config.title"></div>
        
        <button
          *ngIf="showCloseButton"
          type="button"
          mat-icon-button
          class="text-gray-400 hover:text-gray-600"
          (click)="onClose()"
          [attr.aria-label]="'Close modal'">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Modal Body -->
      <div class="modal-body">
        <ng-content></ng-content>
      </div>

      <!-- Modal Footer Slot -->
      <div class="modal-footer" *ngIf="hasFooterContent">
        <ng-content select="[slot=footer]"></ng-content>
      </div>
    </div>
  </div>
</div>
EOF

cat > shared/components/feedback/modal/modal.component.scss << 'EOF'
.modal-backdrop {
  backdrop-filter: blur(4px);
}

.modal-content {
  max-height: calc(100vh - 2rem);
  display: flex;
  flex-direction: column;
  
  .modal-body {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
  }

  .modal-footer {
    padding: 1rem 1.5rem;
    border-top: 1px solid #e5e7eb;
    background-color: #f9fafb;
    border-bottom-left-radius: inherit;
    border-bottom-right-radius: inherit;
  }
}

// Responsive adjustments
@media (max-width: 640px) {
  .modal-content {
    margin: 1rem;
    max-width: calc(100vw - 2rem);
    max-height: calc(100vh - 2rem);
    
    &.sm\:w-full {
      width: calc(100vw - 2rem);
      height: calc(100vh - 2rem);
      max-width: none;
      max-height: none;
      border-radius: 0.5rem;
    }
  }
}

// Scrollable modal
.modal-content.scrollable {
  .modal-body {
    max-height: 60vh;
  }
}

// Animation improvements
.modal-content {
  transform-origin: center;
  will-change: transform, opacity;
}

// Focus trap (basic styling)
.modal-content:focus {
  outline: none;
}

// Hide scrollbar for webkit browsers in modal body
.modal-body::-webkit-scrollbar {
  width: 6px;
}

.modal-body::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.modal-body::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.modal-body::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}
EOF

# =============================================================================
# CONFIRM DIALOG COMPONENT
# =============================================================================

echo "❓ Creating Confirm Dialog component..."
cat > shared/components/feedback/confirm-dialog/confirm-dialog.component.ts << 'EOF'
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
EOF

cat > shared/components/feedback/confirm-dialog/confirm-dialog.component.html << 'EOF'
<div class="confirm-dialog p-6">
  
  <!-- Header with Icon -->
  <div class="flex items-center mb-4">
    <div class="flex-shrink-0 mr-4">
      <mat-icon [class]="iconColor" class="text-3xl">{{ iconName }}</mat-icon>
    </div>
    <div class="flex-1">
      <h2 [class]="titleClasses">{{ config.title }}</h2>
    </div>
  </div>

  <!-- Message -->
  <div class="mb-6">
    <p class="text-gray-700 leading-relaxed">{{ config.message }}</p>
  </div>

  <!-- Actions -->
  <div class="flex items-center justify-end space-x-3">
    <button
      type="button"
      mat-button
      (click)="onCancel()">
      {{ config.cancelText }}
    </button>
    
    <button
      type="button"
      mat-raised-button
      [color]="confirmButtonColor"
      (click)="onConfirm()"
      cdkTrapFocus>
      {{ config.confirmText }}
    </button>
  </div>
</div>
EOF

cat > shared/components/feedback/confirm-dialog/confirm-dialog.component.scss << 'EOF'
.confirm-dialog {
  min-width: 320px;
  max-width: 500px;

  .mat-mdc-button,
  .mat-mdc-raised-button {
    min-width: 80px;
  }
}

// Responsive adjustments
@media (max-width: 480px) {
  .confirm-dialog {
    min-width: 280px;
    padding: 1rem;

    .flex.items-center.justify-end {
      flex-direction: column-reverse;
      align-items: stretch;
      gap: 0.5rem;

      .mat-mdc-button,
      .mat-mdc-raised-button {
        width: 100%;
        margin: 0;
      }
    }
  }
}
EOF

# =============================================================================
# MODAL SERVICE
# =============================================================================

echo "🎛️ Creating Modal Service..."
cat > shared/components/feedback/modal.service.ts << 'EOF'
import { Injectable, ComponentRef, ViewContainerRef, Type } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { ConfirmDialogComponent } from './confirm-dialog/confirm-dialog.component';
import { ConfirmDialogConfig, ConfirmDialogResult, ModalConfig } from './feedback.types';

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  constructor(private dialog: MatDialog) {}

  /**
   * Open a confirm dialog
   */
  confirm(config: ConfirmDialogConfig): Observable<ConfirmDialogResult> {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: config.width || '400px',
      data: config,
      disableClose: true,
      autoFocus: true
    });

    return dialogRef.afterClosed();
  }

  /**
   * Open a custom component as modal
   */
  open<T, R = any>(
    component: Type<T>,
    config?: ModalConfig & { data?: any }
  ): MatDialogRef<T, R> {
    const dialogConfig = {
      width: this.getSizeWidth(config?.size),
      maxWidth: '95vw',
      maxHeight: '95vh',
      data: config?.data,
      disableClose: config?.backdrop === false,
      autoFocus: true,
      restoreFocus: true,
      panelClass: config?.panelClass,
      ...config
    };

    return this.dialog.open(component, dialogConfig);
  }

  /**
   * Close all open dialogs
   */
  closeAll(): void {
    this.dialog.closeAll();
  }

  /**
   * Get open dialogs count
   */
  get openDialogs(): MatDialogRef<any>[] {
    return this.dialog.openDialogs;
  }

  /**
   * Quick confirm dialogs
   */
  confirmDelete(itemName?: string): Observable<ConfirmDialogResult> {
    return this.confirm({
      title: 'Confirm Delete',
      message: itemName 
        ? `Are you sure you want to delete "${itemName}"? This action cannot be undone.`
        : 'Are you sure you want to delete this item? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
      icon: 'delete'
    });
  }

  confirmAction(action: string, description?: string): Observable<ConfirmDialogResult> {
    return this.confirm({
      title: `Confirm ${action}`,
      message: description || `Are you sure you want to ${action.toLowerCase()}?`,
      confirmText: action,
      cancelText: 'Cancel',
      type: 'default'
    });
  }

  confirmWarning(message: string, title = 'Warning'): Observable<ConfirmDialogResult> {
    return this.confirm({
      title,
      message,
      confirmText: 'Continue',
      cancelText: 'Cancel',
      type: 'warning'
    });
  }

  private getSizeWidth(size?: string): string {
    const sizes = {
      sm: '300px',
      md: '500px',
      lg: '700px',
      xl: '900px'
    };

    return sizes[size as keyof typeof sizes] || sizes.md;
  }
}
EOF

# =============================================================================
# CREATE INDEX FILES AND EXAMPLES
# =============================================================================

echo "📝 Creating index files..."

cat > shared/components/feedback/index.ts << 'EOF'
export * from './feedback.types';
export * from './notification.service';
export * from './modal.service';
export * from './notification/notification.component';
export * from './notification-container.component';
export * from './modal/modal.component';
export * from './confirm-dialog/confirm-dialog.component';
EOF

# Update main components index
cat > shared/components/index.ts << 'EOF'
export * from './ui';
export * from './layout';
export * from './data';
export * from './forms';
export * from './feedback';
EOF

# =============================================================================
# CREATE USAGE EXAMPLES
# =============================================================================

echo "📖 Creating usage examples..."
cat > shared/components/feedback/examples.md << 'EOF'
# Feedback Components Usage Examples

## Notification Service

### Basic Usage
```typescript
import { NotificationService } from './shared/components/feedback';

@Component({...})
export class MyComponent {
  constructor(private notificationService: NotificationService) {}

  showSuccess() {
    this.notificationService.success('Operation completed successfully!');
  }

  showError() {
    this.notificationService.error(
      'Something went wrong. Please try again.',
      'Error'
    );
  }

  showWarning() {
    this.notificationService.warning(
      'This action cannot be undone.',
      'Warning'
    );
  }

  showInfo() {
    this.notificationService.info(
      'New features are available.',
      'Information'
    );
  }
}
```

### Advanced Notifications
```typescript
// Custom positioned notification
this.notificationService.show({
  message: 'File uploaded successfully',
  type: 'success',
  position: 'bottom-right',
  duration: 3000,
  icon: 'cloud_upload'
});

// Persistent notification with action
this.notificationService.show({
  title: 'Update Available',
  message: 'A new version of the app is available.',
  type: 'info',
  duration: 0, // Persistent
  action: {
    label: 'Update Now',
    handler: () => this.updateApp()
  }
});

// Custom notification
const notificationId = this.notificationService.show({
  message: 'Processing your request...',
  type: 'info',
  duration: 0,
  dismissible: false
});

// Later dismiss it
setTimeout(() => {
  this.notificationService.dismiss(notificationId);
}, 5000);
```

## Modal Service

### Confirm Dialogs
```typescript
import { ModalService } from './shared/components/feedback';

@Component({...})
export class UserListComponent {
  constructor(private modalService: ModalService) {}

  deleteUser(user: User) {
    this.modalService.confirmDelete(user.name).subscribe(result => {
      if (result.confirmed) {
        this.userService.delete(user.id).subscribe();
      }
    });
  }

  publishPost() {
    this.modalService.confirmAction('Publish', 
      'This will make your post visible to everyone.'
    ).subscribe(result => {
      if (result.confirmed) {
        this.postService.publish().subscribe();
      }
    });
  }

  dangerousAction() {
    this.modalService.confirmWarning(
      'This will permanently delete all data. This action cannot be undone.',
      'Dangerous Action'
    ).subscribe(result => {
      if (result.confirmed) {
        this.performDangerousAction();
      }
    });
  }
}
```

### Custom Modal Component
```typescript
// 1. Create your modal component
@Component({
  selector: 'app-user-form-modal',
  template: `
    <div class="p-6">
      <h2 class="text-xl font-semibold mb-4">{{ data.title }}</h2>
      
      <app-dynamic-form
        [config]="formConfig"
        [initialData]="data.user"
        (formSubmit)="onSubmit($event)">
      </app-dynamic-form>
    </div>
    
    <div slot="footer" class="flex justify-end space-x-3">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-raised-button color="primary" (click)="onSave()">Save</button>
    </div>
  `
})
export class UserFormModalComponent {
  constructor(
    private dialogRef: MatDialogRef<UserFormModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  onSubmit(formData: any) {
    this.dialogRef.close({ action: 'save', data: formData });
  }

  onCancel() {
    this.dialogRef.close({ action: 'cancel' });
  }
}

// 2. Use the modal
@Component({...})
export class UserListComponent {
  constructor(private modalService: ModalService) {}

  editUser(user: User) {
    const dialogRef = this.modalService.open(UserFormModalComponent, {
      size: 'lg',
      data: { title: 'Edit User', user }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.action === 'save') {
        this.userService.update(user.id, result.data).subscribe();
      }
    });
  }
}
```

## Custom Modal Component (Non-Service)

```typescript
@Component({
  template: `
    <app-modal
      [visible]="isVisible"
      [config]="modalConfig"
      (close)="onClose()">
      
      <div class="p-6">
        <h3 class="text-lg font-semibold mb-4">Settings</h3>
        <!-- Your content here -->
      </div>
      
      <div slot="footer" class="flex justify-end space-x-3">
        <button mat-button (click)="onClose()">Cancel</button>
        <button mat-raised-button color="primary">Save</button>
      </div>
    </app-modal>
  `
})
export class SettingsComponent {
  isVisible = false;
  modalConfig: ModalConfig = {
    title: 'Application Settings',
    size: 'lg',
    centered: true
  };

  openSettings() {
    this.isVisible = true;
  }

  onClose() {
    this.isVisible = false;
  }
}
```

## Notification Container Setup

Add to your app.component.html:
```html
<div class="app-container">
  <router-outlet></router-outlet>
  
  <!-- Add notification container -->
  <app-notification-container></app-notification-container>
</div>
```

## Advanced Modal Configurations

```typescript
// Fullscreen modal
this.modalService.open(LargeDataComponent, {
  fullscreen: true
});

// Responsive fullscreen
this.modalService.open(ReportComponent, {
  fullscreen: 'md-down', // Fullscreen on medium screens and below
  size: 'xl'
});

// Custom styled modal
this.modalService.open(CustomComponent, {
  panelClass: ['custom-modal', 'no-padding'],
  backdrop: true,
  keyboard: true,
  scrollable: true
});

// Modal with custom data
this.modalService.open(DataDisplayComponent, {
  data: {
    title: 'Data Report',
    items: this.selectedItems,
    readonly: true
  }
});
```

## Notification Positioning

```typescript
// Different positions
this.notificationService.show({
  message: 'Top right notification',
  type: 'info',
  position: 'top-right'
});

this.notificationService.show({
  message: 'Bottom center notification',
  type: 'success',
  position: 'bottom-center'
});

// Multiple notifications will stack in their respective positions
```

## Integration with Forms

```typescript
@Component({...})
export class UserFormComponent {
  constructor(
    private notificationService: NotificationService,
    private modalService: ModalService
  ) {}

  onSave(userData: any) {
    this.userService.save(userData).subscribe({
      next: (user) => {
        this.notificationService.success(
          `User ${user.name} saved successfully!`
        );
      },
      error: (error) => {
        this.notificationService.error(
          'Failed to save user. Please try again.',
          'Save Error'
        );
      }
    });
  }

  onDelete(user: User) {
    this.modalService.confirmDelete(user.name).subscribe(result => {
      if (result.confirmed) {
        this.userService.delete(user.id).subscribe({
          next: () => {
            this.notificationService.success('User deleted successfully');
          },
          error: () => {
            this.notificationService.error('Failed to delete user');
          }
        });
      }
    });
  }
}
```
EOF

echo "✅ Feedback Components structure created successfully!"
echo ""
echo "💬 Created components:"
echo "   ✅ Notification System (toast notifications)"
echo "   ✅ Notification Container (position management)"
echo "   ✅ Modal Component (custom modal dialogs)"
echo "   ✅ Confirm Dialog (confirmation dialogs)"
echo "   ✅ Modal Service (modal management)"
echo "   ✅ Notification Service (notification management)"
echo ""
echo "🚀 Key Features:"
echo "   • Toast notifications with 6 position options"
echo "   • Auto-dismiss with configurable duration"
echo "   • Action buttons in notifications"
echo "   • Responsive modal dialogs"
echo "   • Confirm dialogs with different types"
echo "   • Service-based modal management"
echo "   • Backdrop and keyboard controls"
echo "   • Smooth animations and transitions"
echo "   • Accessibility support (ARIA labels, focus trap)"
echo "   • Mobile-responsive design"
echo ""
echo "📋 Notification Types:"
echo "   • Success (green) - Operation completed"
echo "   • Error (red) - Something went wrong"
echo "   • Warning (yellow) - Important information"
echo "   • Info (blue) - General information"
echo ""
echo "🪟 Modal Features:"
echo "   • Multiple sizes (sm, md, lg, xl)"
echo "   • Fullscreen support (responsive)"
echo "   • Centered positioning"
echo "   • Scrollable content"
echo "   • Custom panel classes"
echo "   • Header/footer slots"
echo ""
echo "💡 Usage:"
echo "   // Notifications"
echo "   this.notificationService.success('User saved!');"
echo "   "
echo "   // Confirm dialogs"
echo "   this.modalService.confirmDelete('John Doe').subscribe(...);"
echo "   "
echo "   // Custom modals"
echo "   this.modalService.open(MyComponent, { size: 'lg' });"
echo ""
echo "📦 Integration:"
echo "   1. Add <app-notification-container> to app.component.html"
echo "   2. Import MatDialogModule in your app module"
echo "   3. Inject services where needed"
echo ""
echo "🔧 Dependencies:"
echo "   • Angular Material Dialog"
echo "   • Angular Animations"
echo "   • Tailwind CSS"
echo "   • RxJS"