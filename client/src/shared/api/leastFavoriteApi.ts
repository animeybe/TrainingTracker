import type {
  ExerciseListResponse,
  ToggleFavoriteRequest,
  ToggleFavoriteResponse,
} from "./types";
import { apiRequest } from "./index";

export const leastFavoriteApi = {
  getLeastFavorites: (): Promise<ExerciseListResponse> =>
    apiRequest<ExerciseListResponse>("/least-favorites"),

  toggleLeastFavorite: (
    data: ToggleFavoriteRequest,
  ): Promise<ToggleFavoriteResponse> =>
    apiRequest<ToggleFavoriteResponse>(
      `/least-favorites/${data.exerciseId}/toggle`,
      {
        method: "POST",
      },
    ),
};
