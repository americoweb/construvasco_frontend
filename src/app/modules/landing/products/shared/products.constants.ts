import { FilterConfig, SortOption } from './products.types';

export const ITEMS_PER_PAGE_OPTIONS = [12, 24, 48, 96];
export const DEFAULT_ITEMS_PER_PAGE = 24;
export const DEFAULT_PAGE = 1;

export const SORT_OPTIONS: SortOption[] = [
  { value: 'featured', label: 'Recomendados' },
  { value: 'popular', label: 'Mais Procurados' },
  { value: 'price-asc', label: 'Orçamento: Menor → Maior' },
  { value: 'price-desc', label: 'Orçamento: Maior → Menor' },
  { value: 'name-asc', label: 'Tipo: A → Z' },
  { value: 'newest', label: 'Mais Recentes' },
  { value: 'lead-time', label: 'Prazo Mais Curto' }
];

export const DEFAULT_SORT = 'featured';

// Filter configuration will be populated dynamically from API
// This is a template structure
export const FILTER_CONFIG_TEMPLATE: Omit<FilterConfig, 'categories'> = {
  priceRanges: [
    { id: 'starter', label: 'Até 500.000 MT', min: 0, max: 500000, count: 0 },
    { id: 'family', label: '500.000 - 2.000.000 MT', min: 500000, max: 2000000, count: 0 },
    { id: 'premium', label: '2.000.000 - 5.000.000 MT', min: 2000000, max: 5000000, count: 0 },
    { id: 'signature', label: '5.000.000+ MT', min: 5000000, max: 999999999, count: 0 }
  ],
  leadTime: [
    { id: 'fast', label: '7-15 dias', days: 15, count: 0 },
    { id: 'normal', label: '15-30 dias', days: 30, count: 0 },
    { id: 'extended', label: '30-60 dias', days: 60, count: 0 },
    { id: 'large', label: '60+ dias', days: 999, count: 0 }
  ],
  minimumQuantity: [
    { id: 'pequeno', label: '1-50 unidades', min: 1, max: 50, count: 0 },
    { id: 'medio', label: '50-250 unidades', min: 50, max: 250, count: 0 },
    { id: 'grande', label: '250+ unidades', min: 250, max: 10000, count: 0 }
  ],
  features: [
    { id: 'popular', label: '⭐ Mais Procurados', count: 0 },
    { id: 'novo', label: '🆕 Novos Projetos', count: 0 },
    { id: 'promocao', label: '🏗️ Prontos para Iniciar', count: 0 },
    { id: 'personalizavel', label: '📐 Totalmente Personalizável', count: 0 }
  ]
};

export const WHATSAPP_NUMBER = '258846579067';
export const WHATSAPP_MESSAGE = 'Olá! Quero ajuda a escolher o tipo de projeto antes de encomendar.';

