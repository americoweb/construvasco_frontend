import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { CardComponent } from '../../../shared/components/ui/card/card.component';
import { AvatarComponent } from '../../../shared/components/ui/avatar/avatar.component';
import { DynamicFormComponent } from '../../../shared/components/forms/dynamic-form/dynamic-form.component';
import { FormField, FormConfig } from '../../../shared/components/forms/form.types';
import { UserService } from '../../../core/auth/services/user.service';
import { User, UserProfile } from '../../../core/auth/models/user.interface';
import { NotificationService } from '../../../shared/components/feedback/notification.service';
import { ConfigService } from 'app/core/services/config.service';

@Component({
  selector: 'settings-account',
  standalone: true,
  imports: [
    CommonModule,
    ButtonComponent,
    CardComponent,
    AvatarComponent,
    DynamicFormComponent
  ],
  templateUrl: './account.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsAccountComponent implements OnInit {
  form: FormGroup;
  formValid = false;
  userData: Partial<UserProfile> = {};
  currentUser: User | null = null;
  isSaving = false;

  formConfig: FormConfig = {
    fields: [
      {
        name: 'name',
        type: 'text',
        label: 'Nome',
        required: true,
        grid: { xs: 12 },
        validation: { 
          required: true, 
          minLength: 2,
          maxLength: 255 
        }
      },
      {
        name: 'phone',
        type: 'tel',
        label: 'Telefone',
        grid: { xs: 12, md: 6 }
      },
      {
        name: 'company',
        type: 'text',
        label: 'Empresa',
        grid: { xs: 12, md: 6 }
      },
      {
        name: 'job_title',
        type: 'text',
        label: 'Cargo',
        grid: { xs: 12 }
      },
      {
        name: 'bio',
        type: 'textarea',
        label: 'Biografia',
        placeholder: 'Conte um pouco sobre você...',
        grid: { xs: 12 }
      }
    ],
    layout: 'vertical',
    showSubmit: false,
    showCancel: false,
    validateOnChange: true
  };
  
  constructor(
    private cdr: ChangeDetectorRef,
    private userService: UserService,
    private notificationService: NotificationService,
    private configService: ConfigService
  ) {}

  ngOnInit(): void {
    this.loadUserData();
  }

  loadUserData(): void {
    this.userService.getCurrentUser().subscribe({
      next: (user) => {
        this.currentUser = user;
        this.userData = {
          name: user.name,
          phone: user.phone,
          company: user.company,
          avatar: user.avatar_url || user.profile_photo_path, // Prefer avatar_url from backend
          job_title: user.job_title,
          bio: user.bio
        };
        
        // Update form if it's already initialized
        if (this.form) {
          this.form.patchValue(this.userData);
        }
        
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Failed to load user data:', error);
      }
    });
  }

  onFormReady(form: FormGroup): void {
    this.form = form;
    
    // If user data is already loaded, populate the form
    if (this.userData && Object.keys(this.userData).length > 0) {
      this.form.patchValue(this.userData);
    }
  }

  onFormChange(formValue: any): void {
    // Check if name field has a value (required field)
    const nameValue = formValue?.name;
    this.formValid = nameValue && nameValue.trim().length >= 2;
    
    this.cdr.markForCheck();
  }

  getAvatarUrl(path: string): string {
    if (!path) {
      return '';
    }
    
    // Use avatar_url from backend if available (it's already properly constructed)
    if (this.currentUser?.avatar_url) {
      return this.currentUser.avatar_url;
    }
    
    // Fallback: construct URL manually
    // Laravel storage URLs are: http://127.0.0.1:8000/storage/path
    // The API URL is http://127.0.0.1:8000/api, so we remove /api and add /storage
    const apiUrl = this.configService.getApiUrl();
    const baseUrl = apiUrl.replace('/api', '').replace(/\/$/, ''); // Remove /api and trailing slash
    const fullUrl = `${baseUrl}/storage/${path}`;
    
    return fullUrl;
  }

  onSave(): void {
    // Check if form exists and has required data
    if (this.form && this.form.get('name')?.value?.trim()) {
      this.isSaving = true;
      const formData = this.form.value;
      
      this.userService.updateProfile(formData).subscribe({
        next: (user) => {
          // Update local data
          this.currentUser = user;
          this.userData = {
            name: user.name,
            phone: user.phone,
            company: user.company,
            job_title: user.job_title,
            bio: user.bio
          };
          
          // Update form with new data
          if (this.form) {
            this.form.patchValue(this.userData);
          }
          
          this.isSaving = false;
          this.cdr.markForCheck();
          
          // Show success notification
          this.notificationService.success(
            'Perfil atualizado com sucesso!',
            'Sucesso',
            { duration: 3000 }
          );
        },
        error: (error) => {
          console.error('Failed to update profile:', error);
          this.isSaving = false;
          this.cdr.markForCheck();
          
          // Show error notification
          let errorMessage = 'Erro ao atualizar perfil.';
          if (error.error?.message) {
            errorMessage = error.error.message;
          } else if (error.message) {
            errorMessage = error.message;
          }
          
          this.notificationService.error(
            errorMessage,
            'Erro',
            { duration: 0 } // Persistent for errors
          );
        }
      });
    } else {
      this.notificationService.warning(
        'Por favor, preencha pelo menos o nome.',
        'Campo Obrigatório',
        { duration: 4000 }
      );
    }
  }

  onCancel(): void {
    // Reset form to original data
    if (this.form) {
      this.form.patchValue(this.userData);
    }
  }

  onUploadAvatar(): void {
    // Create a file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/jpg,image/webp';
    input.multiple = false;
    
    input.onchange = (event: any) => {
      const file = event.target.files[0];
      if (file) {
        // Check file size (2MB max)
        if (file.size > 2 * 1024 * 1024) {
          this.notificationService.error(
            'Arquivo muito grande. Tamanho máximo permitido: 2MB.',
            'Erro de Upload',
            { duration: 0 }
          );
          return;
        }
        
        this.userService.uploadAvatar(file).subscribe({
          next: (response) => {
            // Update user with new avatar path
            if (this.currentUser && response.data) {
              this.currentUser.profile_photo_path = response.data.profile_photo_path;
            }
            
            // Refresh user data to get the latest from backend
            this.loadUserData();
            
            this.notificationService.success(
              'Avatar atualizado com sucesso!',
              'Sucesso',
              { duration: 3000 }
            );
            
            this.cdr.markForCheck();
          },
          error: (error) => {
            console.error('Avatar upload error:', error);
            
            let errorMessage = 'Erro ao fazer upload do avatar.';
            if (error.error?.message) {
              errorMessage = error.error.message;
            } else if (error.message) {
              errorMessage = error.message;
            }
            
            this.notificationService.error(
              errorMessage,
              'Erro de Upload',
              { duration: 0 }
            );
          }
        });
      }
    };
    
    input.click();
  }

  get displayName(): string {
    return this.currentUser?.name || 'User';
  }

  get avatarUrl(): string | null {
    // First try to use avatar_url from backend (already properly constructed)
    if (this.currentUser?.avatar_url) {
      return this.currentUser.avatar_url;
    }
    
    // Fallback: construct URL from profile_photo_path
    const path = this.currentUser?.profile_photo_path;
    if (!path) {
      return null;
    }
    
    return this.getAvatarUrl(path);
  }
}
