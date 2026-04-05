export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
  meta?: any;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    details?: any;
  };
  errors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export type ApiResult<T> = ApiSuccessResponse<T> | ApiErrorResponse;
