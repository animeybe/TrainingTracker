import {
  MuscleGroup,
  Difficulty,
  Goal,
  Lifestyle,
} from "../../../common/types/enums.types";
import { Exercise } from "../../entities/exercise.entity";
import {
  DAY_MUSCLE_GROUPS,
  DayType,
  ExerciseSet,
  primaryMuscles,
} from "../../types/training.types";

export class ExerciseSelectorService {
  generateDay(
    dayType: DayType,
    favorites: Exercise[],
    allExercises: Exercise[],
    bmi: number,
    goal: Goal,
    age: number,
    lifestyle: Lifestyle,
  ): ExerciseSet[] {
    const difficulty = this.getDifficulty(bmi, goal, age, lifestyle, dayType);
    const targetMuscles =
      DAY_MUSCLE_GROUPS[dayType as keyof typeof DAY_MUSCLE_GROUPS];

    // 1. ИЗБРАННЫЕ
    const favoriteExercises = this.selectFavoriteExercises(
      favorites,
      targetMuscles,
      difficulty,
    );

    // 2. ОСНОВНЫЕ для непокрытых мышц
    const coveredMuscles = new Set(
      favoriteExercises.map((ex: ExerciseSet) => ex.muscleGroup),
    );
    const uncoveredMuscles = targetMuscles.filter(
      (m) => !coveredMuscles.has(m),
    );
    const compoundExercises = this.selectCompoundExercises(
      allExercises,
      uncoveredMuscles,
      difficulty,
    );

    const accessoryExercises = this.selectAccessoryExercises(
      allExercises,
      difficulty,
    );

    return [
      ...favoriteExercises.slice(0, 5),
      ...compoundExercises.slice(0, 7),
      ...accessoryExercises.slice(0, 4),
    ]
      .slice(0, 15)
      .filter(Boolean) as ExerciseSet[];
  }

  private selectFavoriteExercises(
    favorites: Exercise[],
    targetMuscles: MuscleGroup[],
    userDifficulty: Difficulty,
  ): ExerciseSet[] {
    return favorites
      .filter((fav) =>
        targetMuscles.includes(this.getMuscleGroup(fav) as MuscleGroup),
      )
      .filter((fav) =>
        this.isSuitableDifficulty(
          this.getExerciseDifficulty(fav),
          userDifficulty,
        ),
      )
      .map((fav) => this.toDayExercise(fav, true));
  }

  private selectCompoundExercises(
    exercises: Exercise[],
    targetMuscles: MuscleGroup[],
    difficulty: Difficulty,
  ): ExerciseSet[] {
    const suitable = exercises.filter(
      (ex) =>
        targetMuscles.includes(this.getMuscleGroup(ex) as MuscleGroup) &&
        this.isSuitableDifficulty(this.getExerciseDifficulty(ex), difficulty),
    );

    return suitable
      .sort(() => Math.random() - 0.5)
      .map((ex) => this.toDayExercise(ex, false));
  }

  private selectAccessoryExercises(
    exercises: Exercise[],
    difficulty: Difficulty,
  ): ExerciseSet[] {
    const accessoryMuscles: MuscleGroup[] = [
      // ✅ ТВОИ ТИПЫ — ПРЕСС
      "ABS_UPPER",
      "ABS_LOWER",
      "OBLIQUES",

      // ✅ ТВОИ ТИПЫ — ИКРЫ
      "CALVES_GASTROCNEMIUS",
      "CALVES_SOLEUS",

      // ✅ ТВОИ ТИПЫ — ПРЕДПЛЕЧЬЯ
      "FOREARMS_FLEXORS",
      "FOREARMS_EXTENSORS",

      // ✅ ТВОИ ТИПЫ — ТРАПЕЦИИ
      "TRAPEZIUS_UPPER",
      "TRAPEZIUS_LOWER",

      // ✅ ТВОИ ТИПЫ — СПИНА
      "ERECTOR_SPINAE_UPPER",
      "ERECTOR_SPINAE_LOWER",
    ];

    const suitable = exercises.filter(
      (ex) =>
        accessoryMuscles.includes(this.getMuscleGroup(ex) as MuscleGroup) &&
        this.isSuitableDifficulty(this.getExerciseDifficulty(ex), difficulty),
    );

    return suitable
      .sort(() => Math.random() - 0.5)
      .map((ex) => this.toDayExercise(ex, false));
  }

  private getMuscleGroup(exercise: Exercise): MuscleGroup {
    return exercise.muscleGroup;
  }

  private getExerciseDifficulty(exercise: Exercise): Difficulty {
    const props = (exercise as any).props || exercise;
    return (props.difficulty as Difficulty) || "MEDIUM";
  }

  private isSuitableDifficulty(
    exerciseDiff: Difficulty,
    userDiff: Difficulty,
  ): boolean {
    return (
      exerciseDiff === userDiff ||
      (userDiff === "HARD" && exerciseDiff === "MEDIUM") ||
      (userDiff === "MEDIUM" && exerciseDiff === "EASY") ||
      (userDiff === "HARD" && exerciseDiff === "EASY")
    );
  }

  private toDayExercise(exercise: Exercise, isFavorite: boolean): ExerciseSet {
    const difficulty = exercise.difficulty || "MEDIUM";
    const baseSets = this.getBaseSets(exercise);
    const baseReps = this.getBaseReps(difficulty);

    return {
      exerciseId: exercise.id.value,
      sets: baseSets,
      targetRepsRange: baseReps,
      favorite: isFavorite,

      warning: this.shouldWarn(exercise, difficulty),

      progression: {
        baseSets: baseSets,
        baseReps: baseReps,
      },
    };
  }
  getDifficulty(
    bmi: number,
    goal: Goal, // ✅ Твои типы!
    age: number,
    lifestyle: Lifestyle, // ✅ Твои типы!
    dayType: DayType,
  ): Difficulty {
    // ✅ Возвращает твой Difficulty!
    let score = 0;

    // 1. BMI — точная градация
    if (bmi < 18.5) {
      score -= age < 18 ? 25 : 15; // Дети легче!
    } else if (bmi > 30) {
      score += 20; // Толстяки = кардио нагрузка
    } else if (bmi > 27) {
      score += 12;
    } else if (bmi > 25) {
      score += 8;
    }

    // 2. ВОЗРАСТ
    if (age > 50) score += 20;
    else if (age > 40) score += 12;
    else if (age < 18) score -= 15;
    else if (age < 25) score -= 8;

    // 3. ТВОИ GOALS ✅
    switch (goal) {
      case "LOSE_WEIGHT":
        score += 12; // Дефицит = сложнее
        break;
      case "GAIN_MUSCLE_MASS":
        score -= 8; // Профицит = легче
        break;
      case "GAIN_WEIGHT":
        score -= 5; // Набор массы
        break;
      case "MAINTAIN_WEIGHT":
        score += 2; // Поддержка = средне
    }

    // 4. ТВОИ LIFESTYLES ✅
    const recovery = this.getRecoveryScore(lifestyle);
    score += recovery;

    // 5. День тренировки
    const dayDifficulty = this.getDayDifficulty(dayType);
    score += dayDifficulty;

    return score <= -20 ? "EASY" : score >= 25 ? "HARD" : "MEDIUM";
  }

  private getRecoveryScore(lifestyle: Lifestyle): number {
    return (
      {
        IMMOBILE: +25, // Лежачий = плохо восстанавливается
        LIGHT: +15, // Офис
        AVERAGE: +5, // Работа
        HARD: -15, // Физический труд = супер восстановление
      }[lifestyle] || 0
    );
  }
  private getBaseReps(difficulty: Difficulty): [number, number] {
    const repsMap: Record<Difficulty, [number, number]> = {
      EASY: [12, 15],
      MEDIUM: [10, 12],
      HARD: [8, 10],
    };
    return repsMap[difficulty] || [8, 12];
  }
  private getBaseSets(exercise: Exercise): number {
    return primaryMuscles.includes(exercise.muscleGroup) ? 4 : 3;
  }
  private shouldWarn(
    exercise: Exercise,
    userDifficulty: Difficulty,
  ): string | undefined {
    if (userDifficulty === "EASY" && exercise.difficulty === "HARD") {
      return "⚠️ Острожно! Сложное упражнение! Следи за техникой или попроси подстраховать.";
    }
    if (exercise.muscleGroup === "NECK") {
      return "⚠️ Шея — осторожно с весами!";
    }

    if (exercise.muscleGroup === "ERECTOR_SPINAE_LOWER") {
      return "⚠️ Техника важнее веса! Держи спину прямой";
    }

    if (exercise.muscleGroup === "ERECTOR_SPINAE_UPPER") {
      return "⚠️ Не округляй плечи назад";
    }
    return undefined;
  }
  private getDayDifficulty(dayType: DayType): number {
    const dayScores: Record<DayType, number> = {
      // ЛЁГКИЕ дни (низкая частота)
      full: -5, // Full body = базовые
      upper: 0,
      lower: 0,

      // СРЕДНИЕ (2x/неделя)
      push: 5,
      pull: 5,
      legs: 10, // Ноги тяжелее

      // ТЯЖЁЛЫЕ (высокая специализация)
      chest: 15,
      back: 15,
      shoulders: 20, // Плечи травмоопасны
      arms: 10,
      core: -5, // Пресс = легко
    };
    return dayScores[dayType] || 0;
  }
}
