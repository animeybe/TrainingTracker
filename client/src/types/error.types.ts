export interface ToggleFavoriteRequest {
  exerciseId: string;
}

export interface ToggleFavoriteResponse {
  success: boolean;
  message?: string;
}

export interface FavoriteListItem {
  id: string;
  name: string;
  primaryMuscleGroup: string;
  difficulty: string;
}

export interface FavoriteListResponse {
  data: FavoriteListItem[];
  total: number;
}
