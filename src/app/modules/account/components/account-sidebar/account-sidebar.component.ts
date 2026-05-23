import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { UserService } from '../../../../core/auth/services/user.service';
import { ConfigService } from '../../../../core/services/config.service';
import { User } from '../../../../core/auth/models/user.interface';
import { ProfilePhotoComponent } from '../../../../shared/components/ui/profile-photo/profile-photo.component';

@Component({
  selector: 'app-account-sidebar',
  standalone: true,
  imports: [CommonModule, ProfilePhotoComponent, RouterLink, RouterLinkActive],
  templateUrl: './account-sidebar.component.html',
  styleUrls: ['./account-sidebar.component.scss']
})
export class AccountSidebarComponent implements OnInit, OnDestroy {
  user: User | null = null;
  private _unsubscribeAll = new Subject<void>();

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private configService: ConfigService,
    private router: Router
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

  getAvatarUrl(): string | null {
    if (!this.user?.profile_photo_path) {
      return null; // Return null to use initials fallback
    }
    const baseUrl = this.configService.getApiUrl().replace('/api', '');
    return `${baseUrl}/storage/${this.user.profile_photo_path}`;
  }

  navigateToEditProfile(): void {
    this.router.navigate(['/conta/definicoes']);
  }

  logout(): void {
    this.authService.signOut().subscribe(() => {
      this.router.navigate(['/auth/sign-in']);
    });
  }
}

