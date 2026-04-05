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
