import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-credits-balance-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  templateUrl: './credits-balance-card.component.html',
  styleUrls: ['./credits-balance-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreditsBalanceCardComponent {
  @Input({ required: true }) balance = 0;
  @Input({ required: true }) costPerGeneration = 1;
}
