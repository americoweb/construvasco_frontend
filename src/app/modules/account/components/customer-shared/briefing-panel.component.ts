import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface BriefingRow {
  label: string;
  value: string;
}

@Component({
  selector: 'app-briefing-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './briefing-panel.component.html',
  styleUrls: ['./briefing-panel.component.scss'],
})
export class BriefingPanelComponent {
  @Input() title = 'Briefing';
  @Input({ required: true }) rows: BriefingRow[] = [];
}
