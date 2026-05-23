import { firstValueFrom } from 'rxjs';
import { ModalService } from '../../../../shared/components/feedback/modal.service';
import { ConfirmDialogConfig } from '../../../../shared/components/feedback/feedback.types';

export async function studioConfirm(
  modal: ModalService,
  config: ConfirmDialogConfig
): Promise<boolean> {
  const result = await firstValueFrom(modal.confirm(config));
  return !!result?.confirmed;
}
