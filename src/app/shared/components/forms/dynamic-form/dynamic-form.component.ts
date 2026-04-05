import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, OnInit, OnDestroy, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormControl, Validators, ValidatorFn } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';
import { FormFieldComponent } from '../form-field/form-field.component';
import { FormField, FormConfig, FormValidationError } from '../form.types';

@Component({
  selector: 'app-dynamic-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    FormFieldComponent
  ],
  templateUrl: './dynamic-form.component.html',
  styleUrls: ['./dynamic-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DynamicFormComponent implements OnInit, OnDestroy, OnChanges {
  @Input() config!: FormConfig;
  @Input() initialData: any = {};
  @Input() loading = false;
  @Input() disabled = false;

  @Output() formReady = new EventEmitter<FormGroup>();
  @Output() formSubmit = new EventEmitter<any>();
  @Output() formCancel = new EventEmitter<void>();
  @Output() formChange = new EventEmitter<any>();

  form!: FormGroup;
  errors: { [key: string]: string[] } = {};
  
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.createForm();
    this.setupFormSubscriptions();
    this.formReady.emit(this.form);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialData'] && this.form && !changes['initialData'].firstChange) {
      console.log('DynamicForm: initialData changed, updating form:', this.initialData);
      // Update form with new initial data
      this.form.patchValue(this.initialData, { emitEvent: false });
      this.cdr.markForCheck();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createForm(): void {
    const controls: { [key: string]: FormControl } = {};

    this.config.fields.forEach(field => {
      const value = this.initialData[field.name] ?? field.defaultValue ?? this.getDefaultValue(field);
      const validators = this.buildValidators(field);
      controls[field.name] = new FormControl({ value, disabled: field.disabled }, validators);
    });

    this.form = this.fb.group(controls);
  }

  private setupFormSubscriptions(): void {
    if (this.config.validateOnChange) {
      this.form.valueChanges
        .pipe(
          debounceTime(300),
          takeUntil(this.destroy$)
        )
        .subscribe(value => {
          this.updateErrors();
          this.formChange.emit(value);
        });
    } else {
      this.form.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe(value => {
          this.formChange.emit(value);
        });
    }
  }

  private buildValidators(field: FormField): ValidatorFn[] {
    const validators: ValidatorFn[] = [];

    if (field.required) {
      validators.push(Validators.required);
    }

    if (field.validation) {
      const validation = field.validation;

      if (validation.email) {
        validators.push(Validators.email);
      }

      if (validation.minLength !== undefined) {
        validators.push(Validators.minLength(validation.minLength));
      }

      if (validation.maxLength !== undefined) {
        validators.push(Validators.maxLength(validation.maxLength));
      }

      if (validation.min !== undefined) {
        validators.push(Validators.min(validation.min));
      }

      if (validation.max !== undefined) {
        validators.push(Validators.max(validation.max));
      }

      if (validation.pattern) {
        validators.push(Validators.pattern(validation.pattern));
      }

      if (validation.custom) {
        validators.push((control) => {
          const error = validation.custom!(control.value);
          return error ? { custom: { message: error } } : null;
        });
      }
    }

    return validators;
  }

  private getDefaultValue(field: FormField): any {
    switch (field.type) {
      case 'checkbox':
        return false;
      case 'multiselect':
        return [];
      case 'number':
        return null;
      case 'file':
        return field.multiple ? [] : null;
      default:
        return '';
    }
  }

  private updateErrors(): void {
    this.errors = {};
    
    Object.keys(this.form.controls).forEach(fieldName => {
      const control = this.form.get(fieldName);
      if (control && control.errors && control.touched) {
        this.errors[fieldName] = this.getErrorMessages(fieldName, control.errors);
      }
    });
  }

  private getErrorMessages(fieldName: string, errors: any): string[] {
    const field = this.config.fields.find(f => f.name === fieldName);
    const fieldLabel = field?.label || fieldName;
    const messages: string[] = [];

    Object.keys(errors).forEach(errorType => {
      switch (errorType) {
        case 'required':
          messages.push(`${fieldLabel} is required`);
          break;
        case 'email':
          messages.push(`${fieldLabel} must be a valid email address`);
          break;
        case 'minlength':
          messages.push(`${fieldLabel} must be at least ${errors[errorType].requiredLength} characters`);
          break;
        case 'maxlength':
          messages.push(`${fieldLabel} cannot exceed ${errors[errorType].requiredLength} characters`);
          break;
        case 'min':
          messages.push(`${fieldLabel} must be at least ${errors[errorType].min}`);
          break;
        case 'max':
          messages.push(`${fieldLabel} cannot exceed ${errors[errorType].max}`);
          break;
        case 'pattern':
          messages.push(`${fieldLabel} format is invalid`);
          break;
        case 'custom':
          messages.push(errors[errorType].message);
          break;
        default:
          messages.push(`${fieldLabel} is invalid`);
      }
    });

    return messages;
  }

  onSubmit(): void {
    if (this.form.valid) {
      this.formSubmit.emit(this.form.value);
    } else {
      this.markAllFieldsAsTouched();
      this.updateErrors();
    }
  }

  onCancel(): void {
    this.formCancel.emit();
  }

  private markAllFieldsAsTouched(): void {
    Object.keys(this.form.controls).forEach(fieldName => {
      this.form.get(fieldName)?.markAsTouched();
    });
  }

  getFieldErrors(fieldName: string): string[] {
    return this.errors[fieldName] || [];
  }

  getFieldControl(fieldName: string): FormControl {
    return this.form.get(fieldName) as FormControl;
  }

  getGridClasses(field: FormField): string {
    const grid = field.grid;
    if (!grid) return 'col-span-12';

    const classes = [];
    
    if (grid.xs) classes.push(`col-span-${grid.xs}`);
    if (grid.sm) classes.push(`sm:col-span-${grid.sm}`);
    if (grid.md) classes.push(`md:col-span-${grid.md}`);
    if (grid.lg) classes.push(`lg:col-span-${grid.lg}`);
    if (grid.xl) classes.push(`xl:col-span-${grid.xl}`);

    return classes.length > 0 ? classes.join(' ') : 'col-span-12';
  }

  reset(): void {
    this.form.reset();
    this.errors = {};
    
    // Set default values
    this.config.fields.forEach(field => {
      const control = this.form.get(field.name);
      if (control) {
        const value = this.initialData[field.name] ?? field.defaultValue ?? this.getDefaultValue(field);
        control.setValue(value);
      }
    });
  }

  get isValid(): boolean {
    return this.form.valid;
  }

  get isDirty(): boolean {
    return this.form.dirty;
  }

  get hasErrors(): boolean {
    return Object.keys(this.errors).length > 0;
  }
}
