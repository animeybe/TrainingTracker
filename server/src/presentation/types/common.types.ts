export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  total?: number;
}

export interface ApiErrorResponse {
  error: string;
  code?: string;
  message?: string;
}
