import { ProjectPayment } from './construction.types';

export const PAYMENT_PROOF_MAX_BYTES = 10 * 1024 * 1024;
export const PAYMENT_PROOF_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg'];

export const BANK_DETAILS_PLACEHOLDER = `Construvasco, Lda.
BCI — conta a definir
M-Pesa / e-Mola — número a definir
(Contacte-nos para dados actualizados)`;

export function formatMoneyMt(v?: number | string | null): string {
  if (v === null || v === undefined || v === '') return '—';
  const n = Number(v);
  if (Number.isNaN(n)) return '—';
  return new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(n);
}

export function paymentStatusLabel(status?: string): string {
  const map: Record<string, string> = {
    pending: 'Pendente',
    proof_submitted: 'Aguarda confirmação',
    confirmed: 'Confirmado',
    rejected: 'Rejeitado',
  };
  return map[status ?? ''] ?? status ?? '—';
}

export function paymentCardClass(status?: string): string {
  const map: Record<string, string> = {
    pending: 'payment-card--pending',
    proof_submitted: 'payment-card--submitted',
    confirmed: 'payment-card--confirmed',
    rejected: 'payment-card--rejected',
  };
  return map[status ?? ''] ?? 'payment-card--pending';
}

export function canCustomerDownload(payment?: ProjectPayment | null): boolean {
  return payment?.status === 'confirmed';
}

export function downloadBlockedTooltip(payment?: ProjectPayment | null): string {
  const s = payment?.status;
  if (s === 'proof_submitted') return 'Aguarda confirmação do pagamento pelo gestor';
  if (s === 'rejected') return 'Submeta novo comprovativo para descarregar';
  return 'Submeta o comprovativo de pagamento para descarregar';
}

export function validatePaymentProofFile(file: File): string | null {
  const name = file.name.toLowerCase();
  if (!PAYMENT_PROOF_EXTENSIONS.some((ext) => name.endsWith(ext))) {
    return 'Formato não aceite. Use PDF, PNG ou JPG.';
  }
  if (file.size > PAYMENT_PROOF_MAX_BYTES) {
    return 'O ficheiro excede o limite de 10 MB.';
  }
  return null;
}
