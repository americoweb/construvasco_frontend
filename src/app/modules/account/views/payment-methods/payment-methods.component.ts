import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-payment-methods',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payment-methods.component.html',
  styleUrls: ['./payment-methods.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaymentMethodsComponent implements OnInit {
  paymentMethods: any[] = [];
  showForm = false;

  ngOnInit(): void {
    // TODO: Load payment methods from API
  }

  addPaymentMethod(): void {
    this.showForm = true;
  }

  editPaymentMethod(method: any): void {
    // TODO: Edit payment method
  }

  deletePaymentMethod(method: any): void {
    // TODO: Delete payment method
  }

  setAsPrimary(method: any): void {
    // TODO: Set payment method as primary
  }
}

