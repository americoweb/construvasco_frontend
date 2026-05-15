import { Component, Inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { OrderStatus } from '../../shared/order.types';

export interface OrderStatusUpdateDialogData {
  currentStatus: OrderStatus;
  orderNumber: string;
}

export interface OrderStatusUpdateDialogResult {
  status: OrderStatus;
  notes?: string;
}

@Component({
  selector: 'app-order-status-update-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule
  ],
  templateUrl: './order-status-update-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrderStatusUpdateDialogComponent {
  form: FormGroup;
  statusOptions = [
    { value: OrderStatus.PENDING, label: 'Pendente', color: 'yellow' },
    { value: OrderStatus.TRIAGED, label: 'Triado', color: 'blue' },
    { value: OrderStatus.ASSIGNED, label: 'Atribuído', color: 'indigo' },
    { value: OrderStatus.IN_DESIGN, label: 'Em Projeto', color: 'purple' },
    { value: OrderStatus.AWAITING_CLIENT, label: 'Aguardando Cliente', color: 'orange' },
    { value: OrderStatus.APPROVED, label: 'Aprovado', color: 'teal' },
    { value: OrderStatus.IN_EXECUTION, label: 'Em Execução', color: 'cyan' },
    { value: OrderStatus.CONFIRMED, label: 'Confirmado', color: 'blue' },
    { value: OrderStatus.IN_PRODUCTION, label: 'Em Produção', color: 'orange' },
    { value: OrderStatus.SHIPPED, label: 'Enviado', color: 'purple' },
    { value: OrderStatus.DELIVERED, label: 'Entregue', color: 'green' },
    { value: OrderStatus.CANCELLED, label: 'Cancelado', color: 'red' },
  ];
  availableStatuses: Array<{ value: OrderStatus; label: string; color: string }> = [];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<OrderStatusUpdateDialogComponent, OrderStatusUpdateDialogResult>,
    @Inject(MAT_DIALOG_DATA) public data: OrderStatusUpdateDialogData,
    private cdr: ChangeDetectorRef
  ) {
    this.calculateAvailableStatuses();
    
    // Set initial value to first available status, or null if none available
    const initialStatus = this.availableStatuses.length > 0 
      ? this.availableStatuses[0].value 
      : null;

    this.form = this.fb.group({
      status: [initialStatus, Validators.required],
      notes: ['']
    });
    
    // Ensure change detection runs after form initialization
    this.cdr.markForCheck();
  }

  private calculateAvailableStatuses(): void {
    const currentStatus = this.data.currentStatus;
    // Filter out current status and invalid transitions
    this.availableStatuses = this.statusOptions.filter(option => {
      if (option.value === currentStatus) return false;
      
      // Basic validation - can be enhanced with backend validation
      const validTransitions: Partial<Record<OrderStatus, OrderStatus[]>> = {
        [OrderStatus.PENDING]: [OrderStatus.TRIAGED, OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
        [OrderStatus.TRIAGED]: [OrderStatus.ASSIGNED, OrderStatus.CANCELLED],
        [OrderStatus.ASSIGNED]: [OrderStatus.IN_DESIGN, OrderStatus.CANCELLED],
        [OrderStatus.IN_DESIGN]: [OrderStatus.AWAITING_CLIENT, OrderStatus.CANCELLED],
        [OrderStatus.AWAITING_CLIENT]: [OrderStatus.IN_DESIGN, OrderStatus.APPROVED, OrderStatus.CANCELLED],
        [OrderStatus.APPROVED]: [OrderStatus.IN_EXECUTION, OrderStatus.CANCELLED],
        [OrderStatus.IN_EXECUTION]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
        [OrderStatus.CONFIRMED]: [OrderStatus.IN_PRODUCTION, OrderStatus.CANCELLED],
        [OrderStatus.IN_PRODUCTION]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
        [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
        [OrderStatus.DELIVERED]: [],
        [OrderStatus.CANCELLED]: [],
      };

      return validTransitions[currentStatus]?.includes(option.value) ?? false;
    });
    
    // If no valid transitions, allow all statuses except current (for edge cases)
    if (this.availableStatuses.length === 0) {
      this.availableStatuses = this.statusOptions.filter(option => option.value !== currentStatus);
    }
    
    this.cdr.markForCheck();
  }

  get currentStatusLabel(): string {
    const current = this.statusOptions.find(s => s.value === this.data.currentStatus);
    return current?.label || this.data.currentStatus;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.form.valid) {
      this.dialogRef.close({
        status: this.form.value.status,
        notes: this.form.value.notes || undefined
      });
    }
  }

  getStatusColor(status: OrderStatus): string {
    const option = this.statusOptions.find(s => s.value === status);
    return option?.color || 'gray';
  }

  trackByStatus(index: number, status: { value: OrderStatus; label: string; color: string }): OrderStatus {
    return status.value;
  }
}

