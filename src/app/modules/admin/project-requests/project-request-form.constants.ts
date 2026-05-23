import { ProjectTypeKey } from './briefing/briefing-form.types';

export const PROJECT_TYPES = [
  { value: 'residencial', label: 'Residencial (moradia, apartamento)' },
  { value: 'comercial', label: 'Comercial (loja, escritório, serviços)' },
  { value: 'industrial', label: 'Industrial / armazém / logística' },
  { value: 'remodelacao', label: 'Remodelação / ampliação' },
  { value: 'misto', label: 'Uso misto (residencial + comercial)' },
  { value: 'outro', label: 'Outro' },
] as const;

export const TIPOLOGIAS_ALL = [
  { value: 't1-t2', label: 'Casa T1 / T2' },
  { value: 't3-plus', label: 'Casa T3 ou superior' },
  { value: 'apartamento', label: 'Apartamento' },
  { value: 'moradia-geminada', label: 'Moradia geminada' },
  { value: 'multifamiliar', label: 'Edifício multifamiliar' },
  { value: 'quinta', label: 'Quinta / chácara' },
  { value: 'loja', label: 'Loja / retalho' },
  { value: 'restaurante', label: 'Restaurante / bar' },
  { value: 'escritorio', label: 'Escritório / serviços' },
  { value: 'clinica', label: 'Clínica / saúde' },
  { value: 'hotel', label: 'Hotel / alojamento' },
  { value: 'escola', label: 'Escola / formação' },
  { value: 'armazem', label: 'Armazém / logística' },
  { value: 'fabrica', label: 'Fábrica / produção' },
  { value: 'oficina', label: 'Oficina / manutenção' },
  { value: 'ampliacao', label: 'Ampliação de edifício' },
  { value: 'remodelacao_interna', label: 'Remodelação interior' },
  { value: 'fachada', label: 'Alteração de fachada' },
  { value: 'edificio_misto', label: 'Edifício misto completo' },
  { value: 'outro', label: 'Outra tipologia' },
] as const;

/** Tipologias mostradas conforme o tipo de projecto seleccionado */
export const TIPOLOGIAS_BY_TYPE: Record<ProjectTypeKey, { value: string; label: string }[]> = {
  residencial: TIPOLOGIAS_ALL.filter((t) =>
    ['t1-t2', 't3-plus', 'apartamento', 'moradia-geminada', 'multifamiliar', 'quinta', 'outro'].includes(
      t.value
    )
  ),
  comercial: TIPOLOGIAS_ALL.filter((t) =>
    ['loja', 'restaurante', 'escritorio', 'clinica', 'hotel', 'escola', 'multifamiliar', 'outro'].includes(
      t.value
    )
  ),
  industrial: TIPOLOGIAS_ALL.filter((t) =>
    ['armazem', 'fabrica', 'oficina', 'outro'].includes(t.value)
  ),
  remodelacao: TIPOLOGIAS_ALL.filter((t) =>
    ['ampliacao', 'remodelacao_interna', 'fachada', 't1-t2', 't3-plus', 'loja', 'escritorio', 'outro'].includes(
      t.value
    )
  ),
  misto: TIPOLOGIAS_ALL.filter((t) =>
    ['edificio_misto', 'multifamiliar', 'loja', 'escritorio', 'outro'].includes(t.value)
  ),
  outro: [...TIPOLOGIAS_ALL],
};

export const DOCUMENT_TYPES = [
  { value: 'referencia', label: 'Foto / referência visual' },
  { value: 'planta_terreno', label: 'Planta ou levantamento do terreno' },
  { value: 'planta_cad', label: 'Planta CAD / DWG' },
  { value: 'estudo_solo', label: 'Estudo geotécnico / solo' },
  { value: 'licenca', label: 'Licença / documento camarário' },
  { value: 'briefing', label: 'Briefing / notas do cliente' },
  { value: 'email', label: 'Anexo de email' },
  { value: 'whatsapp', label: 'Anexo WhatsApp' },
  { value: 'outro', label: 'Outro documento' },
] as const;
