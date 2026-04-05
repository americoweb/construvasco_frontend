import { FilterConfig, SortOption } from './products.types';

export const ITEMS_PER_PAGE_OPTIONS = [12, 24, 48, 96];
export const DEFAULT_ITEMS_PER_PAGE = 24;
export const DEFAULT_PAGE = 1;

export const SORT_OPTIONS: SortOption[] = [
  { value: 'featured', label: 'Recomendados' },
  { value: 'popular', label: 'Mais Populares' },
  { value: 'price-asc', label: 'Preço: Menor → Maior' },
  { value: 'price-desc', label: 'Preço: Maior → Menor' },
  { value: 'name-asc', label: 'Nome: A → Z' },
  { value: 'newest', label: 'Mais Recentes' },
  { value: 'lead-time', label: 'Entrega Mais Rápida' }
];

export const DEFAULT_SORT = 'featured';

// Filter configuration will be populated dynamically from API
// This is a template structure
export const FILTER_CONFIG_TEMPLATE: Omit<FilterConfig, 'categories'> = {
  priceRanges: [
    { id: 'economico', label: 'Até 1,000 MT', min: 0, max: 1000, count: 0 },
    { id: 'medio', label: '1,000 - 5,000 MT', min: 1000, max: 5000, count: 0 },
    { id: 'alto', label: '5,000 - 20,000 MT', min: 5000, max: 20000, count: 0 },
    { id: 'premium', label: '20,000+ MT', min: 20000, max: 999999, count: 0 }
  ],
  leadTime: [
    { id: 'stock', label: '1-2 dias (Stock)', days: 2, count: 0 },
    { id: 'rapido', label: '3-5 dias', days: 5, count: 0 },
    { id: 'normal', label: '5-7 dias', days: 7, count: 0 },
    { id: 'importacao', label: '14+ dias', days: 14, count: 0 }
  ],
  minimumQuantity: [
    { id: 'pequeno', label: '1-50 unidades', min: 1, max: 50, count: 0 },
    { id: 'medio', label: '50-250 unidades', min: 50, max: 250, count: 0 },
    { id: 'grande', label: '250+ unidades', min: 250, max: 10000, count: 0 }
  ],
  features: [
    { id: 'popular', label: '⭐ Mais Populares', count: 0 },
    { id: 'novo', label: '🆕 Novos Produtos', count: 0 },
    { id: 'promocao', label: '🔥 Em Promoção', count: 0 },
    { id: 'personalizavel', label: '✏️ Personalizável', count: 0 },
    { id: 'ecologico', label: '🌱 Ecológico', count: 0 }
  ]
};

export const WHATSAPP_NUMBER = '258841234567'; // Replace with actual number
export const WHATSAPP_MESSAGE = 'Olá! Preciso de ajuda a encontrar um produto';

