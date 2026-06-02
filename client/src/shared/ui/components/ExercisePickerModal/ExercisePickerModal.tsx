import { useState, useMemo } from "react";
import type { Exercise } from "@/shared/api/types";
import { MUSCLE_GROUP_LABELS } from "@/pages/ExerciseBase/common/utils/muscleGroupInterpreter";
import "./ExercisePickerModal.scss";

interface Props {
  exercises: Exercise[];
  onSelect: (exercise: Exercise) => void;
  onClose: () => void;
  existingExerciseIds?: string[];
}

export function ExercisePickerModal({
  exercises,
  onSelect,
  onClose,
  existingExerciseIds,
}: Props) {
  const [search, setSearch] = useState("");
  const [sortType, setSortType] = useState<"name" | "muscle">("name");

  const filtered = useMemo(() => {
    let result = exercises;

    // Убираем уже добавленные
    if (existingExerciseIds?.length) {
      const ids = new Set(existingExerciseIds);
      result = result.filter((ex) => !ids.has(ex.id));
    }

    if (!search.trim()) return result;
    const lower = search.toLowerCase();
    return result.filter(
      (ex) =>
        ex.name.toLowerCase().includes(lower) ||
        MUSCLE_GROUP_LABELS[ex.primaryMuscleGroup]
          ?.toLowerCase()
          .includes(lower),
    );
  }, [exercises, search, existingExerciseIds]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (sortType === "name") return a.name.localeCompare(b.name);
      return (
        MUSCLE_GROUP_LABELS[a.primaryMuscleGroup]?.localeCompare(
          MUSCLE_GROUP_LABELS[b.primaryMuscleGroup] || "",
        ) || 0
      );
    });
  }, [filtered, sortType]);

  return (
    <div className="exercise-picker-overlay" onClick={onClose}>
      <div
        className="exercise-picker-modal"
        onClick={(e) => e.stopPropagation()}>
        <div className="exercise-picker-modal__header">
          <h3>Выберите упражнение</h3>
          <button onClick={onClose} type="button">
            ×
          </button>
        </div>
        <div className="exercise-picker-modal__controls">
          <input
            type="text"
            placeholder="Поиск..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            value={sortType}
            onChange={(e) => setSortType(e.target.value as "name" | "muscle")}>
            <option value="name">По названию</option>
            <option value="muscle">По мышцам</option>
          </select>
        </div>
        <div className="exercise-picker-modal__list">
          {sorted.map((ex) => (
            <button key={ex.id} onClick={() => onSelect(ex)} type="button">
              <span>{ex.name}</span>
              <span>{MUSCLE_GROUP_LABELS[ex.primaryMuscleGroup]}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
