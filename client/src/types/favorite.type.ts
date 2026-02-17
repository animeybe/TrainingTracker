export interface ToggleFavoriteRequest {
  exerciseId: string;
}

export interface ToggleFavoriteResponse {
  success: boolean;
  message?: string;
}

export interface FavoriteListResponse {
  data: {
    id: string;
    name: string;
    muscleGroup: string;
    type: string;
    daysInFavorites: number;
  }[];
  total: number;
}
