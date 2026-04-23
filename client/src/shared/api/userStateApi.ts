// src/shared/api/userStateApi.ts
import { apiRequest } from "./index";
import type { UserStateResponse } from "./types";

export const userStateApi = {
  // GET /user-state
  getCurrentWeek: (): Promise<UserStateResponse> => apiRequest("/user-state"),

  // POST /user-state/week
  updateCurrentWeek: (
    week: number,
  ): Promise<{ success: boolean; message: string }> =>
    apiRequest("/user-state/week", {
      method: "POST",
      body: JSON.stringify({ week }),
    }),
};
