import type { ExerciseListResponse } from "./types";
import { apiRequest } from "./index";

export const exerciseApi = {
  getAll: (): Promise<ExerciseListResponse> =>
    apiRequest<ExerciseListResponse>("/exercises"),

  getByMuscle: (muscle: string): Promise<ExerciseListResponse> =>
    apiRequest<ExerciseListResponse>(`/exercises/muscle/${muscle}`),

  search: (query: string): Promise<ExerciseListResponse> =>
    apiRequest<ExerciseListResponse>(
      `/exercises/search?query=${encodeURIComponent(query)}`,
    ),
};
