import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import {
    FormsModule,
    NgForm,
    ReactiveFormsModule,
    UntypedFormBuilder,
    UntypedFormGroup,
    Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { fuseAnimations } from '@fuse/animations';
import { FuseAlertComponent, FuseAlertType } from '@fuse/components/alert';
import { AuthService } from 'app/core/auth/services/auth.service';
import { ChangePasswordRequest } from 'app/core/auth/models/auth.types';
import { finalize } from 'rxjs';

@Component({
    selector: 'auth-change-password',
    templateUrl: './change-password.component.html',
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations,
    standalone: true,
    imports: [
        FuseAlertComponent,
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatProgressSpinnerModule,
    ],
})
export class AuthChangePasswordComponent implements OnInit {
    @ViewChild('changePasswordNgForm') changePasswordNgForm: NgForm;

    alert: { type: FuseAlertType; message: string } = {
        type: 'success',
        message: '',
    };
    changePasswordForm: UntypedFormGroup;
    showAlert: boolean = false;

    /**
     * Constructor
     */
    constructor(
        private _authService: AuthService,
        private _formBuilder: UntypedFormBuilder,
        public router: Router
    ) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Create the form
        this.changePasswordForm = this._formBuilder.group({
            current_password: ['', [Validators.required]],
            password: ['', [Validators.required, Validators.minLength(8)]],
            password_confirmation: ['', [Validators.required]],
        }, { validators: this.passwordMatchValidator });
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Change password
     */
    changePassword(): void {
        // Return if the form is invalid
        if (this.changePasswordForm.invalid) {
            return;
        }

        // Disable the form
        this.changePasswordForm.disable();

        // Hide the alert
        this.showAlert = false;

        // Create the request
        const request: ChangePasswordRequest = {
            current_password: this.changePasswordForm.get('current_password').value,
            password: this.changePasswordForm.get('password').value,
            password_confirmation: this.changePasswordForm.get('password_confirmation').value,
        };

        // Change password
        this._authService
            .changePassword(request)
            .pipe(
                finalize(() => {
                    // Re-enable the form
                    this.changePasswordForm.enable();

                    // Reset the form
                    this.changePasswordNgForm.resetForm();

                    // Show the alert
                    this.showAlert = true;
                })
            )
            .subscribe(
                (response) => {
                    // Set the alert
                    this.alert = {
                        type: 'success',
                        message: 'Password changed successfully!',
                    };
                    
                    // Redirect after a short delay
                    setTimeout(() => {
                        this.router.navigate(['/conta/dashboard']);
                    }, 2000);
                },
                (error) => {
                    // Set the alert
                    this.alert = {
                        type: 'error',
                        message: error.error?.message || 'Failed to change password. Please try again.',
                    };
                }
            );
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Private methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Custom validator to check if passwords match
     */
    private passwordMatchValidator(form: UntypedFormGroup): { [key: string]: any } | null {
        const password = form.get('password');
        const passwordConfirmation = form.get('password_confirmation');

        if (password && passwordConfirmation && password.value !== passwordConfirmation.value) {
            return { passwordMismatch: true };
        }

        return null;
    }
} 