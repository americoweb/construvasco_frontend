import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CustomerPortalService } from '../../../../shared/construction/customer-portal.service';
import { ConfigService } from '../../../../core/services/config.service';
import { ProjectDocument, ProjectRequest } from '../../../../shared/construction/construction.types';
import {
  STUDIO_PALETTES,
  STUDIO_PROJECT_TYPES,
  STUDIO_STYLES,
  STUDIO_TIPOLOGIAS,
} from '../customer-studio/studio-briefing.schema';

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
  selector: 'app-customer-request-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './customer-request-detail.component.html',
  styleUrls: ['./customer-request-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerRequestDetailComponent implements OnInit, OnDestroy {
  loading = true;
  request: ProjectRequest | null = null;
  showSubmitBanner = false;
  private bannerTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private route: ActivatedRoute,
    private portal: CustomerPortalService,
    private config: ConfigService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const submitted = this.route.snapshot.queryParamMap.get('submitted') === '1';
    this.showSubmitBanner = submitted;
    if (submitted) {
      this.bannerTimer = setTimeout(() => {
        this.showSubmitBanner = false;
        this.cdr.markForCheck();
      }, 8000);
    }

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.loading = false;
      return;
    }
    this.portal.getRequest(id).subscribe({
      next: (res) => {
        this.request = res.data;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  ngOnDestroy(): void {
    if (this.bannerTimer) {
      clearTimeout(this.bannerTimer);
    }
  }

  dismissBanner(): void {
    this.showSubmitBanner = false;
    if (this.bannerTimer) {
      clearTimeout(this.bannerTimer);
      this.bannerTimer = null;
    }
  }

  get hasApprovedMockup(): boolean {
    return !!(this.request?.approved_ai_generation_id && this.approvedMockupUrl);
  }

  get approvedMockupUrl(): string | null {
    const req = this.request;
    if (!req) {
      return null;
    }
    if (req.approved_ai_generation?.image_url) {
      return req.approved_ai_generation.image_url;
    }
    const approvedId = req.approved_ai_generation_id;
    if (approvedId && req.ai_generations?.length) {
      const match = req.ai_generations.find((g) => g.id === approvedId);
      return match?.image_url ?? null;
    }
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
    };
    return map[this.request?.status ?? ''] ?? this.request?.status ?? '—';
  }

  get headerRows(): FieldRow[] {
    const req = this.request;
    if (!req) {
      return [];
    }
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
    const req = this.request;
    if (!req) {
      return [];
    }
    const rows: FieldRow[] = [];
    const seen = new Set<string>();

    const add = (key: string, raw: unknown, formatter?: (v: string) => string) => {
      const value = this.formatValue(raw, formatter);
      if (!value || seen.has(key)) {
        return;
      }
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

    const data = req.briefing_data ?? {};
    for (const [key, raw] of Object.entries(data)) {
      if (BRIEFING_COLUMN_KEYS.has(key) || seen.has(key)) {
        continue;
      }
      add(key, raw);
    }

    return rows;
  }

  get referenceDocuments(): ProjectDocument[] {
    return this.request?.documents ?? [];
  }

  documentUrl(doc: ProjectDocument): string | null {
    if (!doc.file_path) {
      return null;
    }
    return this.config.getFileUrl(doc.file_path);
  }

  private pickString(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
  }

  private formatValue(raw: unknown, formatter?: (v: string) => string): string {
    if (raw === null || raw === undefined || raw === '') {
      return '';
    }
    const base = String(raw).trim();
    return formatter ? formatter(base) : base;
  }

  private labelFor(options: readonly { value: string; label: string }[], value: string): string {
    return options.find((o) => o.value === value)?.label ?? value;
  }

  private humanizeKey(key: string): string {
    return key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }
}
