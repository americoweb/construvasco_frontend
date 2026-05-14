import { BooleanInput } from '@angular/cdk/coercion';
import { CommonModule, NgClass } from '@angular/common';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    Input,
    OnDestroy,
    OnInit,
    ViewEncapsulation,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Router } from '@angular/router';
import { UserService } from 'app/core/auth/services/user.service';
import { User } from 'app/core/auth/models/user.interface';
import { AuthService } from 'app/core/auth/services/auth.service';
import { ConfigService } from 'app/core/services/config.service';
import { AvatarComponent } from 'app/shared/components/ui/avatar/avatar.component';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'user',
    templateUrl: './user.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    exportAs: 'user',
    standalone: true,
    imports: [
        CommonModule,
        MatButtonModule,
        MatMenuModule,
        MatIconModule,
        NgClass,
        MatDividerModule,
        AvatarComponent,
    ],
})
export class UserComponent implements OnInit, OnDestroy {
    /* eslint-disable @typescript-eslint/naming-convention */
    static ngAcceptInputType_showAvatar: BooleanInput;
    /* eslint-enable @typescript-eslint/naming-convention */

    @Input() showAvatar: boolean = true;
    user: User | null = null;

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _router: Router,
        private _userService: UserService,
        private _authService: AuthService,
        private _configService: ConfigService
    ) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get avatar URL for the user
     */
    getAvatarUrl(path: string): string {
        if (!path) {
            return '';
        }
        
        // Laravel storage URLs are: http://localhost/storage/path
        // Not: http://127.0.0.1:8000/api/storage/path
        const baseUrl = this._configService.getApiUrl().replace('/api', '');
        const fullUrl = `${baseUrl}/storage/${path}`;
        
        return fullUrl;
    }

    /**
     * Get user avatar URL
     */
    get userAvatarUrl(): string | null {
        const path = this.user?.profile_photo_path;
        return path ? this.getAvatarUrl(path) : null;
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Subscribe to user changes
        this._userService.user$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((user: User | null) => {
                this.user = user;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Sign out
     */
    signOut(): void {
        this._authService.signOut().subscribe(() => {
            this._router.navigate(['/']);
        });
    }
}
