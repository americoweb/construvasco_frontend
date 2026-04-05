export interface ProductColor {
  id: number;
  name: string;
  hex_code: string;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
  stock_quantity?: number;
}

export interface ProductPrintArea {
  id: number;
  name: string;
  description: string | null;
  width: number;
  height: number;
  position: string;
  is_active: boolean;
  sort_order: number;
}

export type PricingType = 'fixed' | 'sqm_based';

export interface ProductSize {
  id: number;
  name: string;
  width_cm: number | null;
  height_cm: number | null;
  is_predefined: boolean;
  is_custom: boolean;
  fixed_price: number | null;
  dimensions?: string;
  area_sqm?: number;
}

export interface ProductSizeRestriction {
  min_width_cm: number | null;
  max_width_cm: number | null;
  min_height_cm: number | null;
  max_height_cm: number | null;
  min_aspect_ratio: number | null;
  max_aspect_ratio: number | null;
  step_increment_cm: number | null;
}

export interface PriceCalculationRequest {
  width_cm?: number;
  height_cm?: number;
  size_id?: number;
}

export interface PriceCalculationResponse {
  price: number;
  area_sqm: number;
  unit_price: number;
  pricing_type: PricingType;
}

export interface ProductCategory {
  id: number;
  uuid: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  parent_id?: number;
  parent?: ProductCategory;
  children?: ProductCategory[];
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductDetail {
  id: number;
  uuid: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  price_formatted: string;
  min_quantity: number;
  image_url: string | null;
  base_image_url: string | null;
  design_hint: string | null;
  status: string;
  status_label: string;
  status_color: string;
  is_featured: boolean;
  is_available: boolean;
  sort_order: number;
  pricing_type?: PricingType;
  price_per_sqm?: number;
  has_sizes?: boolean;
  active_colors: ProductColor[];
  active_print_areas: ProductPrintArea[];
  categories?: ProductCategory[];
  tags?: any[];
  created_at: string;
  updated_at: string;
}

export interface GenerateMockupRequest {
  product_id: number;
  design_prompt: string;
  logo_base64?: string;
  logo_mime_type?: string;
  reference_image_base64?: string;
  reference_image_mime_type?: string;
  color_id?: number;
  print_area_id?: number;
}

export interface GenerateMockupResponse {
  data: {
    mockup_url: string;
  };
  message: string;
}

export interface Design {
  id: number;
  uuid: string;
  product_id: number;
  product_color_id: number;
  product_print_area_id: number;
  prompt: string;
  mockup_url: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface CreateDesignRequest {
  product_id: number;
  product_color_id: number;
  product_print_area_id: number;
  prompt: string;
  mockup_url?: string;
  logo_path?: string;
  logo_mime_type?: string;
  reference_image_path?: string;
  reference_image_mime_type?: string;
}

export interface Testimonial {
  id: number;
  uuid: string;
  product_id: number;
  photo_url: string | null;
  text: string;
  author: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

