export interface ApiResponse<T> {
  data?: T;
  items?: T;
  meta?: PaginationInfo;
  message?: string;
  success?: boolean;
  errors?: ValidationError[];
}

export interface PaginationInfo {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from?: number;
  to?: number;
}

export interface ValidationError {
  field: string;
  type: string;
  message: string;
}

export interface Identifiable {
  id: string | number;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}
