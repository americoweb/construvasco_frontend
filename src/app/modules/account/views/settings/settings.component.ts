import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { UserService } from '../../../../core/auth/services/user.service';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { User } from '../../../../core/auth/models/user.interface';
import { ProfilePhotoComponent } from '../../../../shared/components/ui/profile-photo/profile-photo.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ProfilePhotoComponent],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsComponent implements OnInit, OnDestroy {
  user: User | null = null;
  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  preferencesForm!: FormGroup;
  addressForm!: FormGroup;
  
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  isUploadingPhoto = false;
  isSavingProfile = false;
  isChangingPassword = false;
  
  addresses: any[] = [];
  showAddressForm = false;
  editingAddress: any = null;

  languages = [
    { code: 'pt', name: 'Português' },
    { code: 'en', name: 'English' }
  ];

  currencies = [
    { code: 'MZN', name: 'MZN - Metical' },
    { code: 'USD', name: 'USD - Dollar' }
  ];

  provinces = [
    'Maputo', 'Gaza', 'Inhambane', 'Sofala', 'Manica',
    'Tete', 'Zambézia', 'Nampula', 'Cabo Delgado', 'Niassa'
  ];

  private _unsubscribeAll = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Create forms once with empty/default values
    this.createForms();
    
    // Check if user data is already available
    const currentUser = this.userService.user;
    if (currentUser) {
      this.user = currentUser;
      this.patchFormsWithUserData(currentUser);
      this.cdr.markForCheck();
    } else {
      // Fetch user data from backend if not available
      this.userService.getCurrentUser()
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe({
          next: (user) => {
            this.user = user;
            this.patchFormsWithUserData(user);
            this.cdr.markForCheck();
          },
          error: (error) => {
            console.error('Failed to load user data:', error);
            this.cdr.markForCheck();
          }
        });
    }
    
    // Subscribe to user data and patch forms when data arrives or changes
    this.userService.user$
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((user: User | null) => {
        this.user = user;
        if (user) {
          this.patchFormsWithUserData(user);
        }
        this.cdr.markForCheck();
      });

    // Load addresses
    this.loadAddresses();
  }

  loadAddresses(): void {
    this.userService.getAddresses()
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe({
        next: (addresses) => {
          this.addresses = addresses || [];
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Failed to load addresses:', error);
          // If endpoint doesn't exist yet, just set empty array
          this.addresses = [];
          this.cdr.markForCheck();
        }
      });
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
  }

  createForms(): void {
    // Create forms with default/empty values
    this.profileForm = this.fb.group({
      name: ['', Validators.required],
      phone: [''],
      whatsapp: ['']
    });

    this.passwordForm = this.fb.group({
      current_password: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(8)]],
      password_confirmation: ['', Validators.required]
    }, {
      validators: this.passwordMatchValidator
    });

    this.preferencesForm = this.fb.group({
      email_promotions: [false],
      sms_updates: [false],
      whatsapp_notifications: [false],
      weekly_newsletter: [false],
      language: ['pt'],
      currency: ['MZN']
    });

    this.addressForm = this.fb.group({
      address: ['', Validators.required],
      city: ['', Validators.required],
      province: ['', Validators.required],
      is_primary: [false]
    });
  }

  patchFormsWithUserData(user: User): void {
    // Patch profile form with user data
    this.profileForm.patchValue({
      name: user.name || '',
      phone: user.phone || '',
      whatsapp: user.whatsapp || ''
    }, { emitEvent: false });

    // Patch preferences form with user settings if available
    if (user.settings) {
      this.preferencesForm.patchValue({
        email_promotions: user.settings.email_promotions || false,
        sms_updates: user.settings.sms_updates || false,
        whatsapp_notifications: user.settings.whatsapp_notifications || false,
        weekly_newsletter: user.settings.weekly_newsletter || false,
        language: user.settings.language || 'pt',
        currency: user.settings.currency || 'MZN'
      }, { emitEvent: false });
    }
  }

  passwordMatchValidator(form: FormGroup): { [key: string]: boolean } | null {
    const password = form.get('password');
    const passwordConfirmation = form.get('password_confirmation');
    
    if (!password || !passwordConfirmation) {
      return null;
    }
    
    return password.value === passwordConfirmation.value ? null : { passwordMismatch: true };
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (file.size > 2 * 1024 * 1024) {
        alert('O arquivo deve ter no máximo 2MB');
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        alert('Apenas imagens JPG, PNG ou WebP são permitidas');
        return;
      }
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewUrl = e.target?.result as string;
        this.cdr.markForCheck();
      };
      reader.readAsDataURL(file);
    }
  }

  uploadPhoto(): void {
    if (!this.selectedFile) return;
    
    this.isUploadingPhoto = true;
    this.userService.uploadAvatar(this.selectedFile)
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe({
        next: () => {
          this.isUploadingPhoto = false;
          this.selectedFile = null;
          this.previewUrl = null;
          this.cdr.markForCheck();
        },
        error: () => {
          this.isUploadingPhoto = false;
          this.cdr.markForCheck();
        }
      });
  }

  saveProfile(): void {
    if (this.profileForm.invalid) return;
    
    this.isSavingProfile = true;
    this.userService.updateProfile(this.profileForm.value)
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe({
        next: () => {
          this.isSavingProfile = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.isSavingProfile = false;
          this.cdr.markForCheck();
        }
      });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) return;
    
    this.isChangingPassword = true;
    const formValue = this.passwordForm.value;
    this.authService.changePassword({
      current_password: formValue.current_password,
      password: formValue.password,
      password_confirmation: formValue.password_confirmation
    })
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe({
        next: () => {
          this.isChangingPassword = false;
          this.passwordForm.reset();
          this.cdr.markForCheck();
        },
        error: () => {
          this.isChangingPassword = false;
          this.cdr.markForCheck();
        }
      });
  }

  savePreferences(): void {
    // TODO: Save preferences via API
  }

  deleteAccount(): void {
    if (confirm('Tem certeza que deseja excluir sua conta? Esta ação não pode ser desfeita.')) {
      // TODO: Delete account via API
    }
  }

  exportData(): void {
    // TODO: Export user data
  }

  // Address management methods
  addNewAddress(): void {
    this.editingAddress = null;
    this.showAddressForm = true;
    this.addressForm.reset();
    this.cdr.markForCheck();
  }

  editAddress(address: any): void {
    this.editingAddress = address;
    this.showAddressForm = true;
    this.addressForm.patchValue(address);
    this.cdr.markForCheck();
  }

  saveAddress(): void {
    if (this.addressForm.invalid) return;

    const addressData = this.addressForm.value;
    
    // Generate ID for new address
    if (!this.editingAddress) {
      addressData.id = 'addr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      addressData.created_at = new Date().toISOString();
    }
    addressData.updated_at = new Date().toISOString();

    // Get current addresses
    let updatedAddresses = [...this.addresses];

    if (this.editingAddress) {
      // Update existing address
      const index = updatedAddresses.findIndex(addr => addr.id === this.editingAddress.id);
      if (index !== -1) {
        updatedAddresses[index] = { ...updatedAddresses[index], ...addressData };
      }
    } else {
      // Add new address
      updatedAddresses.push(addressData);
    }

    // If setting as primary, unset others
    if (addressData.is_primary) {
      updatedAddresses = updatedAddresses.map(addr => ({
        ...addr,
        is_primary: addr.id === addressData.id
      }));
    }

    // Save all addresses via settings
    this.userService.saveAddresses(updatedAddresses)
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe({
        next: () => {
          this.addresses = updatedAddresses;
          this.showAddressForm = false;
          this.editingAddress = null;
          this.addressForm.reset();
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Failed to save address:', error);
          alert('Erro ao guardar endereço. Tente novamente.');
          this.cdr.markForCheck();
        }
      });
  }

  cancelAddressForm(): void {
    this.showAddressForm = false;
    this.editingAddress = null;
    this.addressForm.reset();
    this.cdr.markForCheck();
  }

  deleteAddress(address: any): void {
    if (confirm('Tem certeza que deseja excluir este endereço?')) {
      const updatedAddresses = this.addresses.filter(addr => addr.id !== address.id);
      
      this.userService.saveAddresses(updatedAddresses)
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe({
          next: () => {
            this.addresses = updatedAddresses;
            this.cdr.markForCheck();
          },
          error: (error) => {
            console.error('Failed to delete address:', error);
            alert('Erro ao excluir endereço. Tente novamente.');
            this.cdr.markForCheck();
          }
        });
    }
  }

  setAsPrimary(address: any): void {
    const updatedAddresses = this.addresses.map(addr => ({
      ...addr,
      is_primary: addr.id === address.id
    }));

    this.userService.saveAddresses(updatedAddresses)
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe({
        next: () => {
          this.addresses = updatedAddresses;
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Failed to set primary address:', error);
          alert('Erro ao definir endereço principal. Tente novamente.');
          this.cdr.markForCheck();
        }
      });
  }
}

