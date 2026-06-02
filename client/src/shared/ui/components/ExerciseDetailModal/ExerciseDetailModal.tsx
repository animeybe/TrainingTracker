// shared/ui/components/ExerciseDetailModal/ExerciseDetailModal.tsx
import "./ExerciseDetailModal.scss";
import type { Exercise } from "@/shared/api/types";
import { MUSCLE_GROUP_LABELS } from "@/pages/ExerciseBase/common/utils/muscleGroupInterpreter";

interface ExerciseDetailModalProps {
  exercise: Exercise;
  onClose: () => void;
}

export function ExerciseDetailModal({
  exercise,
  onClose,
}: ExerciseDetailModalProps) {
  return (
    <div className="exercise-detail-overlay" onClick={onClose}>
      <div
        className="exercise-detail-modal"
        onClick={(e) => e.stopPropagation()}>
        <button
          className="exercise-detail-modal__close"
          onClick={onClose}
          type="button">
          ×
        </button>

        {/* Фото */}
        <div className="exercise-detail-modal__image">
          {exercise.imageUrl ? (
            <img src={exercise.imageUrl} alt={exercise.name} />
          ) : (
            <div className="exercise-detail-modal__image-placeholder">
              <span>📷</span>
              <span>Нет фото</span>
            </div>
          )}
        </div>

        {/* Название */}
        <h2 className="exercise-detail-modal__title">{exercise.name}</h2>

        {/* Теги */}
        <div className="exercise-detail-modal__tags">
          <span className="exercise-detail-modal__tag exercise-detail-modal__tag--muscle">
            {MUSCLE_GROUP_LABELS[exercise.primaryMuscleGroup] ||
              exercise.primaryMuscleGroup}
          </span>
          <span className="exercise-detail-modal__tag exercise-detail-modal__tag--difficulty">
            {exercise.difficulty === "EASY"
              ? "Лёгкая"
              : exercise.difficulty === "MEDIUM"
                ? "Средняя"
                : "Сложная"}
          </span>
          {exercise.secondaryMuscles?.map((m) => (
            <span
              key={m}
              className="exercise-detail-modal__tag exercise-detail-modal__tag--secondary">
              {MUSCLE_GROUP_LABELS[m] || m}
            </span>
          ))}
        </div>

        {/* Описание */}
        <div className="exercise-detail-modal__description">
          <h3>Описание</h3>
          <p>{exercise.description || "Описание отсутствует"}</p>
        </div>

        {/* Видео */}
        <div className="exercise-detail-modal__video">
          <h3>Видео-инструкция</h3>
          {exercise.videoUrl ? (
            <iframe
              src={exercise.videoUrl}
              title={exercise.name}
              allowFullScreen
            />
          ) : (
            <div className="exercise-detail-modal__video-placeholder">
              <span>🎬</span>
              <span>Видео отсутствует</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
