# Dynamic Forms Usage Examples

## Basic Form Configuration

```typescript
import { FormConfig, FormField } from './shared/components/forms';

export const USER_FORM: FormConfig = {
  fields: [
    {
      name: 'first_name',
      type: 'text',
      label: 'First Name',
      required: true,
      grid: { xs: 12, md: 6 },
      validation: { minLength: 2, maxLength: 50 }
    },
    {
      name: 'last_name',
      type: 'text',
      label: 'Last Name',
      required: true,
      grid: { xs: 12, md: 6 },
      validation: { minLength: 2, maxLength: 50 }
    },
    {
      name: 'email',
      type: 'email',
      label: 'Email Address',
      required: true,
      grid: { xs: 12 },
      validation: { email: true }
    },
    {
      name: 'phone',
      type: 'tel',
      label: 'Phone Number',
      grid: { xs: 12, md: 6 },
      validation: { pattern: /^[\+]?[0-9\s\-\(\)]+$/ }
    },
    {
      name: 'date_of_birth',
      type: 'date',
      label: 'Date of Birth',
      grid: { xs: 12, md: 6 }
    },
    {
      name: 'department',
      type: 'select',
      label: 'Department',
      required: true,
      grid: { xs: 12, md: 6 },
      options: [
        { value: 'engineering', label: 'Engineering' },
        { value: 'marketing', label: 'Marketing' },
        { value: 'sales', label: 'Sales' },
        { value: 'hr', label: 'Human Resources' }
      ]
    },
    {
      name: 'skills',
      type: 'multiselect',
      label: 'Skills',
      grid: { xs: 12, md: 6 },
      options: [
        { value: 'javascript', label: 'JavaScript' },
        { value: 'typescript', label: 'TypeScript' },
        { value: 'angular', label: 'Angular' },
        { value: 'react', label: 'React' }
      ]
    },
    {
      name: 'bio',
      type: 'textarea',
      label: 'Biography',
      grid: { xs: 12 },
      helpText: 'Tell us about yourself',
      validation: { maxLength: 500 }
    },
    {
      name: 'resume',
      type: 'file',
      label: 'Resume',
      grid: { xs: 12 },
      accept: '.pdf,.doc,.docx',
      maxFileSize: 5 * 1024 * 1024 // 5MB
    },
    {
      name: 'terms_accepted',
      type: 'checkbox',
      label: 'I accept the terms and conditions',
      required: true,
      grid: { xs: 12 }
    }
  ],
  submitText: 'Create User',
  cancelText: 'Cancel',
  showSubmit: true,
  showCancel: true,
  validateOnChange: true
};
```

## Component Usage

```typescript
@Component({
  template: `
    <app-dynamic-form
      [config]="formConfig"
      [initialData]="initialData"
      [loading]="isSubmitting"
      (formReady)="onFormReady($event)"
      (formSubmit)="onFormSubmit($event)"
      (formCancel)="onFormCancel()"
      (formChange)="onFormChange($event)">
    </app-dynamic-form>
  `
})
export class UserFormComponent {
  formConfig = USER_FORM;
  initialData = { department: 'engineering' };
  isSubmitting = false;
  
  form: FormGroup;

  onFormReady(form: FormGroup): void {
    this.form = form;
  }

  onFormSubmit(data: any): void {
    this.isSubmitting = true;
    
    this.userService.createUser(data).subscribe({
      next: (user) => {
        this.isSubmitting = false;
        // Handle success
      },
      error: (error) => {
        this.isSubmitting = false;
        // Handle error
      }
    });
  }

  onFormCancel(): void {
    // Handle cancel
  }

  onFormChange(data: any): void {
    // Handle form changes
    console.log('Form data:', data);
  }
}
```

## Advanced Form with Conditional Fields

```typescript
export const ADVANCED_FORM: FormConfig = {
  fields: [
    {
      name: 'employment_type',
      type: 'radio',
      label: 'Employment Type',
      required: true,
      options: [
        { value: 'full_time', label: 'Full Time' },
        { value: 'part_time', label: 'Part Time' },
        { value: 'contract', label: 'Contract' }
      ],
      grid: { xs: 12 }
    },
    {
      name: 'contract_duration',
      type: 'number',
      label: 'Contract Duration (months)',
      required: true,
      grid: { xs: 12, md: 6 },
      conditional: {
        field: 'employment_type',
        operator: 'equals',
        value: 'contract'
      },
      validation: { min: 1, max: 24 }
    },
    {
      name: 'salary_range',
      type: 'range',
      label: 'Expected Salary Range',
      grid: { xs: 12 },
      validation: { min: 30000, max: 200000 },
      helpText: 'Select your expected salary range'
    },
    {
      name: 'preferred_color',
      type: 'color',
      label: 'Preferred Theme Color',
      grid: { xs: 12, md: 6 },
      defaultValue: '#3b82f6'
    },
    {
      name: 'search_jobs',
      type: 'search',
      label: 'Search for Jobs',
      placeholder: 'Type to search available positions...',
      grid: { xs: 12 }
    }
  ],
  layout: 'vertical',
  submitText: 'Submit Application',
  validateOnChange: true
};
```

## Individual Component Usage

### File Upload
```html
<app-file-upload
  [multiple]="true"
  [maxFiles]="5"
  [maxFileSize]="10485760"
  accept="image/*,.pdf"
  [dragDrop]="true"
  [showPreview]="true"
  (filesChange)="onFilesChange($event)">
</app-file-upload>
```

### Search Box
```html
<app-search-box
  placeholder="Search users..."
  [debounceTime]="300"
  [showClearButton]="true"
  (search)="onSearch($event)"
  (clear)="onClear()">
</app-search-box>
```

### Form Field (Standalone)
```html
<app-form-field
  [field]="fieldConfig"
  [control]="formControl"
  [errors]="fieldErrors">
</app-form-field>
```

## Custom Validation Example

```typescript
const customField: FormField = {
  name: 'username',
  type: 'text',
  label: 'Username',
  required: true,
  validation: {
    minLength: 3,
    maxLength: 20,
    pattern: /^[a-zA-Z0-9_]+$/,
    custom: (value: string) => {
      if (value && value.includes('admin')) {
        return 'Username cannot contain "admin"';
      }
      return null;
    }
  }
};
```

## Form with Sections/Steps

```typescript
export const MULTI_STEP_FORM: FormConfig = {
  fields: [
    // Personal Information Section
    ...PERSONAL_INFO_FIELDS,
    
    // Professional Information Section  
    ...PROFESSIONAL_INFO_FIELDS,
    
    // Additional Information Section
    ...ADDITIONAL_INFO_FIELDS
  ],
  submitText: 'Complete Registration',
  validateOnChange: true
};
```
