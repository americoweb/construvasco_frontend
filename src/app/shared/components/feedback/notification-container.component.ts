import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-notification-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- ngx-toastr handles notifications automatically -->
    <!-- This component is no longer needed with ngx-toastr -->
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationContainerComponent {
  // This component is deprecated - ngx-toastr handles notifications automatically
  // Remove this component from your templates
} 