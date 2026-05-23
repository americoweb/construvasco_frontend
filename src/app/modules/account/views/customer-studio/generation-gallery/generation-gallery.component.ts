import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { AiGenerationRecord } from '../../../../../shared/construction/construction.types';

@Component({
  selector: 'app-generation-gallery',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatChipsModule],
  templateUrl: './generation-gallery.component.html',
  styleUrls: ['./generation-gallery.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GenerationGalleryComponent {
  @Input({ required: true }) generations: AiGenerationRecord[] = [];
  @Input() approvedId: number | null = null;
  @Input() disabled = false;
  @Input() showSuperseded = false;
  @Output() approve = new EventEmitter<AiGenerationRecord>();
  @Output() refine = new EventEmitter<AiGenerationRecord>();

  isSuperseded(g: AiGenerationRecord): boolean {
    return g.status === 'superseded';
  }

  isApproved(g: AiGenerationRecord): boolean {
    return this.approvedId === g.id || g.status === 'approved';
  }
}
