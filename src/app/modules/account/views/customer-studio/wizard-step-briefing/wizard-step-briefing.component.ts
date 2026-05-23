import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { STUDIO_PALETTES, STUDIO_STYLES } from '../studio-briefing.schema';

@Component({
  selector: 'app-wizard-step-briefing',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  templateUrl: './wizard-step-briefing.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WizardStepBriefingComponent {
  @Input({ required: true }) form!: FormGroup;

  readonly styles = STUDIO_STYLES;
  readonly palettes = STUDIO_PALETTES;
}
