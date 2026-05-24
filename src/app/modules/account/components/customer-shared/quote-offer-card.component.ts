import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { Quote } from '../../../../shared/construction/construction.types';

@Component({
  selector: 'app-quote-offer-card',
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  templateUrl: './quote-offer-card.component.html',
  styleUrls: ['./quote-offer-card.component.scss'],
})
export class QuoteOfferCardComponent {
  @Input({ required: true }) quote!: Quote;
  @Input() typeLabel = 'Arquitectura';
  @Input() statusLabel = '';
  @Input() statusClass = 'cp-badge--neutral';
  @Input() amountFormatted = '';
  @Input() canRespond = false;
  @Input() actionDisabled = false;

  @Output() accept = new EventEmitter<Quote>();
  @Output() reject = new EventEmitter<Quote>();
}
