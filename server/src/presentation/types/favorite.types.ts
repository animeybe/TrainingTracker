export interface ToggleFavoriteRequestDto {
  exerciseId: string;
}

export interface ToggleFavoriteResponseDto {
  success: boolean;
  message?: string;
}

export interface FavoriteListResponseDto {
  data: {
    id: string;
    name: string;
    muscleGroup: string;
    type: string;
    daysInFavorites: number;
  }[];
  total: number;
}
