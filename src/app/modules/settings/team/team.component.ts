import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, OnInit, ChangeDetectorRef, OnDestroy, NgZone } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { CardComponent } from '../../../shared/components/ui/card/card.component';
import { BadgeComponent } from '../../../shared/components/ui/badge/badge.component';
import { AvatarComponent } from '../../../shared/components/ui/avatar/avatar.component';
import { DynamicFormComponent } from '../../../shared/components/forms/dynamic-form/dynamic-form.component';
import { DataTableComponent } from '../../../shared/components/data/table/data-table.component';
import { FormConfig } from '../../../shared/components/forms/form.types';
import { TableColumn, TableAction } from '../../../shared/components/data/table/data-table.component';
import { UserService } from '../../../core/auth/services/user.service';
import { ConfigService } from '../../../core/services/config.service';
import { NotificationService } from '../../../shared/components/feedback/notification.service';
import { Subject, takeUntil } from 'rxjs';
import { TenantUser, TenantInvitation } from '../../../core/auth/models/user.interface';
import { UserPermissionsDialogComponent, UserPermissionsDialogData } from './user-permissions-dialog/user-permissions-dialog.component';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'pending' | 'inactive' | string;
  lastActive: string;
  avatar?: string;
  customPermissions?: string[] | null;
  rawCustomPermissions?: any;
}

@Component({
  selector: 'settings-team',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    ButtonComponent,
    CardComponent,
    BadgeComponent,
    AvatarComponent,
    DynamicFormComponent,
    DataTableComponent,
    UserPermissionsDialogComponent
  ],
  templateUrl: './team.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsTeamComponent implements OnInit, OnDestroy {
  inviteForm: FormGroup;
  inviteFormValid = false;
  showInviteForm = false;
  isInviting = false;
  detectedType: 'email' | 'whatsapp' | null = null;
  formKey = 0;
  
  teamMembers: TeamMember[] = [];
  invitations: TenantInvitation[] = [];

  columns: TableColumn[] = [
    {
      key: 'name',
      label: 'Nome',
      type: 'custom',
      sortable: true,
      width: '25%'
    },
    {
      key: 'email',
      label: 'Email',
      type: 'text',
      sortable: true,
      width: '25%'
    },
    {
      key: 'role',
      label: 'Função',
      type: 'text',
      sortable: true,
      width: '15%'
    },
    {
      key: 'customPermissions',
      label: 'Permissões Customizadas',
      type: 'custom',
      sortable: false,
      width: '20%'
    },
    {
      key: 'status',
      label: 'Status',
      type: 'badge',
      sortable: true,
      width: '10%'
    },
    {
      key: 'lastActive',
      label: 'Última Atividade',
      type: 'text',
      sortable: true,
      width: '15%'
    },
    {
      key: 'actions',
      label: '',
      type: 'actions',
      sortable: false,
      width: 'auto'
    }
  ];

  actions: TableAction[] = [
    {
      label: 'Editar',
      icon: 'edit',
      handler: (member) => this.onEditMember(member)
    },
    {
      label: 'Gerenciar Permissões',
      icon: 'security',
      handler: (member) => this.onManagePermissions(member)
    },
    {
      label: 'Reenviar Convite',
      icon: 'send',
      handler: (member) => this.onResendInvite(member),
      condition: (member) => member.status === 'pending'
    },
    {
      label: 'Remover',
      icon: 'delete',
      color: 'warn',
      handler: (member) => this.onRemoveMember(member)
    }
  ];

  inviteFormConfig: FormConfig = {
    fields: [
      {
        name: 'identifier',
        type: 'text',
        label: 'Email ou Telefone',
        required: true,
        placeholder: 'email@exemplo.com ou +351123456789',
        helpText: 'Digite um email válido ou número de telefone (com código do país)',
        grid: { xs: 12 },
        validation: { required: true }
      },
      {
        name: 'role',
        type: 'select',
        label: 'Função',
        required: true,
        grid: { xs: 12 },
        options: [
          { value: 'owner', label: 'Proprietário da Organização' },
          { value: 'admin', label: 'Administrador' },
          { value: 'project_manager', label: 'Gerente de Projeto' },
          { value: 'finance_manager', label: 'Gerente Financeiro' },
          { value: 'team_member', label: 'Membro da Equipe' },
          { value: 'viewer', label: 'Visualizador' }
        ],
        validation: { required: true }
      }
    ],
    layout: 'vertical',
    showSubmit: false,
    showCancel: false,
    validateOnChange: false
  };

  private destroy$ = new Subject<void>();

  constructor(
    private cdr: ChangeDetectorRef,
    private userService: UserService,
    private configService: ConfigService,
    private notificationService: NotificationService,
    private ngZone: NgZone,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.fetchTeamMembers();
    this.fetchInvitations();
  }

  fetchTeamMembers(): void {
    this.userService.getTenantUsers().subscribe({
      next: (response) => {
        console.log('🔍 Backend user data:', response.data);
        this.teamMembers = (response.data || []).map((user: TenantUser) => {
          const status = this.determineUserStatus(user);
          
          // Process custom permissions to handle both array and object formats
          let customPermissions: string[] = [];
          if (user.custom_permissions) {
            if (Array.isArray(user.custom_permissions)) {
              customPermissions = user.custom_permissions;
            } else if (typeof user.custom_permissions === 'object' && user.custom_permissions !== null) {
              const permissionsObj = user.custom_permissions as any;
              customPermissions = permissionsObj.granted || [];
            }
          }
          
          console.log('🔍 User custom permissions debug:', {
            userId: user.id,
            userName: user.name,
            custom_permissions: user.custom_permissions,
            raw_custom_permissions: user.raw_custom_permissions,
            processedCustomPermissions: customPermissions
          });
          
          console.log('🔍 User status determination:', {
            userId: user.id,
            userName: user.name,
            isActive: user.is_active,
            tenantStatus: user.tenant_status,
            determinedStatus: status,
            customPermissions: customPermissions
          });
          
          return {
            id: user.id,
            name: user.name || `${user.first_name} ${user.last_name}`,
            email: user.email,
            role: user.tenant_role?.display_name || user.tenant_role?.name || 'Membro',
            status: status,
            lastActive: this.formatLastActive(user.last_login_at),
            avatar: user.profile_photo_path,
            customPermissions: customPermissions,
            rawCustomPermissions: user.raw_custom_permissions
          };
        });
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Failed to fetch team members:', error);
        this.teamMembers = [];
        this.cdr.detectChanges();
      }
    });
  }

  private determineUserStatus(user: TenantUser): 'active' | 'pending' | 'inactive' | string {
    // If user is not active, they are inactive regardless of tenant status
    if (user.is_active === false) {
      return 'inactive';
    }
    
    // If tenant status is pending, user is pending
    if (user.tenant_status === 'pending') {
      return 'pending';
    }
    
    // If tenant status is inactive, user is inactive
    if (user.tenant_status === 'inactive') {
      return 'inactive';
    }
    
    // Default to active if user is active and tenant status is active or not specified
    return 'active';
  }

  private formatLastActive(lastLoginAt: string | null): string {
    if (!lastLoginAt) {
      return 'Nunca';
    }
    
    const lastLogin = new Date(lastLoginAt);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - lastLogin.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) {
      return 'Agora';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} minutos atrás`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} hora${hours > 1 ? 's' : ''} atrás`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days} dia${days > 1 ? 's' : ''} atrás`;
    }
  }

  fetchInvitations(): void {
    this.userService.getTenantInvitations().subscribe({
      next: (response) => {
        this.invitations = response.data || [];
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.invitations = [];
        this.cdr.detectChanges();
      }
    });
  }

  onInviteMember(): void {
    console.log('🔵 onInviteMember called');
    this.showInviteForm = true;
    this.formKey++; // Force form re-initialization
    this.inviteFormValid = false;
    this.detectedType = null;
    console.log('🔵 Form state after onInviteMember:', {
      showInviteForm: this.showInviteForm,
      formKey: this.formKey,
      inviteFormValid: this.inviteFormValid,
      detectedType: this.detectedType
    });
    this.cdr.detectChanges();
  }

  onInviteFormReady(form: FormGroup): void {
    console.log('🟢 onInviteFormReady called with form:', form);
    this.inviteForm = form;
    
    // Subscribe to form value changes
    this.inviteForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((values) => {
        console.log('🟡 Form value changed:', values);
        this.updateFormValidity();
      });
    
    // Immediately validate the form since it might have initial values
    console.log('🟢 Immediately validating form with current values:', this.inviteForm.value);
    this.onInviteFormChange(this.inviteForm);
    
    // Force validation multiple times to ensure it catches
    setTimeout(() => {
      console.log('🟢 First timeout - forcing validation');
      this.updateFormValidity();
    }, 0);
    
    setTimeout(() => {
      console.log('🟢 Second timeout - forcing validation again');
      this.updateFormValidity();
    }, 100);
    
    setTimeout(() => {
      console.log('🟢 Third timeout - final validation check');
      this.updateFormValidity();
    }, 500);
  }

  onInviteFormChange(form: FormGroup): void {
    console.log('🟡 onInviteFormChange called with form:', form);
    
    // Check if form is valid FormGroup
    if (!form || typeof form.get !== 'function') {
      console.log('🟡 Invalid form provided, skipping validation');
      return;
    }
    
    this.inviteForm = form;
    
    // Detect type in real-time
    const identifier = form.get('identifier')?.value;
    console.log('🟡 Identifier value:', identifier);
    
    if (identifier) {
      this.detectedType = this.detectIdentifierType(identifier);
      console.log('🟡 Detected type:', this.detectedType);
      
      // Validate identifier format
      const isValid = this.validateIdentifier(identifier);
      console.log('🟡 Identifier validation result:', isValid);
      
      if (!isValid) {
        form.get('identifier')?.setErrors({ invalidFormat: true });
        console.log('🟡 Set invalidFormat error on identifier');
      } else {
        form.get('identifier')?.setErrors(null);
        console.log('🟡 Cleared identifier errors');
      }
    } else {
      this.detectedType = null;
      form.get('identifier')?.setErrors(null);
      console.log('🟡 No identifier, cleared type and errors');
    }
    
    this.updateFormValidity();
    this.cdr.detectChanges();
  }

  /**
   * Update form validity status
   */
  private updateFormValidity(): void {
    console.log('🔴 updateFormValidity called');
    
    if (!this.inviteForm || typeof this.inviteForm.get !== 'function') {
      this.inviteFormValid = false;
      console.log('🔴 No valid form available, setting valid to false');
      this.ngZone.run(() => this.cdr.detectChanges());
      return;
    }
    
    // Get form control states
    const identifierControl = this.inviteForm.get('identifier');
    const roleControl = this.inviteForm.get('role');
    
    console.log('🔴 Form controls:', {
      identifierControl: identifierControl,
      roleControl: roleControl,
      identifierValue: identifierControl?.value,
      roleValue: roleControl?.value
    });
    
    // Check individual field validity
    const identifierValid = identifierControl?.valid && 
                           !identifierControl?.errors?.['invalidFormat'];
    const roleValid = roleControl?.valid;
    
    console.log('🔴 Individual field validity:', {
      identifierValid,
      roleValid,
      identifierErrors: identifierControl?.errors,
      roleErrors: roleControl?.errors,
      identifierTouched: identifierControl?.touched,
      roleTouched: roleControl?.touched,
      identifierDirty: identifierControl?.dirty,
      roleDirty: roleControl?.dirty
    });
    
    // Calculate final validity
    const previousValid = this.inviteFormValid;
    this.inviteFormValid = Boolean(identifierValid && roleValid);
    
    console.log('🔴 Form validity calculation:', {
      identifierValid,
      roleValid,
      previousValid,
      newValid: this.inviteFormValid,
      finalValid: this.inviteFormValid
    });
    
    // Force change detection immediately in Angular zone
    this.ngZone.run(() => {
      this.cdr.detectChanges();
      console.log('🔴 Change detection triggered in NgZone');
    });
  }

  /**
   * Validate identifier format
   */
  private validateIdentifier(identifier: string): boolean {
    console.log('🟠 validateIdentifier called with:', identifier);
    
    if (!identifier) {
      console.log('🟠 No identifier, returning false');
      return false;
    }
    
    const type = this.detectIdentifierType(identifier);
    console.log('🟠 Detected type for validation:', type);
    
    if (type === 'email') {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isValid = emailPattern.test(identifier);
      console.log('🟠 Email validation result:', isValid);
      return isValid;
    } else {
      const cleanValue = identifier.replace(/[\s\-\(\)]/g, '');
      const isValid = cleanValue.length >= 8 && cleanValue.length <= 15;
      console.log('🟠 Phone validation result:', isValid, 'cleanValue:', cleanValue, 'length:', cleanValue.length);
      return isValid;
    }
  }

  onSendInvite(): void {
    console.log('🟣 onSendInvite called');
    console.log('🟣 Current state:', {
      inviteFormValid: this.inviteFormValid,
      isInviting: this.isInviting,
      formData: this.inviteForm?.value
    });
    
    // Check if we have a valid form
    if (!this.inviteForm || typeof this.inviteForm.get !== 'function') {
      console.log('🟣 No valid form available, cannot send invite');
      this.notificationService.error('Formulário inválido. Tente novamente.', 'Erro');
      return;
    }
    
    // Force validation before checking
    this.forceValidation();
    
    if (this.inviteFormValid && !this.isInviting) {
      console.log('🟣 Conditions met, proceeding with invite');
      this.isInviting = true;
      const formData = this.inviteForm.value;
      
      // Automatically detect type based on identifier
      const type = this.detectIdentifierType(formData.identifier);
      const inviteData = {
        ...formData,
        type: type
      };
      
      console.log('🟣 Sending invite data:', inviteData);
      
      this.userService.inviteUserToTenant(inviteData).subscribe({
        next: (response) => {
          console.log('🟣 Invite successful:', response);
          this.isInviting = false;
          this.showInviteForm = false;
          this.detectedType = null;
          this.formKey = 0; // Reset form key
          this.inviteForm.reset();
          this.fetchTeamMembers();
          this.fetchInvitations();
          
          if (response.data && response.data.status === 'pending') {
            this.notificationService.success(
              'Convite enviado com sucesso!',
              'Sucesso',
              { duration: 3000 }
            );
          } else {
            this.notificationService.success(
              'Usuário adicionado à equipe com sucesso!',
              'Sucesso',
              { duration: 3000 }
            );
          }
          
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.log('🟣 Invite failed:', error);
          this.isInviting = false;
          this.detectedType = null;
          console.error('Failed to invite user:', error);
          
          let errorMessage = 'Erro ao enviar convite.';
          if (error.error?.message) {
            errorMessage = error.error.message;
          } else if (error.message) {
            errorMessage = error.message;
          }
          
          this.notificationService.error(
            errorMessage,
            'Erro',
            { duration: 0 }
          );
          
          this.cdr.detectChanges();
        }
      });
    } else {
      console.log('🟣 Conditions NOT met:', {
        inviteFormValid: this.inviteFormValid,
        isInviting: this.isInviting,
        reason: !this.inviteFormValid ? 'Form not valid' : 'Already inviting'
      });
    }
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

  onCancelInvite(): void {
    this.showInviteForm = false;
    this.detectedType = null;
    this.inviteFormValid = false;
    this.formKey = 0; // Reset form key
    if (this.inviteForm) {
      this.inviteForm.reset();
      this.inviteForm.markAsUntouched();
      this.inviteForm.markAsPristine();
    }
    this.cdr.detectChanges();
  }

  /**
   * Manually trigger form validation (for debugging)
   */
  triggerValidation(): void {
    if (this.inviteForm) {
      this.inviteForm.updateValueAndValidity();
      this.updateFormValidity();
    }
  }

  onEditMember(member: TeamMember): void {
    // TODO: Implement edit member functionality
    console.log('Edit member:', member);
  }

  onManagePermissions(member: TeamMember): void {
    // Find the original user data
    const originalUser = this.teamMembers.find(m => m.id === member.id);
    if (!originalUser) {
      console.error('User not found:', member);
      return;
    }

    // Get the full user data from the backend
    this.userService.getTenantUsers().subscribe({
      next: (response) => {
        const userData = response.data?.find((user: TenantUser) => user.id === member.id);
        if (!userData) {
          console.error('User data not found:', member.id);
          return;
        }

        // Open the permissions dialog
        const dialogRef = this.dialog.open(UserPermissionsDialogComponent, {
          width: '800px',
          maxWidth: '90vw',
          maxHeight: '90vh',
          data: { user: userData } as UserPermissionsDialogData,
          disableClose: false
        });

        dialogRef.afterClosed().subscribe(result => {
          if (result?.success) {
            this.notificationService.success('Permissões atualizadas com sucesso');
            // Optionally refresh the team members list
            this.fetchTeamMembers();
          }
        });
      },
      error: (error) => {
        console.error('Error fetching user data:', error);
        this.notificationService.error('Erro ao carregar dados do usuário');
      }
    });
  }

  onRemoveMember(member: TeamMember): void {
    console.log('Removing member:', member);
  }

  onResendInvite(member: TeamMember): void {
    console.log('Resending invite to:', member);
  }

  getStatusColor(status: string): 'primary' | 'success' | 'warning' | 'danger' {
    switch (status) {
      case 'active': return 'success';
      case 'pending': return 'warning';
      case 'inactive': return 'danger';
      default: return 'primary';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'active': return 'Ativo';
      case 'pending': return 'Pendente';
      case 'inactive': return 'Inativo';
      default: return status;
    }
  }

  onCancelInvitation(invitation: any): void {
    this.userService.cancelTenantInvitation(invitation.id).subscribe({
      next: () => {
        this.fetchTeamMembers();
        this.fetchInvitations();
        this.notificationService.success('Convite cancelado!', 'Sucesso', { duration: 3000 });
      },
      error: (error) => {
        this.notificationService.error('Erro ao cancelar convite.', 'Erro', { duration: 0 });
      }
    });
  }

  /**
   * Force validation update
   */
  forceValidation(): void {
    console.log('🔧 Force validation called');
    if (this.inviteForm && typeof this.inviteForm.get === 'function') {
      // Force form to re-validate
      this.inviteForm.updateValueAndValidity();
      
      // Manually trigger our validation logic
      this.onInviteFormChange(this.inviteForm);
      
      // Force change detection
      this.ngZone.run(() => {
        this.cdr.detectChanges();
        console.log('🔧 Forced validation complete');
      });
    } else {
      console.log('🔧 No valid form available for validation');
    }
  }

  /**
   * Safely get form value
   */
  private getFormValue(fieldName: string): any {
    if (this.inviteForm && typeof this.inviteForm.get === 'function') {
      return this.inviteForm.get(fieldName)?.value;
    }
    return null;
  }

  /**
   * Safely get form control
   */
  private getFormControl(fieldName: string): any {
    if (this.inviteForm && typeof this.inviteForm.get === 'function') {
      return this.inviteForm.get(fieldName);
    }
    return null;
  }

  /**
   * Debug method to log current form state
   */
  debugFormState(): void {
    console.log('🔍 DEBUG: Current form state');
    console.log('🔍 showInviteForm:', this.showInviteForm);
    console.log('🔍 inviteFormValid:', this.inviteFormValid);
    console.log('🔍 isInviting:', this.isInviting);
    console.log('🔍 detectedType:', this.detectedType);
    console.log('🔍 formKey:', this.formKey);
    
    if (this.inviteForm && typeof this.inviteForm.get === 'function') {
      console.log('🔍 Form exists:', this.inviteForm);
      console.log('🔍 Form valid:', this.inviteForm.valid);
      console.log('🔍 Form values:', this.inviteForm.value);
      console.log('🔍 Form errors:', this.inviteForm.errors);
      
      const identifierControl = this.getFormControl('identifier');
      const roleControl = this.getFormControl('role');
      
      console.log('🔍 Identifier control:', {
        value: identifierControl?.value,
        valid: identifierControl?.valid,
        errors: identifierControl?.errors,
        touched: identifierControl?.touched,
        dirty: identifierControl?.dirty
      });
      
      console.log('🔍 Role control:', {
        value: roleControl?.value,
        valid: roleControl?.valid,
        errors: roleControl?.errors,
        touched: roleControl?.touched,
        dirty: roleControl?.dirty
      });
      
      // Force validation instead of manually setting
      console.log('🔍 Forcing validation...');
      this.forceValidation();
      console.log('🔍 After forced validation - inviteFormValid:', this.inviteFormValid);
    } else {
      console.log('🔍 No valid form available');
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
