import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { NotificationConfig, NotificationType } from './feedback.types';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private idCounter = 0;

  constructor(private toastr: ToastrService) {}

  show(config: Partial<NotificationConfig>): string {
    const notificationId = this.generateId();
    const message = config.message || '';
    const title = config.title || '';
    const type = config.type || 'info';
    const duration = config.duration || 5000;

    // Convert our notification type to toastr type
    const toastrType = this.mapNotificationTypeToToastr(type);

    // Show toastr notification
    const toastRef = this.toastr.show(
      message,
      title,
      {
        timeOut: duration > 0 ? duration : 0,
        extendedTimeOut: 1000,
        closeButton: config.dismissible !== false,
        progressBar: true,
        progressAnimation: 'decreasing',
        enableHtml: true,
        toastClass: `ngx-toastr ${this.getCustomToastClass(config)}`,
        positionClass: this.mapPositionToToastr(config.position || 'top-right'),
        ...this.getToastrOptions(config)
      },
      toastrType
    );

    // Handle custom actions if provided
    if (config.action) {
      // For actions, we can add custom HTML or handle differently
      // This is a simplified implementation
      setTimeout(() => {
        if (config.action) {
          config.action.handler();
        }
      }, 1000);
    }

    return notificationId;
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
    // Toastr doesn't support dismissing by custom ID, so we clear all
    // In a real implementation, you might want to track toast references
    this.toastr.clear();
  }

  dismissAll(): void {
    this.toastr.clear();
  }

  getNotificationsByPosition(position: string): NotificationConfig[] {
    // Toastr doesn't provide this functionality directly
    // Return empty array for compatibility
    return [];
  }

  // Additional ngx-toastr specific methods
  clear(): void {
    this.toastr.clear();
  }

  remove(toastId: number): void {
    this.toastr.remove(toastId);
  }

  // Helper methods
  private mapNotificationTypeToToastr(type: NotificationType): string {
    switch (type) {
      case 'success': return 'success';
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'info': return 'info';
      default: return 'info';
    }
  }

  private mapPositionToToastr(position: string): string {
    switch (position) {
      case 'top-right': return 'toast-top-right';
      case 'top-left': return 'toast-top-left';
      case 'top-center': return 'toast-top-center';
      case 'bottom-right': return 'toast-bottom-right';
      case 'bottom-left': return 'toast-bottom-left';
      case 'bottom-center': return 'toast-bottom-center';
      default: return 'toast-top-right';
    }
  }

  private getCustomToastClass(config: Partial<NotificationConfig>): string {
    const classes = ['custom-toast'];
    
    if (config.icon) {
      classes.push(`toast-with-icon-${config.icon}`);
    }
    
    if (config.action) {
      classes.push('toast-with-action');
    }
    
    return classes.join(' ');
  }

  private getToastrOptions(config: Partial<NotificationConfig>): any {
    const options: any = {};
    
    // Add custom options based on notification config
    if (config.icon) {
      options.iconClass = `toast-icon-${config.icon}`;
    }
    
    if (config.action) {
      options.onTap = () => {
        if (config.action) {
          config.action.handler();
        }
      };
    }
    
    return options;
  }

  private generateId(): string {
    return `notification-${++this.idCounter}-${Date.now()}`;
  }
}
