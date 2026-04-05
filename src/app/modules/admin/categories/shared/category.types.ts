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

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  image_url?: string;
  parent_id?: number;
  sort_order?: number;
  is_active?: boolean;
}

export interface UpdateCategoryRequest extends Partial<CreateCategoryRequest> {}

