import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ProjectRequestService } from '../../../shared/construction/project-request.service';
import { ConfigService } from '../../../core/services/config.service';
import { ProjectDocument, ProjectRequest, Quote } from '../../../shared/construction/construction.types';
import {
  STUDIO_PALETTES,
  STUDIO_PROJECT_TYPES,
  STUDIO_STYLES,
  STUDIO_TIPOLOGIAS,
} from '../../account/views/customer-studio/studio-briefing.schema';
import { NotificationService } from '../../../shared/components/feedback/notification.service';
import { SendArchitectureQuoteDialogComponent } from './send-architecture-quote-dialog.component';

interface FieldRow {
  label: string;
  value: string;
}

const BRIEFING_LABELS: Record<string, string> = {
  localizacao: 'Localização aproximada',
  area_m2: 'Área',
  num_pisos: 'Número de pisos',
  estilo_arquitectonico: 'Estilo arquitectónico',
  paleta_acabamento: 'Paleta de acabamentos',
};

const BRIEFING_COLUMN_KEYS = new Set([
  'localizacao',
  'area_m2',
  'num_pisos',
  'estilo_arquitectonico',
  'paleta_acabamento',
]);

@Component({
  selector: 'app-project-request-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatDialogModule,
  ],
  templateUrl: './project-request-detail.component.html',
  styleUrls: ['./project-request-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectRequestDetailComponent implements OnInit {
  loading = true;
  item: ProjectRequest | null = null;
  quotes: Quote[] = [];

  constructor(
    private route: ActivatedRoute,
    private requests: ProjectRequestService,
    private config: ConfigService,
    private notify: NotificationService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.load(id);
  }

  load(id: string): void {
    this.loading = true;
    this.requests.getManager(id).subscribe({
      next: (res) => {
        this.item = res.data;
        this.quotes = res.data.quotes ?? [];
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.notify.error('Não foi possível carregar o pedido.');
        this.cdr.markForCheck();
      },
    });
  }

  openSendQuoteDialog(): void {
    if (!this.item) return;
    const ref = this.dialog.open(SendArchitectureQuoteDialogComponent, {
      width: '480px',
      data: { requestId: this.item.id },
    });
    ref.afterClosed().subscribe((sent) => {
      if (sent) {
        this.notify.success('Orçamento enviado ao cliente.');
        this.load(String(this.item!.id));
      }
    });
  }

  get canSendArchitectureQuote(): boolean {
    if (!this.item) return false;
    const blocked = ['draft', 'rejected', 'cancelled', 'closed', 'converted_to_project'];
    if (blocked.includes(this.item.status ?? '')) return false;
    return !this.quotes.some(
      (q) => (q.quote_type === 'architecture' || !q.quote_type) && q.status === 'sent'
    );
  }

  get hasApprovedMockup(): boolean {
    return !!(this.item?.approved_ai_generation_id && this.approvedMockupUrl);
  }

  get approvedMockupUrl(): string | null {
    const gen = this.item?.approved_ai_generation;
    if (gen?.image_url) return gen.image_url;
    return null;
  }

  get statusLabel(): string {
    const map: Record<string, string> = {
      draft: 'Rascunho',
      submitted: 'Submetido',
      under_review: 'Em análise',
      quoted: 'Orçamentado',
      approved: 'Aprovado',
      rejected: 'Rejeitado',
      cancelled: 'Cancelado',
      converted_to_project: 'Convertido em projecto',
      closed: 'Encerrado',
    };
    return map[this.item?.status ?? ''] ?? this.item?.status ?? '—';
  }

  get clientName(): string {
    return this.item?.client?.name ?? this.item?.user?.name ?? '—';
  }

  get clientEmail(): string {
    return this.item?.client?.email ?? this.item?.user?.email ?? this.item?.user?.identifier ?? '—';
  }

  get clientPhone(): string {
    return this.item?.client?.phone ?? this.item?.whatsapp ?? '—';
  }

  get headerRows(): FieldRow[] {
    const req = this.item;
    if (!req) return [];
    const rows: FieldRow[] = [];
    if (req.project_type) {
      rows.push({ label: 'Tipo de obra', value: this.labelFor(STUDIO_PROJECT_TYPES, req.project_type) });
    }
    if (req.tipologia) {
      rows.push({ label: 'Tipologia', value: this.labelFor(STUDIO_TIPOLOGIAS, req.tipologia) });
    }
    const briefingLoc = this.pickString(req.briefing_data?.['localizacao']);
    if (req.localizacao && req.localizacao !== briefingLoc) {
      rows.push({ label: 'Localização (cabeçalho)', value: req.localizacao });
    }
    return rows;
  }

  get briefingRows(): FieldRow[] {
    const req = this.item;
    if (!req) return [];
    const rows: FieldRow[] = [];
    const seen = new Set<string>();
    const add = (key: string, raw: unknown, formatter?: (v: string) => string) => {
      const value = this.formatValue(raw, formatter);
      if (!value || seen.has(key)) return;
      seen.add(key);
      rows.push({ label: BRIEFING_LABELS[key] ?? this.humanizeKey(key), value });
    };
    add('localizacao', req.briefing_data?.['localizacao'] ?? req.localizacao);
    add('area_m2', req.area_m2 ?? req.briefing_data?.['area_m2'], (v) => `${v} m²`);
    add('num_pisos', req.num_pisos ?? req.briefing_data?.['num_pisos']);
    add('estilo_arquitectonico', req.estilo_arquitectonico ?? req.briefing_data?.['estilo_arquitectonico'], (v) =>
      this.labelFor(STUDIO_STYLES, v)
    );
    add('paleta_acabamento', req.paleta_acabamento ?? req.briefing_data?.['paleta_acabamento'], (v) =>
      this.labelFor(STUDIO_PALETTES, v)
    );
    for (const [key, raw] of Object.entries(req.briefing_data ?? {})) {
      if (BRIEFING_COLUMN_KEYS.has(key) || seen.has(key)) continue;
      add(key, raw);
    }
    return rows;
  }

  documentUrl(doc: ProjectDocument): string | null {
    return doc.file_path ? this.config.getFileUrl(doc.file_path) : null;
  }

  quoteTypeLabel(q: Quote): string {
    return q.quote_type === 'construction' ? 'Obra' : 'Arquitectura';
  }

  quoteStatusLabel(status?: string): string {
    const map: Record<string, string> = {
      sent: 'Enviado',
      accepted: 'Aceite',
      rejected: 'Recusado',
      draft: 'Rascunho',
    };
    return map[status ?? ''] ?? status ?? '—';
  }

  quoteStatusClass(status?: string): string {
    if (status === 'sent') return 'quote-status--sent';
    if (status === 'accepted') return 'quote-status--accepted';
    if (status === 'rejected') return 'quote-status--rejected';
    return '';
  }

  formatMt(amount: number | string | undefined): string {
    const n = Number(amount ?? 0);
    return new Intl.NumberFormat('pt-MZ', { maximumFractionDigits: 0 }).format(n) + ' MT';
  }

  private pickString(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
  }

  private formatValue(raw: unknown, formatter?: (v: string) => string): string {
    if (raw === null || raw === undefined || raw === '') return '';
    const base = String(raw).trim();
    return formatter ? formatter(base) : base;
  }

  private labelFor(options: readonly { value: string; label: string }[], value: string): string {
    return options.find((o) => o.value === value)?.label ?? value;
  }

  private humanizeKey(key: string): string {
    return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }
}
