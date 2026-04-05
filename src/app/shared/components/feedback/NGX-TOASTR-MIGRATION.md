# ngx-toastr Migration Guide

## Overview

The notification service has been transformed to use **ngx-toastr** instead of a custom implementation. This provides:

- ✅ Better performance and reliability
- ✅ More features and customization options
- ✅ Better browser compatibility
- ✅ Active maintenance and community support
- ✅ Built-in animations and accessibility

## Installation

```bash
npm install ngx-toastr
```

## Configuration

### 1. App Configuration (app.config.ts)

```typescript
import { provideToastr } from 'ngx-toastr';

export const appConfig: ApplicationConfig = {
  providers: [
    // ... other providers
    provideToastr({
      timeOut: 5000,
      extendedTimeOut: 1000,
      closeButton: true,
      progressBar: true,
      progressAnimation: 'decreasing',
      enableHtml: true,
      preventDuplicates: false,
      newestOnTop: true,
      maxOpened: 5,
      autoDismiss: true,
      positionClass: 'toast-top-right',
      toastClass: 'ngx-toastr custom-toast',
      titleClass: 'toast-title',
      messageClass: 'toast-message',
      easing: 'ease-in',
      easeTime: 300,
      tapToDismiss: true,
      onActivateTick: false,
      iconClasses: {
        error: 'toast-error',
        info: 'toast-info',
        success: 'toast-success',
        warning: 'toast-warning'
      }
    }),
  ]
}
```

### 2. Styles (styles.scss)

```scss
/* ngx-toastr imports */
@import 'ngx-toastr/toastr';

/* Custom toastr styles to match app design */
.custom-toast {
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border: none;
  font-family: inherit;
  
  &.toast-success {
    background-color: #10b981;
    color: white;
  }
  
  &.toast-error {
    background-color: #ef4444;
    color: white;
  }
  
  &.toast-warning {
    background-color: #f59e0b;
    color: white;
  }
  
  &.toast-info {
    background-color: #3b82f6;
    color: white;
  }
}
```

## Usage

### Basic Usage

```typescript
import { NotificationService } from './shared/components/feedback/notification.service';

@Component({...})
export class MyComponent {
  constructor(private notificationService: NotificationService) {}

  showSuccess() {
    this.notificationService.success('Operation completed successfully!');
  }

  showError() {
    this.notificationService.error('Something went wrong.', 'Error');
  }

  showWarning() {
    this.notificationService.warning('This action cannot be undone.', 'Warning');
  }

  showInfo() {
    this.notificationService.info('New features are available.', 'Information');
  }
}
```

### Advanced Usage

```typescript
// Custom notification with all options
this.notificationService.show({
  message: 'File uploaded successfully',
  title: 'Upload Complete',
  type: 'success',
  position: 'bottom-right',
  duration: 3000,
  icon: 'check_circle',
  dismissible: true
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

// HTML content in notifications
this.notificationService.show({
  message: '<strong>Bold text</strong> and <em>italic text</em>',
  type: 'info',
  title: 'HTML Content'
});
```

### Positioning Examples

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

this.notificationService.show({
  message: 'Top left notification',
  type: 'warning',
  position: 'top-left'
});

this.notificationService.show({
  message: 'Bottom left notification',
  type: 'error',
  position: 'bottom-left'
});
```

## API Compatibility

The service maintains backward compatibility with the original API:

### Original Methods (Still Work)
```typescript
// These methods work exactly as before
this.notificationService.success(message, title?, options?);
this.notificationService.error(message, title?, options?);
this.notificationService.warning(message, title?, options?);
this.notificationService.info(message, title?, options?);
this.notificationService.show(config);
this.notificationService.dismiss(id);
this.notificationService.dismissAll();
```

### New ngx-toastr Methods
```typescript
// Additional methods from ngx-toastr
this.notificationService.clear(); // Clear all toasts
this.notificationService.remove(toastId); // Remove specific toast
```

## Features

### ✅ What's New with ngx-toastr

1. **Better Performance**: Optimized rendering and memory management
2. **More Positions**: 6 different positions (top/bottom + left/center/right)
3. **HTML Support**: Rich content in notifications
4. **Progress Bars**: Visual progress indicators
5. **Better Animations**: Smooth enter/exit animations
6. **Accessibility**: Built-in ARIA support
7. **Mobile Friendly**: Responsive design
8. **Custom Styling**: Easy to customize with CSS
9. **Action Buttons**: Interactive notifications
10. **Auto-dismiss**: Configurable timeout

### ✅ Maintained Features

1. **Same API**: All existing methods work
2. **Type Safety**: Full TypeScript support
3. **Custom Icons**: Icon support maintained
4. **Positioning**: All position options work
5. **Duration Control**: Configurable timeouts
6. **Action Support**: Custom action buttons
7. **Dismissible**: Manual dismissal support

## Migration Benefits

### Before (Custom Implementation)
- ❌ Limited features
- ❌ Manual state management
- ❌ Basic animations
- ❌ Limited browser support
- ❌ No accessibility features

### After (ngx-toastr)
- ✅ Rich feature set
- ✅ Automatic state management
- ✅ Smooth animations
- ✅ Wide browser support
- ✅ Built-in accessibility
- ✅ Active maintenance
- ✅ Community support

## Examples in Dashboard

The dashboard now includes comprehensive examples:

1. **Basic Notifications**: Success, Error, Warning, Info
2. **Advanced Notifications**: Custom positioning, persistent notifications
3. **ngx-toastr Features**: HTML content, custom styling
4. **Integration Examples**: Form submissions, error handling
5. **Setup Instructions**: Complete implementation guide

## Troubleshooting

### Common Issues

1. **Toasts not showing**: Check if ngx-toastr is properly configured in app.config.ts
2. **Styling issues**: Ensure CSS is imported in styles.scss
3. **Position not working**: Verify position class mapping in the service
4. **Actions not working**: Check if action handler is properly defined

### Debug Mode

Enable debug mode in the toastr configuration:

```typescript
provideToastr({
  // ... other options
  enableDebug: true
})
```

## Conclusion

The migration to ngx-toastr provides a more robust, feature-rich, and maintainable notification system while maintaining full backward compatibility with existing code. 