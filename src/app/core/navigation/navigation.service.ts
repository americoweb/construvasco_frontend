import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Navigation } from 'app/core/navigation/navigation.types';
import { Observable, ReplaySubject, tap, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class NavigationService {
    private _httpClient = inject(HttpClient);
    private _navigation: ReplaySubject<Navigation> =
        new ReplaySubject<Navigation>(1);

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Getter for navigation
     */
    get navigation$(): Observable<Navigation> {
        return this._navigation.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get all navigation data
     */
    get(): Observable<Navigation> {
        // Use static navigation data instead of HTTP request
        const navigation: Navigation = {
            compact: [],
            futuristic: [],
            horizontal: [],
            default: [
                {
                    id: 'dashboard',
                    title: 'Dashboard',
                    type: 'basic',
                    icon: 'heroicons_outline:home',
                    link: '/admin/dashboard'
                },
                {
                    id: 'products',
                    title: 'Products',
                    type: 'basic',
                    icon: 'heroicons_outline:shopping-cart',
                    link: '/admin/products'
                },
                {
                    id: 'categories',
                    title: 'Categories',
                    type: 'basic',
                    icon: 'heroicons_outline:tag',
                    link: '/admin/categories'
                },
                {
                    id: 'designs',
                    title: 'Designs',
                    type: 'basic',
                    icon: 'heroicons_outline:pencil',
                    link: '/admin/designs'
                },
                {
                    id: 'orders',
                    title: 'Orders',
                    type: 'basic',
                    icon: 'heroicons_outline:clipboard-document-list',
                    link: '/admin/orders'
                },
                {
                    id: 'job-cards',
                    title: 'Job Cards',
                    type: 'basic',
                    icon: 'heroicons_outline:briefcase',
                    link: '/admin/job-cards'
                },
                {
                    id: 'staff',
                    title: 'Staff',
                    type: 'basic',
                    icon: 'heroicons_outline:users',
                    link: '/admin/staff'
                },
                {
                    id: 'reports',
                    title: 'Reports',
                    type: 'basic',
                    icon: 'heroicons_outline:chart-bar',
                    link: '/admin/reports'
                },
                {
                    id: 'settings',
                    title: 'Settings',
                    type: 'basic',
                    icon: 'heroicons_outline:cog-6-tooth',
                    link: '/settings'
                }
            ]
        };

        return of(navigation).pipe(
            tap((navigation) => {
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
