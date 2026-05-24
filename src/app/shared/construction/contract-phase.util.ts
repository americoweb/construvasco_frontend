import { ConstructionProject } from './construction.types';

export function contractPhaseLabel(phase?: string, fallback?: string): string {
  const map: Record<string, string> = {
    architecture: 'Arquitectura',
    execution_quote: 'Aguarda orçamento de obra',
    construction: 'Obra em andamento',
    completed: 'Concluído',
    closed: 'Encerrado',
  };
  return map[phase ?? ''] ?? fallback ?? phase ?? '—';
}

export function contractPhaseBadgeClass(phase?: string): string {
  const map: Record<string, string> = {
    architecture: 'phase-badge--architecture',
    execution_quote: 'phase-badge--execution-quote',
    construction: 'phase-badge--construction',
    completed: 'phase-badge--completed',
    closed: 'phase-badge--closed',
  };
  return map[phase ?? ''] ?? 'phase-badge--default';
}

export function projectPhaseLabel(p: ConstructionProject): string {
  if (p.contract_phase_label) return p.contract_phase_label;
  return contractPhaseLabel(p.contract_phase, p.current_phase);
}

export function canRequestConstructionQuote(p: ConstructionProject): boolean {
  const archPay = p.architecture_payment ?? p.payment;
  return (
    p.contract_phase === 'architecture' &&
    !!p.architecture_completed_at &&
    archPay?.status === 'confirmed' &&
    !p.construction_quote_requested_at
  );
}

export function requestConstructionQuoteTooltip(p: ConstructionProject): string {
  if (p.construction_quote_requested_at) return 'Pedido de orçamento de obra já enviado';
  if (p.contract_phase !== 'architecture') return 'Indisponível nesta fase';
  if (!p.architecture_completed_at) return 'Aguarda entrega da arquitectura';
  const archPay = p.architecture_payment ?? p.payment;
  if (archPay?.status !== 'confirmed') return 'Confirme o pagamento de arquitectura primeiro';
  return '';
}
