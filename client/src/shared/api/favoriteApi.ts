import type {
  ExerciseListResponse,
  ToggleFavoriteRequest,
  ToggleFavoriteResponse,
} from "./types";
import { apiRequest } from "./index";

export const favoriteApi = {
  getFavorites: (): Promise<ExerciseListResponse> =>
    apiRequest<ExerciseListResponse>("/favorites"),

  toggleFavorite: (
    data: ToggleFavoriteRequest,
  ): Promise<ToggleFavoriteResponse> =>
    apiRequest<ToggleFavoriteResponse>(`/favorites/${data.exerciseId}/toggle`, {
      method: "POST",
    }),
};
