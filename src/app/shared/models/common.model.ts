export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PageRequest {
  page?: number;
  size?: number;
}

export interface PageResult<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}
