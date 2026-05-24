import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Navigation } from 'app/core/navigation/navigation.types';
import { UserService } from 'app/core/auth/services/user.service';
import { Observable, ReplaySubject, tap, of, combineLatest, BehaviorSubject } from 'rxjs';
import { shareReplay, map, startWith, catchError } from 'rxjs/operators';
import { ConstructionProjectService } from 'app/shared/construction/construction-project.service';
import {
    adminNavigation,
    projectManagerNavigation,
    technicianNavigation,
    receptionistNavigation,
    designerNavigation,
} from 'app/mock-api/common/navigation/data';
import { FuseNavigationItem } from '@fuse/components/navigation';

@Injectable({ providedIn: 'root' })
export class NavigationService {
    private _httpClient = inject(HttpClient);
    private _userService = inject(UserService);
    private _projects = inject(ConstructionProjectService);
    private _pendingPaymentsCount$ = new BehaviorSubject<number>(0);

    private _navigation: ReplaySubject<Navigation> = new ReplaySubject<Navigation>(1);
    private _rawNavigation: ReplaySubject<Navigation> = new ReplaySubject<Navigation>(1);

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Getter for navigation with role filtering
     */
    get navigation$(): Observable<Navigation> {
        return combineLatest([
            this._rawNavigation.asObservable(),
            this._userService.user$.pipe(startWith(this._userService.user)),
            this._pendingPaymentsCount$,
        ]).pipe(
            map(([_navigation, user, pendingCount]) => {
                const baseDefault = this.applyPaymentBadge(
                    this.resolveNavigationForUser(user),
                    pendingCount
                );
                return {
                    default: baseDefault,
                    compact: baseDefault,
                    futuristic: baseDefault,
                    horizontal: baseDefault,
                };
            }),
            shareReplay({ bufferSize: 1, refCount: true })
        );
    }

    /** Map API / tenant role to sidebar items */
    private resolveNavigationForUser(user: { current_tenant_context?: { role?: string } } | null): FuseNavigationItem[] {
        const userRole = this.normalizeRole(user?.current_tenant_context?.role);

        if (userRole === 'admin') {
            return adminNavigation;
        }
        if (userRole === 'project_manager' || userRole === 'receptionist' || userRole === 'gestor') {
            return projectManagerNavigation;
        }
        if (userRole === 'technician' || userRole === 'designer' || userRole === 'tecnico' || userRole === 'desenhista') {
            return technicianNavigation;
        }

        // Perfil ainda a carregar (resolver trata de auth/me antes do layout)
        if (!user || !userRole) {
            return [];
        }

        return adminNavigation;
    }

    private normalizeRole(roleLike: unknown): string {
        return String(roleLike ?? '')
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '_');
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get all navigation data
     */
    get(): Observable<Navigation> {
        const navigation: Navigation = {
            compact: [],
            futuristic: [],
            horizontal: [],
            default: [],
        };

        return of(navigation).pipe(
            tap((nav) => {
                this._rawNavigation.next(nav);
                this._navigation.next(nav);
            })
        );
    }

    /**
     * Initialize navigation data
     */
    initialize(): void {
        this.get().subscribe();
        this.refreshPendingPaymentsBadge();
        this._userService.user$.pipe(startWith(this._userService.user)).subscribe(() => {
            this.refreshPendingPaymentsBadge();
        });
    }

    private refreshPendingPaymentsBadge(): void {
        const role = this.normalizeRole(this._userService.user?.current_tenant_context?.role);
        if (!['admin', 'project_manager', 'gestor'].includes(role)) {
            this._pendingPaymentsCount$.next(0);
            return;
        }
        this._projects
            .getManagerDashboard()
            .pipe(catchError(() => of({ data: { pending_payments_count: 0 } })))
            .subscribe((res) => {
                this._pendingPaymentsCount$.next(res.data?.pending_payments_count ?? 0);
            });
    }

    private applyPaymentBadge(
        items: FuseNavigationItem[],
        count: number
    ): FuseNavigationItem[] {
        if (count <= 0) {
            return items;
        }
        return items.map((item) => {
            if (item.id !== 'projectos') {
                return item;
            }
            return {
                ...item,
                badge: {
                    title: String(count > 99 ? '99+' : count),
                    classes: 'px-2 py-0.5 text-xs font-bold bg-red-600 text-white rounded-full',
                },
            };
        });
    }
}
