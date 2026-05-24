import { APP_INITIALIZER, ApplicationConfig, importProvidersFrom, inject } from '@angular/core';
import { PreloadAllModules, provideRouter, withInMemoryScrolling, withPreloading, withRouterConfig, RouteReuseStrategy } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { LocationStrategy, HashLocationStrategy } from '@angular/common';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideToastr } from 'ngx-toastr';

import { routes } from './app.routes';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { loadingInterceptor } from './core/interceptors/loading.interceptor';
import { authInterceptor } from './core/auth/auth.interceptor';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { provideTransloco, TranslocoService } from '@ngneat/transloco';
import { TranslocoHttpLoader } from './core/transloco/transloco.http-loader';
import { firstValueFrom } from 'rxjs';
import { provideAuth } from './core/auth/auth.provider';
import { provideIcons } from './core/icons/icons.provider';
import { provideFuse } from '@fuse';
import { mockApiServices } from './mock-api';
import { LuxonDateAdapter } from '@angular/material-luxon-adapter';
import { NavigationService } from './core/navigation/navigation.service';
import { AccountRouteReuseStrategy } from './core/routing/account-route-reuse-strategy';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withPreloading(PreloadAllModules),
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled' }),
      withRouterConfig({ onSameUrlNavigation: 'reload' })
    ),
    // Custom Route Reuse Strategy to prevent account routes from being reused
    {
      provide: RouteReuseStrategy,
      useClass: AccountRouteReuseStrategy
    },
    // Hash Location Strategy
    {
      provide: LocationStrategy,
      useClass: HashLocationStrategy
    },
    provideHttpClient(
      withInterceptors([
        authInterceptor,    // Add auth headers
        errorInterceptor,   // Handle errors
        loadingInterceptor  // Manage loading states
      ])
    ),
    provideAnimationsAsync(),
    provideToastr(),

    // Material Date Adapter
    {
        provide: DateAdapter,
        useClass: LuxonDateAdapter,
    },
    {
        provide: MAT_DATE_FORMATS,
        useValue: {
            parse: {
                dateInput: 'D',
            },
            display: {
                dateInput: 'DDD',
                monthYearLabel: 'LLL yyyy',
                dateA11yLabel: 'DD',
                monthYearA11yLabel: 'LLLL yyyy',
            },
        },
    },

    // Initialize Navigation Service
    {
        provide: APP_INITIALIZER,
        useFactory: () => {
            const navigationService = inject(NavigationService);
            return () => navigationService.initialize();
        },
        multi: true,
    },

    // Transloco Config
    provideTransloco({
        config: {
            availableLangs: [
                {
                    id: 'en',
                    label: 'English',
                },
                {
                    id: 'tr',
                    label: 'Turkish',
                },
                {
                    id: 'pt',
                    label: 'Portuguese',
                },
            ],
            defaultLang: 'pt',
            fallbackLang: 'pt',
            reRenderOnLangChange: true,
            prodMode: true,
        },
        loader: TranslocoHttpLoader,
    }),
    {
        // Preload the default language before the app starts to prevent empty/jumping content
        provide: APP_INITIALIZER,
        useFactory: () => {
            const translocoService = inject(TranslocoService);
            const savedLang = localStorage.getItem('selectedLanguage');
            const defaultLang = savedLang || translocoService.getDefaultLang();
            
            // Set the active language
            translocoService.setActiveLang(defaultLang);

            return () => firstValueFrom(translocoService.load(defaultLang));
        },
        multi: true,
    },

    // Fuse
    provideAuth(),
    provideIcons(),
    provideFuse({
        mockApi: {
            delay: 0,
            services: mockApiServices,
        },
        fuse: {
            layout: 'classy',
            scheme: 'light',
            screens: {
                sm: '600px',
                md: '960px',
                lg: '1280px',
                xl: '1440px',
            },
            theme: 'theme-default',
            themes: [
                {
                    id: 'theme-default',
                    name: 'Default',
                },
                {
                    id: 'theme-brand',
                    name: 'Brand',
                },
                {
                    id: 'theme-teal',
                    name: 'Teal',
                },
                {
                    id: 'theme-rose',
                    name: 'Rose',
                },
                {
                    id: 'theme-purple',
                    name: 'Purple',
                },
                {
                    id: 'theme-amber',
                    name: 'Amber',
                },
            ],
        },
    }),

    // Toastr
    provideToastr({
      timeOut: 5000,
      extendedTimeOut: 1000,
      closeButton: true,
      progressBar: true,
      progressAnimation: 'decreasing',
      enableHtml: true,
      preventDuplicates: false,
      newestOnTop: true,
      maxOpened: 5,
      autoDismiss: true,
      positionClass: 'toast-top-right',
      toastClass: 'ngx-toastr custom-toast',
      titleClass: 'toast-title',
      messageClass: 'toast-message',
      easing: 'ease-in',
      easeTime: 300,
      tapToDismiss: true,
      onActivateTick: false,
      iconClasses: {
        error: 'toast-error',
        info: 'toast-info',
        success: 'toast-success',
        warning: 'toast-warning'
      }
    }),
  ]
}
 
