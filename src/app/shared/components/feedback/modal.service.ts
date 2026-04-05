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
