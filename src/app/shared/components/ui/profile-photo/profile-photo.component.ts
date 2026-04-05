import { Component, Input, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { UserService } from '../../../../core/auth/services/user.service';
import { ConfigService } from '../../../../core/services/config.service';
import { User } from '../../../../core/auth/models/user.interface';

@Component({
  selector: 'app-profile-photo',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile-photo.component.html',
  styleUrls: ['./profile-photo.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfilePhotoComponent implements OnInit, OnDestroy {
  @Input() size: 32 | 40 | 48 | 120 = 40;
  @Input() user: User | null = null;
  @Input() src: string | null = null;
  @Input() name: string = '';

  defaultAvatarPath = '/assets/images/default-avatar.png';
  avatarUrl: string | null = null;
  private _unsubscribeAll = new Subject<void>();

  constructor(
    private userService: UserService,
    private configService: ConfigService
  ) {}

  ngOnInit(): void {
    if (!this.user && !this.src) {
      // Subscribe to user if not provided
      this.userService.user$
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe((user: User | null) => {
          this.user = user;
          this.updateAvatarUrl();
        });
    } else {
      this.updateAvatarUrl();
    }
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
  }

  private updateAvatarUrl(): void {
    if (this.src) {
      this.avatarUrl = this.src;
      return;
    }

    if (this.user?.profile_photo_path) {
      const baseUrl = this.configService.getApiUrl().replace('/api', '');
      this.avatarUrl = `${baseUrl}/storage/${this.user.profile_photo_path}`;
    } else {
      // Use null to show initials instead of trying to load non-existent image
      this.avatarUrl = null;
    }
  }

  onImageError(event: Event): void {
    // On error, set to null to show initials fallback
    const img = event.target as HTMLImageElement;
    this.avatarUrl = null;
    // Remove the src to prevent infinite retry loop
    img.src = '';
    img.style.display = 'none';
  }

  get sizeClass(): string {
    return `w-${this.size} h-${this.size}`;
  }

  get displayName(): string {
    if (this.name) return this.name;
    if (this.user?.name) return this.user.name;
    return 'U';
  }

  get initials(): string {
    const name = this.displayName;
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
}

