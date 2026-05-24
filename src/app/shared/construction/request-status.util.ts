export type RequestFilter = 'all' | 'active' | 'completed';

const LABELS: Record<string, string> = {
  draft: 'Rascunho',
  submitted: 'Submetido',
  in_review: 'Em análise',
  quoted: 'Com orçamento',
  converted: 'Concluído',
  cancelled: 'Cancelado',
};

export function requestStatusLabel(status?: string): string {
  if (!status) {
    return '—';
  }
  return LABELS[status] ?? status.replace(/_/g, ' ');
}

export function requestStatusBadgeClass(status?: string): string {
  switch (status) {
    case 'submitted':
    case 'in_review':
      return 'cp-badge--primary';
    case 'quoted':
      return 'cp-badge--warning';
    case 'converted':
      return 'cp-badge--success';
    case 'cancelled':
      return 'cp-badge--error';
    default:
      return 'cp-badge--neutral';
  }
}

export function matchesRequestFilter(status?: string, filter: RequestFilter = 'all'): boolean {
  if (filter === 'all') {
    return true;
  }
  if (filter === 'completed') {
    return status === 'converted';
  }
  return status !== 'converted' && status !== 'cancelled' && status !== 'draft';
}

export function projectTypeLabel(type?: string): string {
  const map: Record<string, string> = {
    residential: 'Residencial',
    commercial: 'Comercial',
    mixed: 'Misto',
  };
  return type ? map[type] ?? type : '—';
}
