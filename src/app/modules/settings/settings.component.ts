import { CommonModule, NgClass } from '@angular/common';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    OnDestroy,
    OnInit,
    ViewChild,
    ViewEncapsulation,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDrawer, MatSidenavModule } from '@angular/material/sidenav';
import { Subject, takeUntil, filter } from 'rxjs';
import { SettingsAccountComponent } from './account/account.component';
import { SettingsSecurityComponent } from './security/security.component';
import { SettingsTeamComponent } from './team/team.component';
import { PermissionsComponent } from './permissions/permissions.component';
import { PermissionService } from './shared/services/permission.service';
import { SettingsTemplateComponent } from './template/template.component';
import { UserService } from '../../core/auth/services/user.service';
import { User } from '../../core/auth/models/user.interface';

interface SettingsPanel {
    id: string;
    icon: string;
    title: string;
    description: string;
}

@Component({
    selector: 'settings',
    templateUrl: './settings.component.html',
    styleUrls: ['./settings.component.scss'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        MatSidenavModule,
        MatButtonModule,
        MatIconModule,
        NgClass,
        CommonModule,
        SettingsAccountComponent,
        SettingsSecurityComponent,
        SettingsTeamComponent,
        PermissionsComponent,
        SettingsTemplateComponent,
    ],
})
export class SettingsComponent implements OnInit, OnDestroy {
    @ViewChild('drawer') drawer: MatDrawer;
    drawerMode: 'over' | 'side' = 'side';
    drawerOpened = true;
    panels: SettingsPanel[] = [];
    selectedPanel = 'account';
    pageReady = false;
    user: User | null = null;

    permissionStatus: { [key: string]: boolean } = {};

    private _unsubscribeAll = new Subject<void>();
    private _resizeHandler = (): void => this.setupResponsiveBehavior();

    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _permissionService: PermissionService,
        private _userService: UserService
    ) {}

    get userInitial(): string {
        const name = this.user?.name?.trim() || 'U';
        return name.charAt(0).toUpperCase();
    }

    ngOnInit(): void {
        this.setupBasicPanels();
        this.setupResponsiveBehavior();
        window.addEventListener('resize', this._resizeHandler);

        this.user = this._userService.user;
        if (this.user) {
            this.pageReady = true;
        }

        if (this._userService.user) {
            this._checkPermissions();
        }

        this._userService.user$
            .pipe(
                takeUntil(this._unsubscribeAll),
                filter((user) => user !== null)
            )
            .subscribe((user) => {
                this.user = user;
                this.pageReady = true;
                this._checkPermissions();
            });
    }

    private setupBasicPanels(): void {
        this.panels = [
            {
                id: 'account',
                icon: 'heroicons_outline:user-circle',
                title: 'Conta',
                description: 'Perfil público e informações privadas',
            },
            {
                id: 'security',
                icon: 'heroicons_outline:lock-closed',
                title: 'Segurança',
                description: 'Palavra-passe e verificação em dois passos',
            },
            {
                id: 'team',
                icon: 'heroicons_outline:user-group',
                title: 'Equipa',
                description: 'Membros, convites e funções',
            },
            {
                id: 'tickets',
                icon: 'heroicons_outline:chat-bubble-left-right',
                title: 'Ajuda e suporte',
                description: 'WhatsApp e apoio 24/7',
            },
        ];
        this._changeDetectorRef.markForCheck();
    }

    private _checkPermissions(): void {
        this._permissionService
            .checkMultiplePermissions({
                manageCompanySettings: 'tenants.manage_settings',
                manageFinancialWorkflows: 'finance.*',
                manageUsers: 'users.view',
                manageRoles: 'users.manage_roles',
            })
            .subscribe((response) => {
                this.permissionStatus = response;
                this.setupPanels();
            });
    }

    private setupPanels(): void {
        const base = [
            {
                id: 'account',
                icon: 'heroicons_outline:user-circle',
                title: 'Conta',
                description: 'Perfil público e informações privadas',
            },
            {
                id: 'security',
                icon: 'heroicons_outline:lock-closed',
                title: 'Segurança',
                description: 'Palavra-passe e verificação em dois passos',
            },
            {
                id: 'team',
                icon: 'heroicons_outline:user-group',
                title: 'Equipa',
                description: 'Membros, convites e funções',
            },
            {
                id: 'tickets',
                icon: 'heroicons_outline:chat-bubble-left-right',
                title: 'Ajuda e suporte',
                description: 'WhatsApp e apoio 24/7',
            },
        ];

        this.panels = base.filter((panel) => {
            if (panel.id === 'team' && !this.permissionStatus.manageUsers) {
                return false;
            }
            return true;
        });

        if (!this.panels.some((p) => p.id === this.selectedPanel)) {
            this.selectedPanel = this.panels[0]?.id ?? 'account';
        }

        this._changeDetectorRef.markForCheck();
    }

    private setupResponsiveBehavior(): void {
        if (window.innerWidth >= 1024) {
            this.drawerMode = 'side';
            this.drawerOpened = true;
        } else {
            this.drawerMode = 'over';
            this.drawerOpened = false;
        }
        this._changeDetectorRef.markForCheck();
    }

    ngOnDestroy(): void {
        window.removeEventListener('resize', this._resizeHandler);
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    goToPanel(panel: string): void {
        this.selectedPanel = panel;

        if (this.drawerMode === 'over') {
            this.drawer.close();
        }
        this._changeDetectorRef.markForCheck();
    }

    getPanelInfo(id: string): SettingsPanel | undefined {
        return this.panels.find((panel) => panel.id === id);
    }

    trackByFn(index: number, item: SettingsPanel): string {
        return item.id || String(index);
    }

    openSupportDialog(): void {
        window.open('https://wa.me/258868875269', '_blank');
    }
}
