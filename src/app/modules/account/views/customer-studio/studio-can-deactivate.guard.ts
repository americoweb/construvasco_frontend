import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { map } from 'rxjs/operators';
import { ModalService } from '../../../../shared/components/feedback/modal.service';

export interface StudioCanDeactivate {
  canLeaveStudio(): boolean;
}

export const studioCanDeactivateGuard: CanDeactivateFn<StudioCanDeactivate> = (component) => {
  if (!component?.canLeaveStudio) {
    return true;
  }
  if (component.canLeaveStudio()) {
    return true;
  }
  return inject(ModalService)
    .confirm({
      title: 'Sair do estúdio',
      message:
        'Há uma geração em curso. Se sair agora, o pedido pode continuar no servidor e consumir créditos. Deseja mesmo sair?',
      confirmText: 'Sair',
      cancelText: 'Ficar',
      type: 'warning',
    })
    .pipe(map((result) => !!result?.confirmed));
};
