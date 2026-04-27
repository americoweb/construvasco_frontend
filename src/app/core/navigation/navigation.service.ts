import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Navigation } from 'app/core/navigation/navigation.types';
import { UserService } from 'app/core/auth/services/user.service';
import { Observable, ReplaySubject, tap, of, combineLatest } from 'rxjs';
import { switchMap, shareReplay, catchError } from 'rxjs/operators';
import { adminNavigation, receptionistNavigation, designerNavigation } from 'app/mock-api/common/navigation/data';
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
            this._userService.user$
        ]).pipe(
            switchMap(([navigation, user]) => {
                if (!navigation) {
                    return of(navigation);
                }

                // If user is not yet loaded, fallback to raw default
                if (!user) {
                    return of(navigation);
                }

                const userRole = String(user?.current_tenant_context?.role ?? '')
                    .toLowerCase()
                    .trim();

                let baseDefault: FuseNavigationItem[];

                // Apply role-based filtering
                if (userRole === 'receptionist') {
                    baseDefault = receptionistNavigation;
                } else if (userRole === 'designer') {
                    baseDefault = designerNavigation;
                } else if (!userRole || userRole === 'admin') {
                    // Make admin the default fallback for non-customer roles
                    baseDefault = adminNavigation;
                } else {
                    // other scenarios (customers generally wouldn't hit this due to routing, but just in case)
                    baseDefault = navigation.default || [];
                }

                const translatedNav: Navigation = {
                    default: baseDefault,
                    compact: baseDefault, // you can specify compact equivalents if defined in data.ts
                    futuristic: baseDefault,
                    horizontal: baseDefault,
                };

                return of(translatedNav);
            }),
            shareReplay({ bufferSize: 1, refCount: true })
        );
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get all navigation data
     */
    get(): Observable<Navigation> {
        // Here we just fetch/define the raw navigation structure.
        // It will be filtered by the navigation$ getter.
        const navigation: Navigation = {
            compact: [],
            futuristic: [],
            horizontal: [],
            default: adminNavigation // Provide the maximum set to the raw nav
        };

        return of(navigation).pipe(
            tap((navigation) => {
                this._rawNavigation.next(navigation);
                // Also trigger legacy `_navigation` next just in case
                this._navigation.next(navigation); 
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
