import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, Output, EventEmitter, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { Subject, takeUntil, filter } from 'rxjs';

// Services
import { AuthService } from '../../../../core/auth/services/auth.service';
import { UserService } from '../../../../core/auth/services/user.service';
import { ConfigService } from '../../../../core/services/config.service';
import { User } from '../../../../core/auth/models/user.interface';

@Component({
  selector: 'app-user-profile-dropdown',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-profile-dropdown.component.html',
  styleUrls: ['./user-profile-dropdown.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserProfileDropdownComponent implements OnInit, OnDestroy {
  @Output() close = new EventEmitter<void>();

  user: User | null = null;
  isOpen = false;
  private _unsubscribeAll = new Subject<void>();

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private configService: ConfigService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.userService.user$
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((user: User | null) => {
        this.user = user;
      });
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
  }

  toggleDropdown(): void {
    this.isOpen = !this.isOpen;
  }

  closeDropdown(): void {
    this.isOpen = false;
    this.close.emit();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-profile-dropdown')) {
      this.isOpen = false;
    }
  }

  getAvatarUrl(): string | null {
    if (!this.user?.profile_photo_path) {
      return null; // Return null to use initials fallback
    }
    const baseUrl = this.configService.getApiUrl().replace('/api', '');
    return `${baseUrl}/storage/${this.user.profile_photo_path}`;
  }

  navigateToAccount(): void {
    this.closeDropdown();
    this.router.navigate(['/conta/dashboard']);
  }

  navigateToOrders(): void {
    this.closeDropdown();
    this.router.navigate(['/conta/pedidos']);
  }

  navigateToAddresses(): void {
    this.closeDropdown();
    this.router.navigate(['/conta/enderecos']);
  }

  navigateToSettings(): void {
    this.closeDropdown();
    this.router.navigate(['/conta/definicoes']);
  }

  logout(): void {
    this.closeDropdown();
    this.authService.signOut().subscribe(() => {
      this.router.navigate(['/auth/sign-in']);
    });
  }
}

