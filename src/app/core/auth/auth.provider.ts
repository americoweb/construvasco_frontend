import {
    ENVIRONMENT_INITIALIZER,
    EnvironmentProviders,
    Provider,
    inject,
} from '@angular/core';
import { AuthService } from 'app/core/auth/services/auth.service';

export const provideAuth = (): Array<Provider | EnvironmentProviders> => {
    return [
        {
            provide: ENVIRONMENT_INITIALIZER,
            useValue: () => inject(AuthService),
            multi: true,
        },
    ];
};
