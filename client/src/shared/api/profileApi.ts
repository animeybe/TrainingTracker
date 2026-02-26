import type { ProfileData } from "./types";
import { apiRequest } from "./index";

export const profileApi = {
  getProfile: (): Promise<ProfileData> =>
    apiRequest<{ data: ProfileData }>("/profile").then((res) => res.data),

  update: (data: {
    weight?: number;
    height?: number;
    age?: number;
    lifestyle?: string;
    goal?: string;
  }): Promise<ProfileData> =>
    apiRequest<{ data: ProfileData }>("/profile/update", {
      method: "PATCH",
      body: JSON.stringify(data),
    }).then((res) => res.data),
};
