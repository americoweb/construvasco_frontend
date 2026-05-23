import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Navigation } from 'app/core/navigation/navigation.types';
import { UserService } from 'app/core/auth/services/user.service';
import { Observable, ReplaySubject, tap, of, combineLatest } from 'rxjs';
import { switchMap, shareReplay, map, startWith } from 'rxjs/operators';
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
        ]).pipe(
            map(([navigation, user]) => {
                const baseDefault = this.resolveNavigationForUser(user);
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
    }
}
