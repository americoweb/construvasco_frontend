import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { ProjectDocument } from '../../../../../shared/construction/construction.types';

@Component({
  selector: 'app-wizard-step-references',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatListModule],
  templateUrl: './wizard-step-references.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WizardStepReferencesComponent {
  @Input() documents: ProjectDocument[] = [];
  @Input() uploading = false;
  @Output() filesSelected = new EventEmitter<FileList>();

  onFiles(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.filesSelected.emit(input.files);
      input.value = '';
    }
  }
}
