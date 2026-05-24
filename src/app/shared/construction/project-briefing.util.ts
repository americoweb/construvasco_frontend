import { ProjectRequest } from './construction.types';
import {
  STUDIO_PALETTES,
  STUDIO_PROJECT_TYPES,
  STUDIO_STYLES,
  STUDIO_TIPOLOGIAS,
} from '../../modules/account/views/customer-studio/studio-briefing.schema';

export interface BriefingFieldRow {
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

function pickString(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s || null;
}

function humanizeKey(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function labelFor(options: ReadonlyArray<{ readonly value: string; readonly label: string }>, value: string): string {
  return options.find((o) => o.value === value)?.label ?? value;
}

function formatValue(raw: unknown, formatter?: (v: string) => string): string | null {
  const s = pickString(raw);
  if (!s) return null;
  return formatter ? formatter(s) : s;
}

export function approvedMockupUrl(req?: ProjectRequest | null): string | null {
  const gen = req?.approved_ai_generation;
  if (gen?.image_url) return gen.image_url;
  return null;
}

export function hasApprovedMockup(req?: ProjectRequest | null): boolean {
  return !!(req?.approved_ai_generation_id && approvedMockupUrl(req));
}

export function briefingRowsFromRequest(req?: ProjectRequest | null): BriefingFieldRow[] {
  if (!req) return [];
  const rows: BriefingFieldRow[] = [];
  const seen = new Set<string>();
  const add = (key: string, raw: unknown, formatter?: (v: string) => string) => {
    const value = formatValue(raw, formatter);
    if (!value || seen.has(key)) return;
    seen.add(key);
    rows.push({ label: BRIEFING_LABELS[key] ?? humanizeKey(key), value });
  };
  add('localizacao', req.briefing_data?.['localizacao'] ?? req.localizacao);
  add('area_m2', req.area_m2 ?? req.briefing_data?.['area_m2'], (v) => `${v} m²`);
  add('num_pisos', req.num_pisos ?? req.briefing_data?.['num_pisos']);
  add('estilo_arquitectonico', req.estilo_arquitectonico ?? req.briefing_data?.['estilo_arquitectonico'], (v) =>
    labelFor(STUDIO_STYLES, v)
  );
  add('paleta_acabamento', req.paleta_acabamento ?? req.briefing_data?.['paleta_acabamento'], (v) =>
    labelFor(STUDIO_PALETTES, v)
  );
  for (const [key, raw] of Object.entries(req.briefing_data ?? {})) {
    if (BRIEFING_COLUMN_KEYS.has(key) || seen.has(key)) continue;
    add(key, raw);
  }
  if (req.project_type) {
    rows.unshift({
      label: 'Tipo de obra',
      value: labelFor(STUDIO_PROJECT_TYPES, req.project_type),
    });
  }
  if (req.tipologia) {
    rows.unshift({
      label: 'Tipologia',
      value: labelFor(STUDIO_TIPOLOGIAS, req.tipologia),
    });
  }
  return rows;
}
