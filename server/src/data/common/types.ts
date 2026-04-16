export type DomainId = string;
export type ModelId = string;

export interface Timestamped {
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}
