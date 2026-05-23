import {
  BriefingFieldDef,
  BriefingSectionDef,
  ProjectTypeKey,
  VisibleFor,
} from './briefing-form.types';

const ALL: VisibleFor = '*';
const RES: VisibleFor = ['residencial'];
const COM: VisibleFor = ['comercial'];
const IND: VisibleFor = ['industrial'];
const REM: VisibleFor = ['remodelacao'];
const MIS: VisibleFor = ['misto'];
const RES_COM: VisibleFor = ['residencial', 'comercial', 'misto'];
const BUILT: VisibleFor = ['residencial', 'comercial', 'industrial', 'misto', 'outro'];
const NOT_REM: VisibleFor = ['residencial', 'comercial', 'industrial', 'misto', 'outro'];

const TOPOGRAFIA = [
  { value: 'plano', label: 'Plano' },
  { value: 'suave', label: 'Suavemente inclinado' },
  { value: 'acentuado', label: 'Inclinação acentuada' },
  { value: 'irregular', label: 'Irregular / rochoso' },
];

const ORIENTACAO = [
  { value: 'norte', label: 'Norte' },
  { value: 'sul', label: 'Sul' },
  { value: 'este', label: 'Este' },
  { value: 'oeste', label: 'Oeste' },
  { value: 'misto', label: 'Misto / não definido' },
];

const ESTRUTURA = [
  { value: 'betao_armado', label: 'Betão armado' },
  { value: 'alvenaria', label: 'Alvenaria estrutural' },
  { value: 'metalico', label: 'Estrutura metálica' },
  { value: 'madeira', label: 'Madeira / pré-fabricado' },
  { value: 'misto', label: 'Sistema misto' },
  { value: 'indefinido', label: 'A definir com engenheiro' },
];

const COBERTURA = [
  { value: 'telha', label: 'Telha' },
  { value: 'laje_impermeavel', label: 'Laje impermeabilizada' },
  { value: 'sandwich', label: 'Painel sandwich' },
  { value: 'verde', label: 'Telhado verde' },
];

const GARAGEM = [
  { value: 'nenhuma', label: 'Sem garagem' },
  { value: 'descoberta', label: 'Descoberta' },
  { value: 'coberta', label: 'Coberta' },
  { value: 'box', label: 'Box fechado' },
  { value: 'subterranea', label: 'Subterrânea' },
];

const COZINHA = [
  { value: 'fechada', label: 'Cozinha fechada' },
  { value: 'semi_aberta', label: 'Semi-aberta' },
  { value: 'americana', label: 'Americana / open-space' },
  { value: 'profissional', label: 'Cozinha profissional' },
];

const FINANCIAMENTO = [
  { value: 'proprio', label: 'Recursos próprios' },
  { value: 'credito_bancario', label: 'Crédito bancário' },
  { value: 'misto', label: 'Misto' },
  { value: 'por_definir', label: 'Por definir' },
];

const FASEAMENTO = [
  { value: 'unica', label: 'Obra única' },
  { value: 'fase1_habitacao', label: 'Fase 1 — habitação + fase 2 depois' },
  { value: 'estrutura_acabamentos', label: 'Estrutura primeiro, acabamentos depois' },
];

function f(
  key: string,
  label: string,
  type: BriefingFieldDef['type'],
  visibleFor: VisibleFor,
  extra?: Partial<BriefingFieldDef>
): BriefingFieldDef {
  return { key, label, type, visibleFor, ...extra };
}

export const BRIEFING_SECTIONS: BriefingSectionDef[] = [
  {
    id: 'terreno_detalhe',
    title: 'Terreno e condicionantes do local',
    description: 'Dados do lote, acessos, redes e riscos (checklist arquitectónico)',
    visibleFor: ALL,
    defaultExpanded: true,
    fields: [
      f('provincia', 'Província', 'text', ALL),
      f('bairro', 'Bairro / zona', 'text', ALL),
      f('coordenadas_gps', 'Coordenadas GPS (opcional)', 'text', ALL, {
        placeholder: 'Ex.: -25.9653, 32.5892',
      }),
      f('topografia', 'Topografia do terreno', 'select', ALL, { options: TOPOGRAFIA }),
      f('orientacao_solar', 'Orientação solar principal', 'select', ALL, { options: ORIENTACAO }),
      f('acesso_veiculos', 'Acesso para veículos de obra', 'text', ALL, {
        placeholder: 'Largura do portão, rua, beco...',
      }),
      f('largura_via_acesso_m', 'Largura mínima de acesso (m)', 'number', ALL, { min: 0, step: 0.1 }),
      f('rede_agua', 'Rede de água no local', 'boolean', ALL),
      f('rede_esgoto', 'Rede de esgotos no local', 'boolean', ALL),
      f('rede_energia', 'Rede eléctrica no local', 'boolean', ALL),
      f('internet_fibra', 'Fibra / internet no local', 'boolean', ALL),
      f('inundacao_risco', 'Risco de inundação / zona baixa', 'boolean', ALL),
      f('vento_exposicao', 'Exposição a vento forte', 'text', ALL),
      f('restricoes_urbanisticas', 'Restrições urbanísticas / PDM', 'textarea', ALL, { colSpan: 2 }),
      f('vizinhanca_notas', 'Notas sobre vizinhança / muros', 'textarea', ALL, { colSpan: 2 }),
    ],
  },
  {
    id: 'existente',
    title: 'Edificação existente no terreno',
    visibleFor: ALL,
    fields: [
      f('edificio_existente', 'Existe edificação no terreno', 'boolean', NOT_REM),
      f('ano_edificio_existente', 'Ano de construção (aprox.)', 'number', NOT_REM, { min: 1900, max: 2030 }),
      f('estado_edificio_existente', 'Estado de conservação', 'select', NOT_REM, {
        options: [
          { value: 'bom', label: 'Bom' },
          { value: 'razoavel', label: 'Razoável' },
          { value: 'degradado', label: 'Degradado' },
          { value: 'ruina', label: 'Ruína / demolição total' },
        ],
      }),
      f('area_demolir_m2', 'Área a demolir (m²)', 'number', REM, { min: 0 }),
      f('licenca_anterior', 'Já existiu licença / projecto aprovado', 'boolean', ALL),
    ],
  },
  {
    id: 'programa_residencial',
    title: 'Programa habitacional',
    description: 'Divisões, ocupação e estilo de vida',
    visibleFor: RES,
    defaultExpanded: true,
    fields: [
      f('num_casas_banho', 'N.º casas de banho', 'number', RES, { min: 0, max: 20 }),
      f('num_suites', 'N.º suites', 'number', RES, { min: 0, max: 15 }),
      f('num_salas_estar', 'N.º salas de estar', 'number', RES, { min: 0, max: 5 }),
      f('num_cozinhas', 'N.º cozinhas', 'number', RES, { min: 0, max: 3 }),
      f('area_cozinha_m2', 'Área desejada cozinha (m²)', 'number', RES, { min: 0 }),
      f('area_sala_m2', 'Área desejada sala (m²)', 'number', RES, { min: 0 }),
      f('cozinha_tipo', 'Tipo de cozinha', 'select', RES, { options: COZINHA }),
      f('cozinha_ilha', 'Ilha central na cozinha', 'boolean', RES),
      f('cozinha_aberta_sala', 'Cozinha aberta à sala', 'boolean', RES),
      f('casas_banho_suite', 'Casas de banho dentro das suites', 'boolean', RES),
      f('banheira_duche', 'Preferência banheira / duche', 'select', RES, {
        options: [
          { value: 'duche', label: 'Duche' },
          { value: 'banheira', label: 'Banheira' },
          { value: 'ambos', label: 'Ambos' },
        ],
      }),
      f('num_dependentes', 'N.º de residentes', 'number', RES, { min: 1, max: 30 }),
      f('idade_ocupantes', 'Faixa etária dos residentes', 'text', RES, {
        placeholder: 'Ex.: casal + 2 crianças',
      }),
      f('acessibilidade_mobilidade', 'Necessidades de acessibilidade (PMR)', 'boolean', RES),
      f('animais_estimacao', 'Animais de estimação', 'boolean', RES),
      f('home_office', 'Espaço home office', 'boolean', RES),
      f('quarto_visitas', 'Quarto de visitas', 'boolean', RES),
      f('lavandaria', 'Lavandaria / roupa suja', 'boolean', RES),
      f('escritorio_casa', 'Escritório em casa', 'boolean', RES),
      f('arrumos', 'Arrumos / despensa', 'boolean', RES),
      f('adega', 'Adega / bar', 'boolean', RES),
      f('frequencia_recepcoes', 'Frequência de recepções', 'select', RES, {
        options: [
          { value: 'raro', label: 'Raramente' },
          { value: 'ocasional', label: 'Ocasionalmente' },
          { value: 'frequente', label: 'Frequentemente' },
          { value: 'grande', label: 'Grandes eventos regulares' },
        ],
      }),
      f('estilo_vida_notas', 'Notas sobre estilo de vida', 'textarea', RES, { colSpan: 2 }),
    ],
  },
  {
    id: 'exterior_residencial',
    title: 'Exterior, garagem e lazer',
    visibleFor: RES,
    fields: [
      f('garagem_vagas', 'Vagas de garagem / estacionamento', 'number', RES, { min: 0, max: 20 }),
      f('garagem_tipo', 'Tipo de garagem', 'select', RES, { options: GARAGEM }),
      f('patio_quintal', 'Pátio / quintal', 'boolean', RES),
      f('area_quintal_m2', 'Área quintal desejada (m²)', 'number', RES, { min: 0 }),
      f('piscina', 'Piscina', 'boolean', RES),
      f('churrasqueira_area_lazer', 'Churrasqueira / área de lazer', 'boolean', RES),
      f('terraco', 'Terraço utilizável', 'boolean', RES),
      f('varanda', 'Varanda / sacada', 'boolean', RES),
      f('varanda_area_m2', 'Área de varandas (m²)', 'number', RES, { min: 0 }),
      f('jardim_paisagismo', 'Jardim / paisagismo', 'boolean', RES),
      f('muro_perimetro', 'Muro de vedação', 'boolean', RES),
      f('portao_entrada', 'Tipo de portão pretendido', 'text', RES),
      f('estacionamento_exterior_vagas', 'Estacionamento exterior (vagas)', 'number', RES, { min: 0 }),
      f('iluminacao_exterior', 'Iluminação exterior', 'boolean', RES),
    ],
  },
  {
    id: 'volumes_residencial',
    title: 'Volumes e alturas',
    visibleFor: RES,
    fields: [
      f('altura_pe_direito_m', 'Pé-direito piso térreo (m)', 'number', RES, { min: 2, max: 6, step: 0.1 }),
      f('altura_pe_direito_piso2_m', 'Pé-direito pisos superiores (m)', 'number', RES, { min: 2, max: 5, step: 0.1 }),
      f('subsolo', 'Subsolo / cave habitável', 'boolean', RES),
      f('cave', 'Cave técnica / arrumos', 'boolean', RES),
      f('preferencia_eletrodomesticos', 'Preferências eletrodomésticos embutidos', 'textarea', RES, { colSpan: 2 }),
    ],
  },
  {
    id: 'comercial_operacao',
    title: 'Operação e negócio',
    description: 'Utilizadores, fluxos e horários',
    visibleFor: COM,
    defaultExpanded: true,
    fields: [
      f('tipo_negocio', 'Tipo de negócio / actividade', 'text', COM, { colSpan: 2 }),
      f('nome_marca', 'Nome comercial / marca', 'text', COM),
      f('num_funcionarios', 'N.º funcionários', 'number', COM, { min: 0 }),
      f('num_visitantes_dia', 'Visitantes estimados / dia', 'number', COM, { min: 0 }),
      f('horario_funcionamento', 'Horário de funcionamento', 'text', COM),
      f('fluxo_publico', 'Fluxo de público', 'select', COM, {
        options: [
          { value: 'baixo', label: 'Baixo' },
          { value: 'medio', label: 'Médio' },
          { value: 'alto', label: 'Alto' },
          { value: 'picos', label: 'Picos (restaurante, clínica)' },
        ],
      }),
      f('acessibilidade_publica', 'Acessibilidade para público (PMR)', 'boolean', COM),
    ],
  },
  {
    id: 'comercial_programa',
    title: 'Programa comercial e áreas',
    visibleFor: COM,
    fields: [
      f('area_util_m2', 'Área útil total desejada (m²)', 'number', COM, { min: 0 }),
      f('area_atendimento_m2', 'Área de atendimento / salão (m²)', 'number', COM, { min: 0 }),
      f('area_armazem_loja_m2', 'Área armazém / stock (m²)', 'number', COM, { min: 0 }),
      f('divisoes_comerciais', 'Divisões necessárias', 'textarea', COM, {
        colSpan: 2,
        placeholder: 'Recepção, salas, WC público, escritório, arquivo...',
      }),
      f('estacionamento_clientes', 'Estacionamento clientes (vagas)', 'number', COM, { min: 0 }),
      f('estacionamento_funcionarios', 'Estacionamento funcionários (vagas)', 'number', COM, { min: 0 }),
      f('fachada_comercial', 'Fachada comercial / montra', 'boolean', COM),
      f('montra_vitrine', 'Montra / vitrine', 'boolean', COM),
      f('sinalizacao_exterior', 'Sinalética exterior', 'boolean', COM),
      f('carga_descarga', 'Zona de carga e descarga', 'boolean', COM),
      f('copa_funcionarios', 'Copa / refeitório funcionários', 'boolean', COM),
      f('sanitarios_publicos', 'Sanitários públicos', 'boolean', COM),
      f('ar_condicionado_tipo', 'Ar condicionado', 'select', COM, {
        options: [
          { value: 'split', label: 'Split' },
          { value: 'central', label: 'Central / VRF' },
          { value: 'nenhum', label: 'Não necessário' },
        ],
      }),
      f('sistema_som_ambiente', 'Som ambiente', 'boolean', COM),
    ],
  },
  {
    id: 'industrial',
    title: 'Programa industrial / logística',
    visibleFor: IND,
    defaultExpanded: true,
    fields: [
      f('tipo_operacao_industrial', 'Tipo de operação', 'text', IND, {
        placeholder: 'Armazém, fábrica, oficina, distribuição...',
        colSpan: 2,
      }),
      f('area_producao_m2', 'Área de produção / operação (m²)', 'number', IND, { min: 0 }),
      f('area_armazenagem_m2', 'Área de armazenagem (m²)', 'number', IND, { min: 0 }),
      f('altura_armazem_m', 'Altura útil armazém (m)', 'number', IND, { min: 3, max: 30, step: 0.5 }),
      f('docas_carga', 'Docas de carga', 'boolean', IND),
      f('num_docas', 'N.º de docas', 'number', IND, { min: 0, max: 50 }),
      f('patio_maniobras', 'Pátio de manobras camiões', 'boolean', IND),
      f('carga_pesada_toneladas', 'Carga máxima piso (ton)', 'number', IND, { min: 0 }),
      f('ponte_rolante', 'Ponte rolante / guindaste', 'boolean', IND),
      f('escritorios_planta_m2', 'Escritórios na planta (m²)', 'number', IND, { min: 0 }),
      f('vestiarios', 'Vestiários', 'boolean', IND),
      f('refeitorio_industrial', 'Refeitório', 'boolean', IND),
      f('ventilacao_industrial', 'Ventilação industrial especial', 'boolean', IND),
      f('sistema_incendio_industrial', 'Sistema combate incêndio industrial', 'text', IND),
      f('energia_trifasica', 'Alimentação trifásica / alta potência', 'boolean', IND),
      f('gerador_emergencia', 'Gerador de emergência', 'boolean', IND),
      f('capacidade_kva', 'Potência necessária (kVA)', 'number', IND, { min: 0 }),
    ],
  },
  {
    id: 'remodelacao',
    title: 'Remodelação / ampliação',
    visibleFor: REM,
    defaultExpanded: true,
    fields: [
      f('tipo_intervencao', 'Tipo de intervenção', 'select', REM, {
        options: [
          { value: 'ampliacao', label: 'Ampliação' },
          { value: 'remodelacao_interna', label: 'Remodelação interior' },
          { value: 'fachada', label: 'Alteração de fachada' },
          { value: 'reabilitacao', label: 'Reabilitação estrutural' },
          { value: 'adaptacao', label: 'Adaptação de uso' },
        ],
      }),
      f('habitacao_durante_obra', 'Habitação durante a obra', 'boolean', REM),
      f('area_ampliar_m2', 'Área a ampliar (m²)', 'number', REM, { min: 0 }),
      f('paredes_demolir', 'Paredes / elementos a demolir', 'textarea', REM, { colSpan: 2 }),
      f('instalacoes_a_substituir', 'Instalações a substituir', 'textarea', REM, {
        colSpan: 2,
        placeholder: 'Eléctrica, água, esgotos, AVAC...',
      }),
      f('fachada_alterar', 'Alterar fachada', 'boolean', REM),
      f('prazo_obra_urgente', 'Obra urgente / prazo apertado', 'boolean', REM),
    ],
  },
  {
    id: 'misto',
    title: 'Edifício de uso misto',
    visibleFor: MIS,
    defaultExpanded: true,
    fields: [
      f('pisos_residenciais', 'Pisos residenciais', 'number', MIS, { min: 0, max: 30 }),
      f('pisos_comerciais', 'Pisos comerciais / serviços', 'number', MIS, { min: 0, max: 30 }),
      f('area_residencial_m2', 'Área residencial total (m²)', 'number', MIS, { min: 0 }),
      f('area_comercial_m2', 'Área comercial total (m²)', 'number', MIS, { min: 0 }),
      f('uso_comercial_piso_0', 'Comércio no piso térreo', 'boolean', MIS),
      f('separacao_acustica', 'Separação acústica reforçada', 'boolean', MIS),
    ],
  },
  {
    id: 'estrutura',
    title: 'Estrutura e envolvente',
    description: 'Sistema construtivo e cobertura',
    visibleFor: BUILT,
    fields: [
      f('sistema_estrutural', 'Sistema estrutural preferido', 'select', BUILT, { options: ESTRUTURA }),
      f('tipo_fundacao', 'Tipo de fundação', 'select', BUILT, {
        options: [
          { value: 'sapatas', label: 'Sapatas' },
          { value: 'estacas', label: 'Estacas' },
          { value: 'radier', label: 'Radier' },
          { value: 'directa', label: 'Fundação directa' },
          { value: 'indefinido', label: 'A definir após estudo de solo' },
        ],
      }),
      f('tipo_cobertura', 'Tipo de cobertura', 'select', BUILT, { options: COBERTURA }),
      f('laje_ou_telha', 'Laje vs telhado inclinado', 'select', BUILT, {
        options: [
          { value: 'laje_plana', label: 'Laje plana' },
          { value: 'telhado_inclinado', label: 'Telhado inclinado' },
          { value: 'misto', label: 'Misto' },
        ],
      }),
      f('resistencia_sismica', 'Requisitos sísmicos / zona', 'text', BUILT),
      f('parede_exterior', 'Paredes exteriores', 'select', BUILT, {
        options: [
          { value: 'bloco_cimento', label: 'Bloco de cimento' },
          { value: 'tijolo', label: 'Tijolo' },
          { value: 'painel', label: 'Painel / pré-fabricado' },
          { value: 'outro', label: 'Outro' },
        ],
      }),
      f('isolamento_termico', 'Isolamento térmico', 'select', BUILT, {
        options: [
          { value: 'standard', label: 'Standard' },
          { value: 'reforcado', label: 'Reforçado' },
          { value: 'passiva', label: 'Concepção passiva' },
        ],
      }),
      f('isolamento_acustico', 'Isolamento acústico', 'select', BUILT, {
        options: [
          { value: 'standard', label: 'Standard' },
          { value: 'reforcado', label: 'Reforçado' },
        ],
      }),
    ],
  },
  {
    id: 'mep',
    title: 'Instalações (água, energia, AVAC)',
    visibleFor: BUILT,
    fields: [
      f('agua_quente', 'Água quente sanitária', 'select', BUILT, {
        options: [
          { value: 'boiler_electrico', label: 'Boiler eléctrico' },
          { value: 'solar', label: 'Solar térmico' },
          { value: 'gas', label: 'Gás' },
          { value: 'bomba_calor', label: 'Bomba de calor' },
        ],
      }),
      f('solar_termico', 'Painel solar térmico', 'boolean', BUILT),
      f('painel_solar_fotovoltaico', 'Painéis fotovoltaicos', 'boolean', BUILT),
      f('ar_condicionado', 'Ar condicionado', 'select', BUILT, {
        options: [
          { value: 'nao', label: 'Não' },
          { value: 'zonas_chave', label: 'Zonas chave' },
          { value: 'toda_casa', label: 'Toda a edificação' },
        ],
      }),
      f('aquecimento', 'Aquecimento ambiental', 'text', BUILT),
      f('ventilacao_mecanica', 'Ventilação mecânica', 'boolean', BUILT),
      f('gerador_backup', 'Gerador de backup', 'boolean', BUILT),
      f('fossa_septica', 'Fossa séptica', 'boolean', BUILT),
      f('esgoto_municipal', 'Ligação esgotos municipais', 'boolean', BUILT),
      f('captacao_agua_chuva', 'Captação águas pluviais', 'boolean', BUILT),
    ],
  },
  {
    id: 'sustentabilidade',
    title: 'Sustentabilidade e eficiência',
    visibleFor: ALL,
    fields: [
      f('certificacao_verde', 'Certificação verde desejada', 'select', ALL, {
        options: [
          { value: 'nenhuma', label: 'Nenhuma' },
          { value: 'edge', label: 'EDGE' },
          { value: 'leed', label: 'LEED' },
          { value: 'outra', label: 'Outra' },
        ],
      }),
      f('eficiencia_energetica_meta', 'Meta eficiência energética', 'text', ALL),
      f('materiais_sustentaveis', 'Materiais sustentáveis preferidos', 'textarea', ALL, { colSpan: 2 }),
    ],
  },
  {
    id: 'acabamentos',
    title: 'Acabamentos e materiais',
    visibleFor: [...RES, ...COM, ...MIS, 'outro'] as VisibleFor,
    fields: [
      f('materiais_preferidos', 'Materiais preferidos', 'textarea', RES_COM, { colSpan: 2 }),
      f('materiais_evitar', 'Materiais a evitar', 'textarea', RES_COM, { colSpan: 2 }),
      f('tipo_pavimento', 'Pavimentos interiores', 'text', RES_COM),
      f('tipo_revestimento', 'Revestimentos (paredes)', 'text', RES_COM),
      f('cor_predominante', 'Cores predominantes', 'text', RES_COM),
      f('iluminacao_preferencia', 'Iluminação (natural / LED / indirecta)', 'text', RES_COM),
      f('mobiliario_incluido', 'Mobiliário incluído no projecto', 'boolean', RES_COM),
    ],
  },
  {
    id: 'planeamento_obra',
    title: 'Planeamento, licenciamento e obra',
    visibleFor: ALL,
    fields: [
      f('requer_aprovacao_camara', 'Requer aprovação municipal', 'boolean', ALL),
      f('topografia_levantada', 'Já tem topografia / levantamento', 'boolean', ALL),
      f('estudo_solo', 'Estudo geotécnico de solo', 'select', ALL, {
        options: [
          { value: 'sim', label: 'Sim, disponível' },
          { value: 'nao', label: 'Não — solicitar' },
          { value: 'planeado', label: 'Planeado' },
        ],
      }),
      f('projecto_aprovado_anterior', 'Projecto aprovado anteriormente', 'text', ALL),
      f('faseamento_obra', 'Faseamento da obra', 'select', ALL, { options: FASEAMENTO }),
      f('data_inicio_desejada', 'Data início desejada', 'date', ALL),
      f('financiamento', 'Forma de financiamento', 'select', ALL, { options: FINANCIAMENTO }),
      f('urgencia_obra', 'Urgência na execução', 'boolean', ALL),
      f('contacto_obra_local', 'Contacto no local da obra', 'text', ALL),
      f('inspiracao_descricao', 'Referências / inspiração (descrição)', 'textarea', ALL, {
        colSpan: 2,
        placeholder: 'Estilos, projectos vistos, Pinterest, revistas...',
      }),
    ],
  },
];

export function isVisibleForType(visibleFor: VisibleFor, projectType: ProjectTypeKey): boolean {
  if (visibleFor === '*') return true;
  return visibleFor.includes(projectType);
}

export function getVisibleSections(projectType: ProjectTypeKey): BriefingSectionDef[] {
  return BRIEFING_SECTIONS.map((section) => ({
    ...section,
    fields: section.fields.filter((field) => isVisibleForType(field.visibleFor, projectType)),
  })).filter(
    (section) =>
      isVisibleForType(section.visibleFor, projectType) && section.fields.length > 0
  );
}

export function getAllBriefingFieldKeys(projectType: ProjectTypeKey): string[] {
  return getVisibleSections(projectType).flatMap((s) => s.fields.map((f) => f.key));
}
