import { ApiResponse } from "./common.types";

export interface ToggleFavoriteResponseDto {
  success: boolean;
  message: string;
  action: "added" | "removed";
}

export type ToggleFavoriteResponse = ApiResponse<ToggleFavoriteResponseDto>;
