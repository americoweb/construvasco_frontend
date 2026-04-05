import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { CardComponent } from '../../../shared/components/ui/card/card.component';
import { DynamicFormComponent } from '../../../shared/components/forms/dynamic-form/dynamic-form.component';
import { FormConfig } from '../../../shared/components/forms/form.types';
import { AuthService } from '../../../core/auth/services/auth.service';
import { ChangePasswordRequest } from '../../../core/auth/models/auth.types';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'settings-security',
  standalone: true,
  imports: [
    CommonModule,
    MatSlideToggleModule,
    MatListModule,
    MatIconModule,
    ButtonComponent,
    CardComponent,
    DynamicFormComponent
  ],
  templateUrl: './security.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsSecurityComponent implements OnInit {
  passwordForm: FormGroup;
  passwordFormValid = false;
  twoFactorEnabled = false;
  isChangingPassword = false;
  
  sessions = [
    { device: 'Chrome - Windows', location: 'Maputo, Moçambique', lastActive: '5 minutos atrás', current: true },
    { device: 'Safari - iPhone', location: 'Maputo, Moçambique', lastActive: '2 horas atrás', current: false },
    { device: 'Firefox - Linux', location: 'Matola, Moçambique', lastActive: '1 dia atrás', current: false }
  ];

  passwordFormConfig: FormConfig = {
    fields: [
      {
        name: 'currentPassword',
        type: 'password',
        label: 'Senha Atual',
        required: true,
        grid: { xs: 12 },
        validation: { required: true }
      },
      {
        name: 'newPassword',
        type: 'password',
        label: 'Nova Senha',
        required: true,
        grid: { xs: 12 },
        validation: { 
          required: true, 
          minLength: 8 
        }
      },
      {
        name: 'confirmPassword',
        type: 'password',
        label: 'Confirmar Nova Senha',
        required: true,
        grid: { xs: 12 },
        validation: { 
          required: true,
          custom: (value: string) => {
            // This will be handled by form validation
            return null;
          }
        }
      }
    ],
    layout: 'vertical',
    showSubmit: false,
    showCancel: false,
    validateOnChange: true
  };

  constructor(
    private cdr: ChangeDetectorRef,
    private authService: AuthService
  ) {}

  ngOnInit(): void {}

  onPasswordFormReady(form: FormGroup): void {
    this.passwordForm = form;
    
    // Add custom validator for password confirmation
    form.get('confirmPassword')?.addValidators((control) => {
      const newPassword = form.get('newPassword')?.value;
      if (control.value && control.value !== newPassword) {
        return { mismatch: true };
      }
      return null;
    });
  }

  onPasswordFormChange(form: FormGroup): void {
    this.passwordForm = form;
    this.passwordFormValid = form.valid;
    this.cdr.markForCheck();
  }

  onChangePassword(): void {
    if (this.passwordFormValid && !this.isChangingPassword) {
      this.isChangingPassword = true;
      this.cdr.markForCheck();

      const formValue = this.passwordForm.value;
      const request: ChangePasswordRequest = {
        current_password: formValue.currentPassword,
        password: formValue.newPassword,
        password_confirmation: formValue.confirmPassword
      };

      this.authService.changePassword(request)
        .pipe(
          finalize(() => {
            this.isChangingPassword = false;
            this.cdr.markForCheck();
          })
        )
        .subscribe({
          next: () => {
            // Reset form after successful password change
            this.passwordForm.reset();
            this.passwordFormValid = false;
            this.cdr.markForCheck();
          },
          error: (error) => {
            console.error('Password change failed:', error);
            // Error handling is done in the auth service with notifications
          }
        });
    }
  }

  onToggleTwoFactor(): void {
    this.twoFactorEnabled = !this.twoFactorEnabled;
    console.log('Two-factor authentication:', this.twoFactorEnabled ? 'enabled' : 'disabled');
    this.cdr.markForCheck();
  }

  onTerminateSession(session: any): void {
    console.log('Terminating session:', session);
    // Implement session termination logic
  }

  onTerminateAllOtherSessions(): void {
    console.log('Terminating all other sessions...');
    // Implement logic to terminate all other sessions
  }
}
