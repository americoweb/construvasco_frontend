import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { STUDIO_PROJECT_TYPES, STUDIO_TIPOLOGIAS } from '../studio-briefing.schema';

@Component({
  selector: 'app-wizard-step-project',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  templateUrl: './wizard-step-project.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WizardStepProjectComponent {
  @Input({ required: true }) form!: FormGroup;

  readonly projectTypes = STUDIO_PROJECT_TYPES;
  readonly tipologias = STUDIO_TIPOLOGIAS;
}
