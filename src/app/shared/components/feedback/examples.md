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
