import { DOCUMENT } from '@angular/common';
import {
    Component,
    Inject,
    OnDestroy,
    OnInit,
    Renderer2,
    ViewEncapsulation,
} from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { FuseConfig, FuseConfigService } from '@fuse/services/config';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { FusePlatformService } from '@fuse/services/platform';
import { FUSE_VERSION } from '@fuse/version';
import { Subject, combineLatest, filter, map, takeUntil } from 'rxjs';
import { SettingsComponent } from './common/settings/settings.component';
import { EmptyLayoutComponent } from './layouts/empty/empty.component';
import { CenteredLayoutComponent } from './layouts/horizontal/centered/centered.component';
import { EnterpriseLayoutComponent } from './layouts/horizontal/enterprise/enterprise.component';
import { MaterialLayoutComponent } from './layouts/horizontal/material/material.component';
import { ModernLayoutComponent } from './layouts/horizontal/modern/modern.component';
import { ClassicLayoutComponent } from './layouts/vertical/classic/classic.component';
import { ClassyLayoutComponent } from './layouts/vertical/classy/classy.component';
import { CompactLayoutComponent } from './layouts/vertical/compact/compact.component';
import { DenseLayoutComponent } from './layouts/vertical/dense/dense.component';
import { FuturisticLayoutComponent } from './layouts/vertical/futuristic/futuristic.component';
import { ThinLayoutComponent } from './layouts/vertical/thin/thin.component';

@Component({
    selector: 'layout',
    templateUrl: './layout.component.html',
    styleUrls: ['./layout.component.scss'],
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [
        EmptyLayoutComponent,
        CenteredLayoutComponent,
        EnterpriseLayoutComponent,
        MaterialLayoutComponent,
        ModernLayoutComponent,
        ClassicLayoutComponent,
        ClassyLayoutComponent,
        CompactLayoutComponent,
        DenseLayoutComponent,
        FuturisticLayoutComponent,
        ThinLayoutComponent,
        SettingsComponent,
    ],
})
export class LayoutComponent implements OnInit, OnDestroy {
    config: FuseConfig;
    layout: string;
    scheme: 'dark' | 'light';
    theme: string;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _activatedRoute: ActivatedRoute,
        @Inject(DOCUMENT) private _document: any,
        private _renderer2: Renderer2,
        private _router: Router,
        private _fuseConfigService: FuseConfigService,
        private _fuseMediaWatcherService: FuseMediaWatcherService,
        private _fusePlatformService: FusePlatformService
    ) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Set the theme and scheme based on the configuration
        combineLatest([
            this._fuseConfigService.config$,
            this._fuseMediaWatcherService.onMediaQueryChange$([
                '(prefers-color-scheme: dark)',
                '(prefers-color-scheme: light)',
            ]),
        ])
            .pipe(
                takeUntil(this._unsubscribeAll),
                map(([config, mql]) => {
                    const options = {
                        scheme: config.scheme,
                        theme: config.theme,
                    };

                    // If the scheme is set to 'auto'...
                    if (config.scheme === 'auto') {
                        // Decide the scheme using the media query
                        options.scheme = mql.breakpoints[
                            '(prefers-color-scheme: dark)'
                        ]
                            ? 'dark'
                            : 'light';
                    }

                    return options;
                })
            )
            .subscribe((options) => {
                // Store the options
                this.scheme = options.scheme;
                this.theme = options.theme;

                // Update the scheme and theme
                this._updateScheme();
                this._updateTheme();
            });

        // Subscribe to config changes
        this._fuseConfigService.config$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((config: FuseConfig) => {
                // Store the config
                this.config = config;

                // Update the layout with delay to prevent stack overflow
                setTimeout(() => {
                    try {
                this._updateLayout();
                    } catch (error) {
                        console.error('[LayoutComponent] Error updating layout from config:', error);
                        // Fallback to default layout
                        if (this.config) {
                            this.layout = this.config.layout;
                        }
                    }
                }, 0);
            });

        // Subscribe to NavigationEnd event
        this._router.events
            .pipe(
                filter((event) => event instanceof NavigationEnd),
                takeUntil(this._unsubscribeAll)
            )
            .subscribe(() => {
                // Use a delay to ensure route tree is fully resolved and stable
                setTimeout(() => {
                    try {
                        // Check if router is in a stable state before updating
                        if (this._router.routerState && this._activatedRoute) {
                            this._updateLayout();
                        } else {
                            console.warn('[LayoutComponent] Router state not ready, skipping layout update');
                        }
                    } catch (error) {
                        console.error('[LayoutComponent] Error updating layout after navigation:', error);
                        // Fallback to default layout if there's an error
                        if (this.config) {
                            this.layout = this.config.layout;
                        }
                    }
                }, 50); // Small delay to ensure route tree is stable
            });

        // Set the app version
        this._renderer2.setAttribute(
            this._document.querySelector('[ng-version]'),
            'fuse-version',
            FUSE_VERSION
        );

        // Set the OS name
        this._renderer2.addClass(
            this._document.body,
            this._fusePlatformService.osName
        );
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
    // @ Private methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Update the selected layout
     */
    private _updateLayout(): void {
        try {
            // Safety check: ensure activated route exists
            if (!this._activatedRoute) {
                console.warn('[LayoutComponent] Activated route is null, skipping layout update');
                return;
            }

            // Get the current activated route - use snapshot to avoid subscription issues
            let route = this._activatedRoute.snapshot;
            let currentRoute = this._activatedRoute;

            // Prevent potential infinite loops if the router tree is malformed
            const visitedRoutes = new Set<any>();
            let depth = 0;
            const maxDepth = 20; // Safety limit to prevent infinite loops
            
            // Traverse using ActivatedRoute, not snapshot, to avoid issues
            while (currentRoute?.firstChild && !visitedRoutes.has(currentRoute.firstChild) && depth < maxDepth) {
                // Additional safety check
                if (currentRoute === currentRoute.firstChild) {
                    console.warn('[LayoutComponent] Circular reference detected: route === route.firstChild');
                    break;
        }
                visitedRoutes.add(currentRoute);
                currentRoute = currentRoute.firstChild;
                depth++;
            }
            
            if (!currentRoute || visitedRoutes.has(currentRoute) || depth >= maxDepth) {
                if (depth >= maxDepth) {
                    console.warn('[LayoutComponent] Route traversal exceeded max depth, stopping to prevent stack overflow');
                }
                if (visitedRoutes.has(currentRoute)) {
                    console.warn('[LayoutComponent] Circular reference detected in route traversal');
                }
                return;
            }
            
            // Use snapshot from the traversed route
            route = currentRoute.snapshot;
            
            // Safety check: ensure route snapshot exists
            if (!route) {
                console.warn('[LayoutComponent] Route snapshot is null, skipping layout update');
                return;
            }
        
        // 1. Set the layout from the config
        this.layout = this.config.layout;

        // 2. Get the query parameter from the current route and
        // set the layout and save the layout to the config
        // Note: route is already a snapshot, so use route.queryParamMap directly
        const layoutFromQueryParam = route.queryParamMap.get('layout');
        if (layoutFromQueryParam) {
            this.layout = layoutFromQueryParam;
            if (this.config) {
                this.config.layout = layoutFromQueryParam;
            }
        }

        // 3. Iterate through the paths and change the layout as we find
        // a config for it.
        //
        // The reason we do this is that there might be empty grouping
        // paths or componentless routes along the path. Because of that,
        // we cannot just assume that the layout configuration will be
        // in the last path's config or in the first path's config.
        //
        // So, we get all the paths that matched starting from root all
        // the way to the current activated route, walk through them one
        // by one and change the layout as we find the layout config. This
        // way, layout configuration can live anywhere within the path and
        // we won't miss it.
        //
        // Also, this will allow overriding the layout in any time so we
        // can have different layouts for different routes.
        try {
            const paths = route.pathFromRoot ?? [];
            const processed = new Set<any>();
            const maxPaths = 50; // Safety limit
            
            if (paths.length > maxPaths) {
                console.warn('[LayoutComponent] pathFromRoot array is too large:', paths.length, 'limiting to prevent stack overflow');
            }
            
            // Safety check: ensure paths array is valid and not circular
            if (!Array.isArray(paths)) {
                console.warn('[LayoutComponent] pathFromRoot is not an array, skipping');
                return;
            }
            
            // Process paths with additional safety checks
            for (let index = 0; index < Math.min(paths.length, maxPaths); index++) {
                const path = paths[index];
                
                // Skip if path is null/undefined or already processed
                if (!path) {
                    continue;
                }
                
                // Use a unique identifier for the path to detect circular references
                const pathId = path.routeConfig?.path || `index-${index}`;
                
                if (processed.has(pathId)) {
                    console.warn('[LayoutComponent] Circular reference detected in pathFromRoot at index:', index, 'path:', pathId);
                    break; // Break instead of continue to stop processing
                }
                
                processed.add(pathId);
                
                // Check if there is a 'layout' data
                if (
                    path.routeConfig &&
                    path.routeConfig.data &&
                    path.routeConfig.data.layout
                ) {
                    // Set the layout
                    this.layout = path.routeConfig.data.layout;
                }
            }
        } catch (pathError) {
            console.error('[LayoutComponent] Error processing pathFromRoot:', pathError);
            // Continue with default layout if path processing fails
        }
        } catch (error) {
            console.error('[LayoutComponent] Error in _updateLayout:', error);
            // Fallback to default layout if there's an error
            if (this.config) {
                this.layout = this.config.layout;
            }
        }
    }

    /**
     * Update the selected scheme
     *
     * @private
     */
    private _updateScheme(): void {
        // Remove class names for all schemes
        this._document.body.classList.remove('light', 'dark');

        // Add class name for the currently selected scheme
        this._document.body.classList.add(this.scheme);
    }

    /**
     * Update the selected theme
     *
     * @private
     */
    private _updateTheme(): void {
        // Find the class name for the previously selected theme and remove it
        this._document.body.classList.forEach((className: string) => {
            if (className.startsWith('theme-')) {
                this._document.body.classList.remove(
                    className,
                    className.split('-')[1]
                );
            }
        });

        // Add class name for the currently selected theme
        this._document.body.classList.add(this.theme);
    }
}
