import { Component, OnInit, ChangeDetectionStrategy, Output, EventEmitter, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { Subject, takeUntil } from 'rxjs';

// Angular Material
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Services
import { AuthService } from '../../../../core/auth/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';

// Models
import { ForgotPasswordRequest } from '../../../../core/auth/models/auth.types';

@Component({
  selector: 'app-forgot-password-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './forgot-password-modal.component.html',
  styleUrls: ['./forgot-password-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ForgotPasswordModalComponent implements OnInit, OnDestroy {
  @Output() close = new EventEmitter<void>();
  @Output() switchToLogin = new EventEmitter<void>();

  forgotPasswordForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  showError = false;
  successMessage = '';
  showSuccess = false;

  private _unsubscribeAll = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.createForm();
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
  }

  private createForm(): void {
    this.forgotPasswordForm = this.formBuilder.group({
      identifier: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit(): void {
    this.showError = false;
    this.showSuccess = false;
    this.errorMessage = '';
    this.successMessage = '';

    if (this.forgotPasswordForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading = true;
    const formValue = this.forgotPasswordForm.value;
    const request: ForgotPasswordRequest = {
      identifier: formValue.identifier,
      type: 'email'
    };

    this.authService.forgotPassword(request)
      .pipe(
        finalize(() => {
          this.isLoading = false;
        }),
        takeUntil(this._unsubscribeAll)
      )
      .subscribe({
        next: () => {
          this.successMessage = 'Email enviado! Verifique sua caixa de entrada.';
          this.showSuccess = true;
          
          // Auto-close after 3 seconds
          setTimeout(() => {
            this.closeModal();
          }, 3000);
        },
        error: (error) => {
          const err = error?.error || {};
          this.errorMessage = err.message || 'Erro ao enviar email. Por favor, tente novamente.';
          this.showError = true;
        }
      });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.forgotPasswordForm.controls).forEach(key => {
      const control = this.forgotPasswordForm.get(key);
      control?.markAsTouched();
    });
  }

  getErrorMessage(controlName: string): string {
    const control = this.forgotPasswordForm.get(controlName);
    
    if (control?.hasError('required')) {
      return 'Campo obrigatório';
    }
    
    if (control?.hasError('email')) {
      return 'Por favor, insira um email válido';
    }
    
    return '';
  }

  closeModal(): void {
    this.close.emit();
  }

  onSwitchToLogin(): void {
    this.switchToLogin.emit();
  }
}

