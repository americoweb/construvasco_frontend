import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tags',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './tags.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TagsComponent {
}

