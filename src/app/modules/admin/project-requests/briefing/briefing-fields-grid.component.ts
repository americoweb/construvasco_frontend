import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { BriefingFieldDef } from './briefing-form.types';

@Component({
  selector: 'app-briefing-fields-grid',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  template: `
    <div class="grid gap-4 sm:grid-cols-2" [formGroup]="formGroup">
      @for (field of fields; track field.key) {
        <div [class.sm:col-span-2]="field.colSpan === 2">
          @switch (field.type) {
            @case ('boolean') {
              <div class="flex items-center py-2">
                <mat-checkbox [formControlName]="field.key" color="primary">
                  {{ field.label }}
                </mat-checkbox>
              </div>
            }
            @case ('textarea') {
              <mat-form-field appearance="outline" class="w-full" subscriptSizing="dynamic">
                <mat-label>{{ field.label }}</mat-label>
                <textarea
                  matInput
                  [formControlName]="field.key"
                  rows="3"
                  [placeholder]="field.placeholder || ''"></textarea>
                @if (field.hint) {
                  <mat-hint>{{ field.hint }}</mat-hint>
                }
              </mat-form-field>
            }
            @case ('select') {
              <mat-form-field appearance="outline" class="w-full" subscriptSizing="dynamic">
                <mat-label>{{ field.label }}</mat-label>
                <mat-select [formControlName]="field.key">
                  <mat-option [value]="null">—</mat-option>
                  @for (opt of field.options; track opt.value) {
                    <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            }
            @case ('number') {
              <mat-form-field appearance="outline" class="w-full" subscriptSizing="dynamic">
                <mat-label>{{ field.label }}</mat-label>
                <input
                  matInput
                  type="number"
                  [formControlName]="field.key"
                  [min]="field.min ?? null"
                  [max]="field.max ?? null"
                  [step]="field.step ?? 1" />
              </mat-form-field>
            }
            @case ('date') {
              <mat-form-field appearance="outline" class="w-full" subscriptSizing="dynamic">
                <mat-label>{{ field.label }}</mat-label>
                <input matInput [matDatepicker]="dp" [formControlName]="field.key" />
                <mat-datepicker-toggle matIconSuffix [for]="dp" />
                <mat-datepicker #dp />
              </mat-form-field>
            }
            @default {
              <mat-form-field appearance="outline" class="w-full" subscriptSizing="dynamic">
                <mat-label>{{ field.label }}</mat-label>
                <input
                  matInput
                  [formControlName]="field.key"
                  [placeholder]="field.placeholder || ''" />
                @if (field.hint) {
                  <mat-hint>{{ field.hint }}</mat-hint>
                }
              </mat-form-field>
            }
          }
        </div>
      }
    </div>
  `,
})
export class BriefingFieldsGridComponent {
  @Input({ required: true }) fields!: BriefingFieldDef[];
  @Input({ required: true }) formGroup!: FormGroup;
}
