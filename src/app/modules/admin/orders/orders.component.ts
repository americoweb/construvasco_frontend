import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './orders.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrdersComponent {
}

