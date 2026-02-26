import type { FavoritesResponse, ToggleFavoriteResponse } from "./types";
import { apiRequest } from "./index";

export const favoriteApi = {
  getFavorites: (): Promise<FavoritesResponse> =>
    apiRequest<FavoritesResponse>("/favorites"),

  toggleFavorite: (exerciseId: string): Promise<ToggleFavoriteResponse> =>
    apiRequest<ToggleFavoriteResponse>(`/favorites/${exerciseId}/toggle`, {
      method: "POST",
    }),
};
