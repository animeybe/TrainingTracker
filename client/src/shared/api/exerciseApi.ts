import { apiRequest } from "./index";
import type { ExerciseListResponse } from "./types";

export const exerciseApi = {
  getAllExercises: (): Promise<ExerciseListResponse> =>
    apiRequest<ExerciseListResponse>("/exercises"),

  getExercisesByMuscleGroup: (
    MuscleGroup: string,
  ): Promise<ExerciseListResponse> =>
    apiRequest<ExerciseListResponse>(`/exercises/muscle/${MuscleGroup}`),
};
