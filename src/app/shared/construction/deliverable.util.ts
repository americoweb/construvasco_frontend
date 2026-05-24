import { ProjectDeliverable } from './construction.types';

export const DELIVERABLE_MAX_BYTES = 50 * 1024 * 1024;

export const DELIVERABLE_ALLOWED_EXTENSIONS = ['.pdf', '.dwg', '.png', '.jpg', '.jpeg'];

export function deliverableStatusLabel(status?: string): string {
  const s = normalizeDeliverableStatus(status);
  const map: Record<string, string> = {
    submitted_for_review: 'Em revisão',
    approved: 'Aprovado',
    rejected: 'Rejeitado',
  };
  return map[s] ?? status ?? '—';
}

export function deliverableStatusClass(status?: string): string {
  const s = normalizeDeliverableStatus(status);
  const map: Record<string, string> = {
    submitted_for_review: 'deliverable-status--review',
    approved: 'deliverable-status--approved',
    rejected: 'deliverable-status--rejected',
  };
  return map[s] ?? 'deliverable-status--default';
}

export function normalizeDeliverableStatus(status?: string): string {
  if (status === 'submitted') return 'submitted_for_review';
  return status ?? '';
}

export function isDeliverablePendingReview(d: ProjectDeliverable): boolean {
  return normalizeDeliverableStatus(d.status) === 'submitted_for_review';
}

export function formatFileSize(bytes?: number): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function validateDeliverableFile(file: File): string | null {
  const name = file.name.toLowerCase();
  const okExt = DELIVERABLE_ALLOWED_EXTENSIONS.some((ext) => name.endsWith(ext));
  if (!okExt) {
    return 'Formato não aceite. Use PDF, DWG, PNG ou JPG.';
  }
  if (file.size > DELIVERABLE_MAX_BYTES) {
    return 'O ficheiro excede o limite de 50 MB.';
  }
  return null;
}

export function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function parseFilenameFromDisposition(header: string | null, fallback: string): string {
  if (!header) return fallback;
  const match = /filename\*?=(?:UTF-8''|")?([^";]+)/i.exec(header);
  if (match?.[1]) {
    try {
      return decodeURIComponent(match[1].replace(/"/g, ''));
    } catch {
      return match[1];
    }
  }
  return fallback;
}
