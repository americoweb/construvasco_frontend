// Product Types matching backend ProductResource structure

export enum ProductStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  OUT_OF_STOCK = 'out_of_stock',
  DISCONTINUED = 'discontinued'
}

export enum PrintAreaPosition {
  FRONT_CHEST = 'front_chest',
  BACK_FULL = 'back_full',
  FULL_WRAP = 'full_wrap',
  FRONT = 'front',
  BACK = 'back',
  LEFT_CHEST = 'left_chest',
  FRONT_COVER = 'front_cover',
  BODY = 'body',
  FULL_POSTER = 'full_poster'
}

export interface ProductColor {
  id: number;
  name: string;
  hex_code: string;
  is_active: boolean;
  sort_order: number;
  stock_quantity?: number;
  has_stock?: boolean;
}

export interface ProductPrintArea {
  id: number;
  name: string;
  position: PrintAreaPosition;
  position_label?: string;
  description?: string;
  max_width_cm: number;
  max_height_cm: number;
  dimensions?: string;
  additional_price: number;
  is_active: boolean;
  sort_order: number;
}

export interface Product {
  id: number;
  uuid: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  price_formatted?: string;
  min_quantity: number;
  image_url?: string;
  base_image_url?: string;
  design_hint?: string;
  status: ProductStatus;
  status_label?: string;
  status_color?: string;
  is_featured: boolean;
  is_available?: boolean;
  sort_order: number;
  pricing_type?: PricingType;
  price_per_sqm?: number;
  has_sizes?: boolean;
  colors?: ProductColor[];
  active_colors?: ProductColor[];
  print_areas?: ProductPrintArea[];
  active_print_areas?: ProductPrintArea[];
  sizes?: ProductSize[];
  active_sizes?: ProductSize[];
  size_restrictions?: ProductSizeRestriction;
  categories?: Category[];
  tags?: Tag[];
  created_at?: string;
  updated_at?: string;
}

export interface CreateProductRequest {
  name: string;
  description?: string;
  price: number;
  min_quantity: number;
  image_url?: string;
  base_image_url?: string;
  design_hint?: string;
  status?: ProductStatus;
  is_featured?: boolean;
  sort_order?: number;
  pricing_type?: PricingType;
  price_per_sqm?: number;
  has_sizes?: boolean;
  category_ids?: number[];
  tag_ids?: number[];
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {}

export interface CreateProductColorRequest {
  name: string;
  hex_code: string;
  is_active?: boolean;
  sort_order?: number;
  stock_quantity?: number;
}

export interface UpdateProductColorRequest extends Partial<CreateProductColorRequest> {}

export interface CreateProductPrintAreaRequest {
  name: string;
  position: PrintAreaPosition;
  description?: string;
  max_width_cm: number;
  max_height_cm: number;
  additional_price?: number;
  is_active?: boolean;
  sort_order?: number;
}

export interface UpdateProductPrintAreaRequest extends Partial<CreateProductPrintAreaRequest> {}

export enum PricingType {
  FIXED = 'fixed',
  SQM_BASED = 'sqm_based'
}

export interface ProductSize {
  id: number;
  name: string;
  width_cm: number | null;
  height_cm: number | null;
  is_predefined: boolean;
  is_custom: boolean;
  fixed_price: number | null;
  is_active: boolean;
  sort_order: number;
  dimensions?: string;
  area_sqm?: number;
}

export interface ProductSizeRestriction {
  id?: number;
  min_width_cm: number | null;
  max_width_cm: number | null;
  min_height_cm: number | null;
  max_height_cm: number | null;
  min_aspect_ratio: number | null;
  max_aspect_ratio: number | null;
  step_increment_cm: number | null;
}

export interface CreateProductSizeRequest {
  name: string;
  width_cm?: number | null;
  height_cm?: number | null;
  is_predefined?: boolean;
  is_custom?: boolean;
  fixed_price?: number | null;
  is_active?: boolean;
  sort_order?: number;
}

export interface UpdateProductSizeRequest extends Partial<CreateProductSizeRequest> {}

export interface CreateProductSizeRestrictionRequest {
  min_width_cm?: number | null;
  max_width_cm?: number | null;
  min_height_cm?: number | null;
  max_height_cm?: number | null;
  min_aspect_ratio?: number | null;
  max_aspect_ratio?: number | null;
  step_increment_cm?: number | null;
}

export interface Category {
  id: number;
  uuid: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  parent_id?: number;
  parent?: Category;
  children?: Category[];
  sort_order: number;
  is_active: boolean;
  products_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Tag {
  id: number;
  uuid: string;
  name: string;
  slug: string;
  color?: string;
  products_count?: number;
  created_at?: string;
  updated_at?: string;
}

