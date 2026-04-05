export interface FormField {
  name: string;
  type: FormFieldType;
  label: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  value?: any;
  defaultValue?: any;
  options?: SelectOption[];
  validation?: ValidationConfig;
  grid?: GridConfig;
  conditional?: ConditionalConfig;
  helpText?: string;
  prefix?: string;
  suffix?: string;
  multiple?: boolean;
  accept?: string; // for file inputs
  maxFiles?: number; // for file inputs
  maxFileSize?: number; // in bytes
  appearance?: 'fill' | 'outline' | 'legacy' | 'standard';
}

export type FormFieldType = 
  | 'text' 
  | 'email' 
  | 'password' 
  | 'number' 
  | 'tel' 
  | 'url'
  | 'textarea' 
  | 'select' 
  | 'multiselect'
  | 'radio' 
  | 'checkbox'
  | 'date' 
  | 'datetime'
  | 'time'
  | 'file'
  | 'search'
  | 'range'
  | 'color'
  | 'hidden';

export interface SelectOption {
  value: any;
  label: string;
  disabled?: boolean;
  icon?: string;
}

export interface ValidationConfig {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string | RegExp;
  email?: boolean;
  custom?: (value: any) => string | null;
}

export interface GridConfig {
  xs?: number; // 1-12
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
}

export interface ConditionalConfig {
  field: string;
  operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'greater' | 'less';
  value: any;
}

export interface FormConfig {
  fields: FormField[];
  layout?: 'vertical' | 'horizontal' | 'inline';
  submitText?: string;
  cancelText?: string;
  showSubmit?: boolean;
  showCancel?: boolean;
  autoSave?: boolean;
  validateOnChange?: boolean;
}

export interface FormValidationError {
  field: string;
  message: string;
  type: string;
}
