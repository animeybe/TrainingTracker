// import {
//   Goal,
//   Lifestyle,
//   PrimaryMuscleGroup,
//   MuscleGroup,
//   MovementPattern,
//   TrainingFocus,
//   Difficulty,
//   TrainingSplit,
//   Wellbeing,
// } from "./enums.types";

// export interface UserProfileDto {
//   age?: number;
//   weight?: number;
//   height?: number;
//   lifestyle?: Lifestyle;
//   goal?: Goal;
// }

// export interface ExerciseDto {
//   id: string;
//   name: string;
//   description?: string | null;
//   primaryMuscleGroup: PrimaryMuscleGroup;
//   secondaryMuscles: MuscleGroup[];
//   movementPatterns: MovementPattern[];
//   trainingFocus: TrainingFocus[];
//   difficulty: Difficulty;
//   imageUrl?: string | null;
//   videoUrl?: string | null;
// }

// export interface FavoriteExerciseDto {
//   id: string;
//   userId: string;
//   exerciseId: string;
//   exercise: ExerciseDto;
//   createdAt: Date;
// }

// export interface WeeklyTrainingPlanDto {
//   id: string;
//   week: number;
//   split: TrainingSplit;
//   score: number;
//   daysPerWeek: number;
//   restDays: number[];
//   message?: string | null;
//   createdAt: Date;
//   updatedAt: Date;
//   exercises: WeeklyTrainingExerciseDto[];
// }

// export interface WeeklyTrainingExerciseDto {
//   id: string;
//   dayOfWeek: number;
//   sets: number;
//   repsRange: [number, number];
//   orderInDay: number;
//   exercise: ExerciseDto;
// }

// export interface TrainingDayExecutionDto {
//   id: string;
//   week: number;
//   dayOfWeek: number;
//   executionDate: Date;
//   wellbeingToday: Wellbeing;
//   setsCompleted: number;
//   notes?: string | null;
//   createdAt: Date;
//   exercises: TrainingExerciseExecutionDto[];
// }

// export interface TrainingExerciseExecutionDto {
//   id: string;
//   sets: number;
//   repsRange: [number, number];
//   orderInDay: number;
//   wellbeingAdjusted: boolean;
//   compensationNext: boolean;
//   exercise: ExerciseDto;
// }
