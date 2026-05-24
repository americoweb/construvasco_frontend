import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-approved-mockup-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './approved-mockup-card.component.html',
  styleUrls: ['./approved-mockup-card.component.scss'],
})
export class ApprovedMockupCardComponent {
  @Input({ required: true }) imageUrl!: string;
  @Input() caption = 'Mockup aprovado para este projecto';
}
