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

export interface CreateTagRequest {
  name: string;
  color?: string;
}

export interface UpdateTagRequest extends Partial<CreateTagRequest> {}

