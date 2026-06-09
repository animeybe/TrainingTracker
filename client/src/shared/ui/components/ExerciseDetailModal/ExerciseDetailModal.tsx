// shared/ui/components/ExerciseDetailModal/ExerciseDetailModal.tsx
import "./ExerciseDetailModal.scss";
import type { Exercise } from "@/shared/api/types";
import { MUSCLE_GROUP_LABELS } from "@/pages/ExerciseBase/common/utils/muscleGroupInterpreter";
import { useExercises } from "@/shared/hooks/useExercises";
import { useState, useMemo } from "react";

interface ExerciseDetailModalProps {
  exercise: Exercise;
  onClose: () => void;
  /** Если упражнение добавлено по необходимости (forced) */
  forced?: boolean;
  forcedReason?: string;
}

export function ExerciseDetailModal({
  exercise,
  onClose,
  forced,
  forcedReason,
}: ExerciseDetailModalProps) {
  const {
    favoriteExercises,
    leastFavoriteExercises,
    toggleFavorite,
    toggleLeastFavorite,
  } = useExercises();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const isFavorite = useMemo(
    () => favoriteExercises?.some((f) => f.id === exercise.id),
    [favoriteExercises, exercise.id],
  );
  const isLeastFavorite = useMemo(
    () => leastFavoriteExercises?.some((lf) => lf.id === exercise.id),
    [leastFavoriteExercises, exercise.id],
  );

  const forcedMessage =
    forcedReason === "all_excluded"
      ? "Это упражнение добавлено в план вынужденно — исключено слишком много других упражнений"
      : "Это упражнение обязательно для данного сплита";

  const handleToggleFavorite = async () => {
    if (isLeastFavorite) return; // нельзя добавить в избранное из нелюбимых
    setActionLoading("fav");
    await toggleFavorite(exercise.id);
    setActionLoading(null);
  };

  const handleToggleLeastFavorite = async () => {
    if (isFavorite) return; // нельзя добавить в нелюбимые из избранного
    if (forced) return; // нельзя исключить forced-упражнение
    setActionLoading("lf");
    await toggleLeastFavorite(exercise.id);
    setActionLoading(null);
  };

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

        {/* Forced-предупреждение */}
        {forced && (
          <div className="exercise-detail-modal__forced-warning">
            <span className="exercise-detail-modal__forced-icon">⚠️</span>
            <span>{forcedMessage}</span>
          </div>
        )}

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

        {/* Кнопки избранное/нелюбимое */}
        <div className="exercise-detail-modal__actions">
          <button
            className={`exercise-detail-modal__action-btn ${isFavorite ? "exercise-detail-modal__action-btn--active" : ""}`}
            onClick={handleToggleFavorite}
            disabled={!!actionLoading || isLeastFavorite}
            type="button"
            title={
              isLeastFavorite
                ? "Нельзя добавить в избранное из нелюбимых"
                : isFavorite
                  ? "Убрать из избранного"
                  : "Добавить в избранное"
            }>
            {actionLoading === "fav"
              ? "⏳"
              : isFavorite
                ? "❤️ В избранном"
                : "🤍 В избранное"}
          </button>
          <button
            className={`exercise-detail-modal__action-btn ${isLeastFavorite ? "exercise-detail-modal__action-btn--danger" : ""}`}
            onClick={handleToggleLeastFavorite}
            disabled={!!actionLoading || isFavorite || forced}
            type="button"
            title={
              forced
                ? "Это упражнение обязательно для плана"
                : isFavorite
                  ? "Нельзя добавить в нелюбимые из избранного"
                  : isLeastFavorite
                    ? "Убрать из нелюбимых"
                    : "Добавить в нелюбимые"
            }>
            {actionLoading === "lf"
              ? "⏳"
              : isLeastFavorite
                ? "🚫 В нелюбимых"
                : "🚫 В нелюбимое"}
          </button>
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
