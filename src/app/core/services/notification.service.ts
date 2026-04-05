import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Notification } from '../models/common.types';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notifications = new BehaviorSubject<Notification[]>([]);
  private autoHideTimeout = 5000; // 5 seconds

  get notifications$() {
    return this.notifications.asObservable();
  }

  show(notification: Partial<Notification>): void {
    const newNotification: Notification = {
      id: this.generateId(),
      title: notification.title || '',
      message: notification.message || '',
      type: notification.type || 'info',
      timestamp: new Date(),
      read: false,
      ...notification
    };

    const current = this.notifications.value;
    this.notifications.next([...current, newNotification]);

    // Auto-hide after timeout
    if (newNotification.type !== 'error') {
      setTimeout(() => {
        this.remove(newNotification.id);
      }, this.autoHideTimeout);
    }
  }

  success(message: string, title?: string): void {
    this.show({ message, title, type: 'success' });
  }

  error(message: string, title?: string): void {
    this.show({ message, title, type: 'error' });
  }

  warning(message: string, title?: string): void {
    this.show({ message, title, type: 'warning' });
  }

  info(message: string, title?: string): void {
    this.show({ message, title, type: 'info' });
  }

  remove(id: string): void {
    const current = this.notifications.value;
    this.notifications.next(current.filter(n => n.id !== id));
  }

  clear(): void {
    this.notifications.next([]);
  }

  markAsRead(id: string): void {
    const current = this.notifications.value;
    const updated = current.map(n => 
      n.id === id ? { ...n, read: true } : n
    );
    this.notifications.next(updated);
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
