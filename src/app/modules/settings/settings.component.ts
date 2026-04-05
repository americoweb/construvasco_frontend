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

@Component({
    selector: 'settings',
    templateUrl: './settings.component.html',
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
    drawerOpened: boolean = true;
    panels: any[] = [];
    selectedPanel: string = 'account';
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    permissionStatus: { [key: string]: boolean } = {};

    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _permissionService: PermissionService,
        private _userService: UserService
    ) {}

    ngOnInit(): void {
        // Set up basic panels first (without filtering)
        this.setupBasicPanels();
        this.setupResponsiveBehavior();
        
        // Check if user is already loaded
        if (this._userService.user) {
            this._checkPermissions();
        }
        
        // Wait for user data to be loaded before checking permissions
        this._userService.user$
            .pipe(
                takeUntil(this._unsubscribeAll),
                filter(user => user !== null)
            )
            .subscribe(() => {
                this._checkPermissions();
            });
    }

    private setupBasicPanels(): void {
        this.panels = [
            {
                id: 'account',
                icon: 'heroicons_outline:user-circle',
                title: 'Conta',
                description: 'Gere seu perfil público e informações privadas',
            },
            {
                id: 'security',
                icon: 'heroicons_outline:lock-closed',
                title: 'Segurança',
                description: 'Gere sua senha e preferências de verificação em duas etapas',
            },
           /*  {
                id: 'plan-billing',
                icon: 'heroicons_outline:credit-card',
                title: 'Plano e Faturamento',
                description: 'Gere seu plano de assinatura, método de pagamento e informações de faturamento',
            }, */
            {
                id: 'team',
                icon: 'heroicons_outline:user-group',
                title: 'Equipe',
                description: 'Gere sua equipe existente e altere funções/permissões',
            },
            /* {
                id: 'permissions',
                icon: 'heroicons_outline:key',
                title: 'Permissões',
                description: 'Gerencie a matriz de permissões e papéis do sistema',
            }, */
           /*  {
                id: 'template',
                icon: 'heroicons_outline:document-text',
                title: 'Modelo de Documentos',
                description: 'Gere seu modelo de documentos e assinaturas',
            }, */
            {
                id: 'tickets',
                icon: 'heroicons_outline:ticket',
                title: 'Ajuda e Suporte',
                description: 'Fale conosco por whatsapp para obter ajuda e suporte 24 horas por dia, 7 dias por semana',
            }
        ];
        this._changeDetectorRef.markForCheck();
    }

    private _checkPermissions(): void {
        this._permissionService.checkMultiplePermissions({
            manageCompanySettings: 'tenants.manage_settings',
            manageFinancialWorkflows: 'finance.*',
            manageUsers: 'users.view',
            manageRoles: 'users.manage_roles',
        }).subscribe((response) => {
            console.log('🔍 Permission check results:', response);
            this.permissionStatus = response;
            this.setupPanels(); // Re-setup panels after permissions are loaded
            console.log('🔍 Panels after setup:', this.panels);
        });
    }

    private setupPanels(): void {
        // Filter panels based on permissions
        this.panels = this.panels.filter((panel) => {
            console.log('🔍 Checking panel:', panel.id, 'permissionStatus:', this.permissionStatus);
            
            if (panel.id === 'plan-billing' && !this.permissionStatus.manageCompanySettings) {
                console.log('🔍 Filtering out plan-billing - no manageCompanySettings permission');
                return false;
            }
            if (panel.id === 'team' && !this.permissionStatus.manageUsers) {
                console.log('🔍 Filtering out team - no manageUsers permission');
                return false;
            }
            if (panel.id === 'permissions' && !this.permissionStatus.manageRoles) {
                console.log('🔍 Filtering out permissions - no manageRoles permission');
                return false;
            }
            if (panel.id === 'template' && !this.permissionStatus.manageCompanySettings) {
                console.log('🔍 Filtering out template - no manageCompanySettings permission');
                return false;
            }
            console.log('🔍 Keeping panel:', panel.id);
            return true;
        });

        this._changeDetectorRef.markForCheck();
    }

    private setupResponsiveBehavior(): void {
        // Simple responsive behavior - you can replace with FuseMediaWatcherService if available
        const checkScreenSize = () => {
            if (window.innerWidth >= 1024) { // lg breakpoint
                this.drawerMode = 'side';
                this.drawerOpened = true;
            } else {
                this.drawerMode = 'over';
                this.drawerOpened = false;
            }
            this._changeDetectorRef.markForCheck();
        };

        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    goToPanel(panel: string): void {
        this.selectedPanel = panel;

        if (this.drawerMode === 'over') {
            this.drawer.close();
        }
    }

    getPanelInfo(id: string): any {
        return this.panels.find((panel) => panel.id === id);
    }

    trackByFn(index: number, item: any): any {
        return item.id || index;
    }

    openSupportDialog(): void {
        // Implement support dialog or redirect to WhatsApp
        window.open('https://wa.me/258868875269', '_blank');
    }
}
