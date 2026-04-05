// Design Types matching backend DesignResource and DesignListResource structure

export enum DesignStatus {
  DRAFT = 'draft',
  GENERATING = 'generating',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFINED = 'refined'
}

export interface ProductListInfo {
  id: number;
  uuid: string;
  name: string;
  slug: string;
  price: number;
  price_formatted?: string;
  min_quantity: number;
  image_url?: string;
  status: string;
  is_featured: boolean;
  is_available?: boolean;
}

export interface ProductColorInfo {
  id: number;
  name: string;
  hex_code: string;
  is_active: boolean;
  sort_order: number;
  stock_quantity?: number;
}

export interface ProductPrintAreaInfo {
  id: number;
  name: string;
  position: string;
  position_label?: string;
  description?: string;
  max_width_cm: number;
  max_height_cm: number;
  dimensions?: string;
  additional_price: number;
  is_active: boolean;
  sort_order: number;
}

export interface DesignRefinement {
  id: number;
  refinement_prompt: string;
  previous_mockup_url?: string;
  new_mockup?: string;
  status: DesignStatus;
  status_label?: string;
  created_at: string;
}

export interface Design {
  id: number;
  uuid: string;
  user_id?: number;
  session_id?: string;
  prompt: string;
  mockup_url?: string;
  mockup?: string;
  has_logo: boolean;
  logo_url?: string;
  has_reference_image: boolean;
  reference_image_url?: string;
  status: DesignStatus;
  status_label?: string;
  status_color?: string;
  is_completed: boolean;
  has_mockup: boolean;
  generation_attempts: number;
  ai_model_used?: string;
  is_from_suggestion?: boolean;
  suggestion_id?: number;
  product?: ProductListInfo;
  color?: ProductColorInfo;
  print_area?: ProductPrintAreaInfo;
  refinements?: DesignRefinement[];
  refinements_count?: number;
  product_name?: string;
  color_name?: string;
  print_area_name?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateDesignRequest {
  product_id: number;
  product_color_id?: number;
  product_print_area_id?: number;
  prompt: string;
  session_id?: string;
  user_id?: number;
  status?: DesignStatus;
}

export interface UpdateDesignRequest {
  prompt?: string;
  status?: DesignStatus;
  product_color_id?: number;
  product_print_area_id?: number;
}

