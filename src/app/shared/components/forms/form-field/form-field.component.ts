import { Component, Input, forwardRef, ChangeDetectionStrategy, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR, FormControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSliderModule } from '@angular/material/slider';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FileUploadComponent } from '../file-upload/file-upload.component';
import { SearchBoxComponent } from '../search-box/search-box.component';
import { FormField } from '../form.types';

@Component({
  selector: 'app-form-field',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatRadioModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSliderModule,
    MatIconModule,
    MatButtonModule,
    FileUploadComponent,
    SearchBoxComponent
  ],
  templateUrl: './form-field.component.html',
  styleUrls: ['./form-field.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FormFieldComponent),
      multi: true
    }
  ]
})
export class FormFieldComponent implements ControlValueAccessor, OnInit {
  @Input() field!: FormField;
  @Input() control!: FormControl;
  @Input() errors: string[] = [];

  value: any = null;
  disabled = false;

  private onChange = (value: any) => {};
  private onTouched = () => {};

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    // Subscribe to control value changes
    if (this.control) {
      this.control.valueChanges.subscribe(value => {
        this.value = value;
        this.cdr.markForCheck();
      });
      
      // Set initial value
      this.value = this.control.value;
    }
  }

  writeValue(value: any): void {
    console.log('FormField writeValue called:', value);
    this.value = value;
    this.cdr.markForCheck();
  }

  registerOnChange(fn: (value: any) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    this.cdr.markForCheck();
  }

  onValueChange(value: any): void {
    this.value = value;
    this.onChange(value);
    this.onTouched();
    
    // Also update the control directly
    if (this.control) {
      this.control.setValue(value, { emitEvent: false });
    }
  }

  onCheckboxChange(checked: boolean): void {
    this.onValueChange(checked);
  }

  onFileChange(files: File[]): void {
    const value = this.field.multiple ? files : files[0];
    this.onValueChange(value);
  }

  get hasErrors(): boolean {
    return this.errors.length > 0;
  }

  get errorMessage(): string {
    return this.errors[0] || '';
  }

  get fieldClasses(): string {
    const classes = ['form-field'];
    
    if (this.hasErrors) {
      classes.push('has-errors');
    }
    
    if (this.field.readonly) {
      classes.push('readonly');
    }
    
    return classes.join(' ');
  }

  get shouldShowField(): boolean {
    // Implement conditional logic here if needed
    // For now, always show the field
    return true;
  }

  trackByValue(index: number, option: any): any {
    return option.value;
  }
}
