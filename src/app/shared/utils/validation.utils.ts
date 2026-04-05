import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export class ValidationUtils {
  static email(control: AbstractControl): ValidationErrors | null {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    if (!control.value) return null;
    
    return emailRegex.test(control.value) ? null : { email: true };
  }
  
  static minLength(length: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      
      return control.value.length >= length ? null : { 
        minLength: { 
          requiredLength: length, 
          actualLength: control.value.length 
        } 
      };
    };
  }
  
  static maxLength(length: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      
      return control.value.length <= length ? null : { 
        maxLength: { 
          requiredLength: length, 
          actualLength: control.value.length 
        } 
      };
    };
  }
  
  static phoneNumber(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    
    // Simple phone validation - adjust regex based on requirements
    const phoneRegex = /^[+]?[\d\s\-\(\)]{10,}$/;
    
    return phoneRegex.test(control.value) ? null : { phoneNumber: true };
  }
  
  static matchFields(field1: string, field2: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value1 = control.get(field1)?.value;
      const value2 = control.get(field2)?.value;
      
      return value1 === value2 ? null : { matchFields: true };
    };
  }
  
  static fileSize(maxSizeInMB: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const file = control.value as File;
      
      if (!file) return null;
      
      const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
      
      return file.size <= maxSizeInBytes ? null : { 
        fileSize: { 
          maxSize: maxSizeInMB, 
          actualSize: Math.round(file.size / 1024 / 1024 * 100) / 100 
        } 
      };
    };
  }
  
  static fileType(allowedTypes: string[]): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const file = control.value as File;
      
      if (!file) return null;
      
      return allowedTypes.includes(file.type) ? null : { 
        fileType: { 
          allowedTypes, 
          actualType: file.type 
        } 
      };
    };
  }
}
