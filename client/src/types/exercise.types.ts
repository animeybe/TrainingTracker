export interface Exercise {
  id: string;
  name: string;
  description: string | null;
  muscleGroup: string;
  secondaryMuscles: string[];
  type: string; // 'push' | 'pull' | 'legs' | 'others'
  difficulty: string; // 'beginner' | 'intermediate' | 'advanced'
  imageUrl: string | null;
  videoUrl: string | null;
  duration?: number; // минуты
  equipment?: string; // 'none' | 'dumbbells' | 'barbell' | etc
  caloriesBurned?: number;
}

export interface ExerciseListResponse {
  data: Exercise[];
  total: number;
}

export interface ExerciseFilter {
  muscleGroup?: string;
  difficulty?: string;
  type?: string;
  search?: string;
}
