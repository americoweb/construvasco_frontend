import { FormControl, FormGroup, Validators } from '@angular/forms';

/** Subconjunto do briefing para o wizard do cliente (não reutilizar schema do admin). */
export interface StudioBriefingData {
  localizacao?: string;
  area_m2?: number | null;
  num_pisos?: number | null;
  estilo_arquitectonico?: string;
  paleta_acabamento?: string;
}

export const STUDIO_PROJECT_TYPES = [
  { value: 'residencial', label: 'Residencial' },
  { value: 'comercial', label: 'Comercial' },
  { value: 'misto', label: 'Misto' },
] as const;

export const STUDIO_TIPOLOGIAS = [
  { value: 't2', label: 'T2' },
  { value: 't3', label: 'T3' },
  { value: 't4', label: 'T4' },
  { value: 't5', label: 'T5' },
  { value: 'loja', label: 'Loja / comércio' },
  { value: 'outro', label: 'Outro' },
] as const;

export const STUDIO_STYLES = [
  { value: 'contemporaneo', label: 'Contemporâneo' },
  { value: 'tradicional', label: 'Tradicional' },
  { value: 'minimalista', label: 'Minimalista' },
  { value: 'tropical', label: 'Tropical / local' },
] as const;

export const STUDIO_PALETTES = [
  { value: 'neutros', label: 'Tons neutros' },
  { value: 'terrosos', label: 'Terrosos' },
  { value: 'branco_cimento', label: 'Branco e cimento' },
  { value: 'madeira', label: 'Madeira e pedra' },
] as const;

export function createProjectStepForm(): FormGroup {
  return new FormGroup({
    title: new FormControl('', [Validators.required, Validators.maxLength(200)]),
    project_type: new FormControl('', Validators.required),
    tipologia: new FormControl('', Validators.required),
  });
}

export function createBriefingStepForm(): FormGroup {
  return new FormGroup({
    localizacao: new FormControl('', [Validators.required, Validators.maxLength(255)]),
    area_m2: new FormControl<number | null>(null, [Validators.required, Validators.min(20)]),
    num_pisos: new FormControl<number | null>(null, [Validators.required, Validators.min(1), Validators.max(10)]),
    estilo_arquitectonico: new FormControl('', Validators.required),
    paleta_acabamento: new FormControl('', Validators.required),
  });
}

export function briefingFormToPayload(form: FormGroup): Partial<StudioBriefingData> {
  return form.getRawValue() as StudioBriefingData;
}
