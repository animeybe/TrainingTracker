// api/profile.api.ts

import type { ProfileData } from "./types";
import { apiRequest } from "./index";

export const profileApi = {
  /**
   * GET /profile
   */
  getProfile(): Promise<ProfileData> {
    return apiRequest<ProfileData>("/profile");
  },

  /**
   * PATCH /profile
   */
  update(data: {
    weight?: number;
    height?: number;
    age?: number;
    lifestyle?: string | null;
    goal?: string | null;
  }): Promise<ProfileData> {
    return apiRequest<ProfileData>("/profile", {
      method: "PATCH",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
      },
    });
  },
};
