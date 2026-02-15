const API_BASE = "http://localhost:3001/api";

export interface Exercise {
  id: string;
  name: string;
  description: string;
  muscleGroup: string;
  secondaryMuscles: string[];
  type: string;
  difficulty: string;
  imageUrl: string | null;
  videoUrl: string | null;
}

export interface ExerciseListResponse {
  data: Exercise[];
  total: number;
}

export const exerciseApi = {
  getAll: async (): Promise<ExerciseListResponse> => {
    const response = await fetch(`${API_BASE}/exercises`);
    if (!response.ok) throw new Error("Failed to fetch exercises");
    return response.json();
  },

  getByMuscle: async (muscle: string): Promise<ExerciseListResponse> => {
    const response = await fetch(`${API_BASE}/exercises/muscle/${muscle}`);
    if (!response.ok) throw new Error("Failed to fetch exercises");
    return response.json();
  },

  search: async (query: string): Promise<ExerciseListResponse> => {
    const response = await fetch(
      `${API_BASE}/exercises/search?query=${encodeURIComponent(query)}`,
    );
    if (!response.ok) throw new Error("Search failed");
    return response.json();
  },
};
