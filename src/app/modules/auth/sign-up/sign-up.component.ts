import { CommonModule } from '@angular/common';
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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { fuseAnimations } from '@fuse/animations';
import { FuseAlertComponent, FuseAlertType } from '@fuse/components/alert';
import { AuthService } from 'app/core/auth/services/auth.service';

@Component({
    selector: 'auth-sign-up',
    templateUrl: './sign-up.component.html',
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations,
    standalone: true,
    imports: [
        CommonModule,
        RouterLink,
        FuseAlertComponent,
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatCheckboxModule,
        MatProgressSpinnerModule,
    ],
})
export class AuthSignUpComponent implements OnInit {
    @ViewChild('signUpNgForm') signUpNgForm: NgForm;

    alert: { type: FuseAlertType; message: string } = {
        type: 'success',
        message: '',
    };
    signUpForm: UntypedFormGroup;
    showAlert: boolean = false;
    isLoading = false;

    // Invitation properties
    invitationToken: string | null = null;
    companyName: string | null = null;
    invitationDetails: any = null;
    companyDetails: any = null;
    showOrganizationField = false; // No longer needed - all users default to tenant_id 1
    isInvitationMode = false;

    /**
     * Constructor
     */
    constructor(
        private _authService: AuthService,
        private _formBuilder: UntypedFormBuilder,
        private _router: Router,
        private _route: ActivatedRoute
    ) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Create the form
        this.signUpForm = this._formBuilder.group({
            name: ['', Validators.required],
            identifier: ['', [Validators.required]],
            type: ['email', Validators.required],
            password: ['', Validators.required],
            password_confirmation: ['', Validators.required],
            organization_name: [''], // Optional - not required anymore
            agreements: ['', Validators.requiredTrue],
        });

        // Add identifier type detection
        this.signUpForm.get('identifier')?.valueChanges.subscribe(value => {
            if (value) {
                const detectedType = this.detectIdentifierType(value);
                this.signUpForm.patchValue({ type: detectedType }, { emitEvent: false });
                
                // Clear any existing validation errors
                const identifierControl = this.signUpForm.get('identifier');
                if (identifierControl) {
                    identifierControl.setErrors(null);
                    
                    // Validate format based on detected type
                    if (detectedType === 'email') {
                        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                        if (!emailPattern.test(value)) {
                            identifierControl.setErrors({ invalidEmail: true });
                        }
                    } else if (detectedType === 'whatsapp') {
                        const whatsappPattern = /^[\+]?[1-9][\d\s\-\(\)]{7,15}$/;
                        const cleanValue = value.replace(/[\s\-\(\)]/g, '');
                        if (!whatsappPattern.test(value) || cleanValue.length < 8 || cleanValue.length > 15) {
                            identifierControl.setErrors({ invalidWhatsApp: true });
                        }
                    }
                }
            }
        });

        // Check for invitation parameters
        this.checkForInvitation();
    }

    /**
     * Detect if the identifier is an email or WhatsApp number
     */
    private detectIdentifierType(identifier: string): 'email' | 'whatsapp' {
        // Email regex pattern
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        // WhatsApp regex pattern (supports international format and common formats)
        const whatsappPattern = /^[\+]?[1-9][\d\s\-\(\)]{7,15}$/;
        
        // Clean the identifier (remove spaces, dashes, parentheses) for validation
        const cleanIdentifier = identifier.replace(/[\s\-\(\)]/g, '');
        
        if (emailPattern.test(identifier)) {
            return 'email';
        } else if (whatsappPattern.test(identifier) && cleanIdentifier.length >= 8 && cleanIdentifier.length <= 15) {
            return 'whatsapp';
        } else {
            // Default to email if we can't determine
            return 'email';
        }
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Private methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Check for invitation parameters in URL
     */
    private async checkForInvitation(): Promise<void> {
        // Get current route parameters synchronously
        const queryParams = this._route.snapshot.queryParams;
        const routeParams = this._route.snapshot.params;
        
        this.invitationToken = queryParams['invitation'] || null;
        this.companyName = routeParams['companyName'] || null;
        
        console.log('Query params:', queryParams);
        console.log('Route params:', routeParams);
        console.log('Invitation token from query:', this.invitationToken);
        console.log('Company name from route:', this.companyName);

        // Handle invitation token
        if (this.invitationToken) {
            await this.validateInvitationToken();
        }
        // Handle company name
        else if (this.companyName) {
            await this.validateCompanyName();
        }
    }

    /**
     * Validate invitation token
     */
    private async validateInvitationToken(): Promise<void> {
        try {
            const response = await this._authService.validateInvitation(this.invitationToken).toPromise();
            this.invitationDetails = response.invitation;
            this.isInvitationMode = true;
            this.showOrganizationField = false;
            
            // Update form validation
            this.updateFormValidation();
            
            // Pre-fill email if available
            if (this.invitationDetails.identifier) {
                this.signUpForm.patchValue({
                    identifier: this.invitationDetails.identifier
                });
            }
        } catch (error) {
            console.error('Invalid invitation token:', error);
            this.showAlert = true;
            this.alert = {
                type: 'error',
                message: 'Invalid or expired invitation link.'
            };
        }
    }

    /**
     * Validate company name
     */
    private async validateCompanyName(): Promise<void> {
        try {
            const response = await this._authService.validateCompany(this.companyName).toPromise();
            this.companyDetails = response.company;
            this.isInvitationMode = true;
            this.showOrganizationField = false;
            
            // Update form validation
            this.updateFormValidation();
        } catch (error) {
            console.error('Invalid company name:', error);
            this.showAlert = true;
            this.alert = {
                type: 'error',
                message: 'Company not found or inactive.'
            };
        }
    }

    /**
     * Ensure form validation is correct based on invitation mode
     */
    private updateFormValidation(): void {
        // Organization name is no longer required - all users default to tenant_id 1
        this.signUpForm.get('organization_name').clearValidators();
        this.signUpForm.get('organization_name').updateValueAndValidity();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Sign up
     */
    signUp(): void {
        if (this.signUpForm.invalid) {
            console.log('Form is invalid:', this.signUpForm.errors);
            console.log('Form controls:', this.signUpForm.controls);
            return;
        }
        
        this.isLoading = true;
        this.showAlert = false;

        // Get form values BEFORE disabling the form
        const formValue = this.signUpForm.getRawValue(); // Use getRawValue() to get values even if form is disabled
        
        console.log('Raw form value:', formValue);
        console.log('Form valid:', this.signUpForm.valid);
        console.log('Form disabled:', this.signUpForm.disabled);
        
        // Ensure type is detected if not set
        if (!formValue.type && formValue.identifier) {
            formValue.type = this.detectIdentifierType(formValue.identifier);
        }
        
        const payload: any = {
            name: formValue.name,
            identifier: formValue.identifier,
            type: formValue.type,
            password: formValue.password,
            password_confirmation: formValue.password_confirmation,
        };

        // Handle different registration scenarios
        if (this.invitationToken) {
            // Email invitation
            payload.invitation_token = this.invitationToken;
            console.log('Adding invitation_token to payload:', this.invitationToken);
        } else if (this.companyName) {
            // SMS invitation
            payload.organization_name = this.invitationDetails.tenant.name;
            console.log('Adding company_name to payload:', this.companyName);
        }
        // Note: Regular registration no longer requires organization_name - all users default to tenant_id 1

        console.log('Final payload:', payload);
        //return;

        // Now disable the form
        this.signUpForm.disable();

        this._authService.signUp(payload).subscribe(
            (response) => {
                this.isLoading = false;
                this._router.navigateByUrl('/confirmation-required');
            },
            (response) => {
                this.isLoading = false;
                this.signUpForm.enable();
                this.signUpNgForm.resetForm();
                
                // Log the full error response
                console.log('Full error response:', response);
                console.log('Error status:', response.status);
                console.log('Error body:', response.error);
                
                const err = response?.error || {};
                let message = err.message || 'Something went wrong, please try again.';
                if (err.errors) {
                    console.log('Validation errors:', err.errors);
                    message += '<ul>';
                    for (const key in err.errors) {
                        if (err.errors.hasOwnProperty(key)) {
                            const val = Array.isArray(err.errors[key]) ? err.errors[key].join(' ') : err.errors[key];
                            message += `<li>${val}</li>`;
                        }
                    }
                    message += '</ul>';
                }
                this.alert = {
                    type: 'error',
                    message: message, // Use [innerHTML]="alert.message" in template to render HTML
                };
                this.showAlert = true;
            }
        );
    }
}
