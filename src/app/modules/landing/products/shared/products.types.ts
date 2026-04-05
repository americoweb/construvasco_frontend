import { Category } from '../../../admin/categories/shared/category.types';

export interface ProductListItem {
  id: number;
  uuid: string;
  name: string;
  slug: string;
  description: string | null;
  short_description?: string;
  price: number;
  price_formatted: string;
  base_price: number;
  min_quantity: number;
  minimum_quantity: number;
  image_url: string | null;
  base_image_url: string | null;
  category_id?: number;
  category_name?: string;
  category_slug?: string;
  lead_time_days?: number;
  is_popular?: boolean;
  is_new?: boolean;
  is_featured?: boolean;
  discount_percentage?: number;
  status: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface ProductFilters {
  categories: string[];
  priceRange: string | null;
  leadTimes: string[];
  features: string[];
  minimumQuantity: string | null;
  searchQuery: string;
}

export interface FilterState {
  id: string;
  label: string;
  type: 'category' | 'price' | 'leadtime' | 'feature' | 'quantity';
}

export interface FilterConfig {
  categories: CategoryFilter[];
  priceRanges: PriceRangeFilter[];
  leadTime: LeadTimeFilter[];
  minimumQuantity: QuantityFilter[];
  features: FeatureFilter[];
}

export interface CategoryFilter {
  id: string;
  slug: string;
  label: string;
  count: number;
  selected?: boolean;
}

export interface PriceRangeFilter {
  id: string;
  label: string;
  min: number;
  max: number;
  count: number;
  selected?: boolean;
}

export interface LeadTimeFilter {
  id: string;
  label: string;
  days?: number;
  count: number;
  selected?: boolean;
}

export interface QuantityFilter {
  id: string;
  label: string;
  min: number;
  max: number;
  count: number;
  selected?: boolean;
}

export interface FeatureFilter {
  id: string;
  label: string;
  count: number;
  selected?: boolean;
}

export interface SortOption {
  value: string;
  label: string;
}

export type ViewMode = 'grid' | 'list';

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface ProductsQueryParams {
  page?: number;
  limit?: number;
  categoria?: string;
  subcategoria?: string;
  preco?: string;
  entrega?: string;
  destaque?: string;
  quantidade?: string;
  busca?: string;
  ordem?: string;
}

