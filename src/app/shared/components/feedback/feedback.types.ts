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
