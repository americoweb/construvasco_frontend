import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-designs',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './designs.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DesignsComponent {
}

