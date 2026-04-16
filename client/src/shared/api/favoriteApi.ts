import type {
  FavoriteListResponse,
  ToggleFavoriteRequest,
  ToggleFavoriteResponse,
} from "./types";
import { apiRequest } from "./index";

export const favoriteApi = {
  getFavorites: (): Promise<FavoriteListResponse> =>
    apiRequest<FavoriteListResponse>("/favorites"),

  toggleFavorite: (
    data: ToggleFavoriteRequest,
  ): Promise<ToggleFavoriteResponse> =>
    apiRequest<ToggleFavoriteResponse>(`/favorites/${data.exerciseId}/toggle`, {
      method: "POST",
    }),
};
