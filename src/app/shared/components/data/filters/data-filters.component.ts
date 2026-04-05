import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

export interface FilterField {
  key: string;
  label: string;
  type: 'text' | 'select' | 'multiselect' | 'date' | 'daterange' | 'number';
  options?: { value: any; label: string }[];
  placeholder?: string;
  multiple?: boolean;
}

@Component({
  selector: 'app-data-filters',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule
  ],
  templateUrl: './data-filters.component.html',
  styleUrls: ['./data-filters.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DataFiltersComponent {
  @Input() fields: FilterField[] = [];
  @Input() initialValues: any = {};
  @Input() debounceTime = 300;

  @Output() filtersChange = new EventEmitter<any>();
  @Output() reset = new EventEmitter<void>();

  filterForm!: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.createForm();
    this.subscribeToChanges();
  }

  ngOnChanges(): void {
    if (this.filterForm) {
      this.updateFormValues();
    }
  }

  private createForm(): void {
    const controls: any = {};
    
    this.fields.forEach(field => {
      const initialValue = this.initialValues[field.key] || this.getDefaultValue(field);
      controls[field.key] = [initialValue];
    });

    this.filterForm = this.fb.group(controls);
  }

  private updateFormValues(): void {
    this.fields.forEach(field => {
      const control = this.filterForm.get(field.key);
      const newValue = this.initialValues[field.key] || this.getDefaultValue(field);
      if (control && control.value !== newValue) {
        control.setValue(newValue, { emitEvent: false });
      }
    });
  }

  private getDefaultValue(field: FilterField): any {
    switch (field.type) {
      case 'multiselect':
        return [];
      case 'select':
        return null;
      case 'text':
      case 'number':
        return '';
      case 'date':
      case 'daterange':
        return null;
      default:
        return null;
    }
  }

  private subscribeToChanges(): void {
    this.filterForm.valueChanges
      .pipe(
        debounceTime(this.debounceTime),
        distinctUntilChanged()
      )
      .subscribe(values => {
        const cleanedValues = this.cleanFilterValues(values);
        this.filtersChange.emit(cleanedValues);
      });
  }

  private cleanFilterValues(values: any): any {
    const cleaned: any = {};
    
    Object.keys(values).forEach(key => {
      const value = values[key];
      if (value !== null && value !== undefined && value !== '' && 
          !(Array.isArray(value) && value.length === 0)) {
        cleaned[key] = value;
      }
    });

    return cleaned;
  }

  onReset(): void {
    this.filterForm.reset();
    this.fields.forEach(field => {
      const control = this.filterForm.get(field.key);
      if (control) {
        control.setValue(this.getDefaultValue(field));
      }
    });
    this.reset.emit();
  }

  hasActiveFilters(): boolean {
    const values = this.filterForm.value;
    return Object.keys(values).some(key => {
      const value = values[key];
      return value !== null && value !== undefined && value !== '' && 
             !(Array.isArray(value) && value.length === 0);
    });
  }

  getActiveFiltersCount(): number {
    const values = this.cleanFilterValues(this.filterForm.value);
    return Object.keys(values).length;
  }

  removeFilter(fieldKey: string): void {
    const control = this.filterForm.get(fieldKey);
    if (control) {
      const field = this.fields.find(f => f.key === fieldKey);
      if (field) {
        control.setValue(this.getDefaultValue(field));
      }
    }
  }

  getFieldValue(fieldKey: string): any {
    return this.filterForm.get(fieldKey)?.value;
  }

  getFieldDisplayValue(field: FilterField): string {
    const value = this.getFieldValue(field.key);
    
    if (!value || (Array.isArray(value) && value.length === 0)) {
      return '';
    }

    if (field.type === 'select' || field.type === 'multiselect') {
      if (Array.isArray(value)) {
        const labels = value.map(v => {
          const option = field.options?.find(opt => opt.value === v);
          return option?.label || v;
        });
        return labels.join(', ');
      } else {
        const option = field.options?.find(opt => opt.value === value);
        return option?.label || value;
      }
    }

    if (field.type === 'date') {
      return new Date(value).toLocaleDateString();
    }

    return value.toString();
  }
}
