import { inject } from '@angular/core';
import { NavigationService } from 'app/core/navigation/navigation.service';
import { UserService } from 'app/core/auth/services/user.service';
import { AuthService } from 'app/core/auth/services/auth.service';
import { MessagesService } from 'app/layout/common/messages/messages.service';
import { NotificationsService } from 'app/layout/common/notifications/notifications.service';
import { QuickChatService } from 'app/layout/common/quick-chat/quick-chat.service';
import { ShortcutsService } from 'app/layout/common/shortcuts/shortcuts.service';
import { forkJoin, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

export const initialDataResolver = () => {
    const messagesService = inject(MessagesService);
    const navigationService = inject(NavigationService);
    const notificationsService = inject(NotificationsService);
    const quickChatService = inject(QuickChatService);
    const shortcutsService = inject(ShortcutsService);
    const userService = inject(UserService);
    const authService = inject(AuthService);

    return authService.check().pipe(
        switchMap((authenticated) => {
            const userLoad$ =
                authenticated && !userService.user
                    ? userService.getCurrentUser().pipe(catchError(() => of(null)))
                    : of(userService.user);

            return userLoad$.pipe(
                switchMap(() =>
                    forkJoin([
                        navigationService.get(),
                        messagesService.getAll(),
                        notificationsService.getAll(),
                        quickChatService.getChats(),
                        shortcutsService.getAll(),
                    ])
                )
            );
        })
    );
};
