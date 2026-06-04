// RecentTrainings.tsx
/**
 * RecentTrainings — таблица последних 7 тренировок с возможностью редактирования.
 */

import { useState, useCallback } from "react";
import type {
  TrainingDayExecution,
  TrainingExerciseExecution,
  Exercise,
} from "@/shared/api/types";
import "./RecentTrainings.scss";

interface RecentTrainingsProps {
  executions: TrainingDayExecution[];
  exerciseExecutions: Record<string, TrainingExerciseExecution[]>;
  allExercises: Exercise[] | null;
  onSave: (
    executionId: string,
    data: { notes?: string; exercises?: TrainingExerciseExecution[] },
  ) => Promise<void>;
  onFinish: (executionId: string) => Promise<void>;
  showTodayBadge?: boolean;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    weekday: "short",
  });
}

function formatDuration(start: string, end: string | null): string {
  if (!end) return "—";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const min = Math.round(ms / 60000);
  if (min < 60) return `${min} мин`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}ч ${m}м`;
}

export function RecentTrainings({
  executions,
  exerciseExecutions,
  allExercises,
  onSave,
  onFinish,
  showTodayBadge,
}: RecentTrainingsProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState("");
  const [editingExercises, setEditingExercises] = useState<
    TrainingExerciseExecution[]
  >([]);
  const [saving, setSaving] = useState(false);

  const handleOpen = useCallback(
    (execution: TrainingDayExecution) => {
      setSelectedId(execution.id);
      setEditingNotes(execution.notes || "");
      setEditingExercises(exerciseExecutions[execution.id] || []);
    },
    [exerciseExecutions],
  );

  const handleClose = useCallback(() => setSelectedId(null), []);

  const handleSave = useCallback(async () => {
    if (!selectedId) return;
    setSaving(true);
    try {
      await onSave(selectedId, {
        notes: editingNotes,
        exercises: editingExercises,
      });
      handleClose();
    } finally {
      setSaving(false);
    }
  }, [selectedId, editingNotes, editingExercises, onSave, handleClose]);

  const handleFinish = useCallback(async () => {
    if (!selectedId) return;
    setSaving(true);
    try {
      await onFinish(selectedId);
      handleClose();
    } finally {
      setSaving(false);
    }
  }, [selectedId, onFinish, handleClose]);

  const updateSet = (
    exerciseIdx: number,
    setIdx: number,
    field: "weight" | "reps",
    value: number,
  ) => {
    setEditingExercises((prev) =>
      prev.map((ex, i) => {
        if (i !== exerciseIdx) return ex;
        const setsData =
          (ex.setsData as Array<{
            set: number;
            weight: number;
            reps: number;
          }>) || [];
        const newSets = setsData.map((s, j) =>
          j === setIdx ? { ...s, [field]: value } : s,
        );
        return {
          ...ex,
          setsData: newSets as TrainingExerciseExecution["setsData"],
        };
      }),
    );
  };

  const selectedExecution = executions.find((e) => e.id === selectedId);

  return (
    <div className="recent-trainings">
      {showTodayBadge && (
        <div className="recent-trainings__today-badge">
          Сегодняшняя тренировка завершена
        </div>
      )}

      {!executions.length ? (
        <p className="recent-trainings__empty">
          Пока нет записей о тренировках
        </p>
      ) : (
        <>
          {/* ТАБЛИЦА (десктоп) */}
          <div className="recent-trainings__table-wrapper">
            <table className="recent-trainings__table">
              <thead className="recent-trainings__table-head">
                <tr>
                  <th className="recent-trainings__table-header">Дата</th>
                  <th className="recent-trainings__table-header">Статус</th>
                  <th className="recent-trainings__table-header">
                    Длительность
                  </th>
                  <th className="recent-trainings__table-header">Упражнений</th>
                </tr>
              </thead>
              <tbody>
                {executions.map((exe) => {
                  const isCompleted = !!exe.endTime;
                  const exCount = exerciseExecutions[exe.id]?.length || 0;
                  return (
                    <tr
                      key={exe.id}
                      className={`recent-trainings__table-row ${!isCompleted ? "recent-trainings__table-row--active" : ""}`}
                      onClick={() => handleOpen(exe)}>
                      <td className="recent-trainings__table-cell recent-trainings__table-cell--date">
                        {formatDate(exe.startTime)}
                      </td>
                      <td className="recent-trainings__table-cell recent-trainings__table-cell--status">
                        <span
                          className={`recent-trainings__table-cell--status_${isCompleted ? "completed" : "pending"}`}>
                          {isCompleted ? "Завершена" : "В процессе"}
                        </span>
                      </td>
                      <td className="recent-trainings__table-cell recent-trainings__table-cell--duration">
                        {formatDuration(exe.startTime, exe.endTime)}
                      </td>
                      <td className="recent-trainings__table-cell recent-trainings__table-cell--exercises">
                        {exCount}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* КАРТОЧКИ (мобилка) */}
          <div className="recent-trainings__cards">
            {executions.map((exe) => {
              const isCompleted = !!exe.endTime;
              const exCount = exerciseExecutions[exe.id]?.length || 0;
              return (
                <div
                  key={exe.id}
                  className={`recent-trainings__card ${!isCompleted ? "recent-trainings__card--active" : ""}`}
                  onClick={() => handleOpen(exe)}>
                  <div className="recent-trainings__card-header">
                    <span className="recent-trainings__card-date">
                      {formatDate(exe.startTime)}
                    </span>
                    <span
                      className={`recent-trainings__card-status recent-trainings__card-status_${isCompleted ? "completed" : "pending"}`}>
                      {isCompleted ? "Завершена" : "В процессе"}
                    </span>
                  </div>
                  <div className="recent-trainings__card-body">
                    <span className="recent-trainings__card-duration">
                      ⏱ {formatDuration(exe.startTime, exe.endTime)}
                    </span>
                    <span className="recent-trainings__card-exercises">
                      🏋️ {exCount} упр.
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* МОДАЛКА */}
      {selectedExecution && (
        <div className="training-detail-modal__overlay" onClick={handleClose}>
          <div
            className="training-detail-modal__container"
            onClick={(e) => e.stopPropagation()}>
            <button
              className="training-detail-modal__close"
              onClick={handleClose}>
              ×
            </button>
            <h3 className="training-detail-modal__title">
              {selectedExecution.endTime ? "Тренировка" : "Активная тренировка"}
            </h3>
            <p className="training-detail-modal__date">
              {formatDate(selectedExecution.startTime)}
            </p>

            <div className="training-detail-modal__exercises">
              {editingExercises.map((ex, ei) => {
                const setsData =
                  (ex.setsData as Array<{
                    set?: number;
                    weight?: number;
                    reps?: number;
                  }>) || [];
                const exerciseName =
                  allExercises?.find((e) => e.id === ex.exerciseId)?.name ||
                  `Упражнение ${ei + 1}`;
                return (
                  <div
                    key={ex.id || ei}
                    className="training-detail-modal__exercise">
                    <p className="training-detail-modal__exercise-name">
                      {exerciseName}
                    </p>
                    <div className="training-detail-modal__sets">
                      {setsData.map((s, si) => (
                        <div key={si} className="training-detail-modal__set">
                          <span className="training-detail-modal__set-number">
                            {si + 1}
                          </span>
                          <input
                            type="number"
                            className="training-detail-modal__set-input"
                            placeholder="Вес"
                            value={s.weight || ""}
                            onChange={(e) =>
                              updateSet(
                                ei,
                                si,
                                "weight",
                                parseFloat(e.target.value) || 0,
                              )
                            }
                          />
                          <input
                            type="number"
                            className="training-detail-modal__set-input"
                            placeholder="Повт"
                            value={s.reps || ""}
                            onChange={(e) =>
                              updateSet(
                                ei,
                                si,
                                "reps",
                                parseInt(e.target.value) || 0,
                              )
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {editingExercises.length === 0 && (
                <p
                  style={{
                    color: "var(--text-secondary)",
                    textAlign: "center",
                  }}>
                  Нет упражнений
                </p>
              )}
            </div>

            <div className="training-detail-modal__notes">
              <p className="training-detail-modal__notes-title">Заметки</p>
              <textarea
                className="training-detail-modal__notes-textarea"
                value={editingNotes}
                onChange={(e) => setEditingNotes(e.target.value)}
                placeholder="Заметки о тренировке..."
                rows={2}
              />
            </div>

            <div className="training-detail-modal__actions">
              <button
                className="training-detail-modal__btn training-detail-modal__btn--cancel"
                onClick={handleClose}>
                Отмена
              </button>
              <button
                className="training-detail-modal__btn training-detail-modal__btn--save"
                onClick={handleSave}
                disabled={saving}>
                {saving ? "Сохранение..." : "Сохранить"}
              </button>
              {!selectedExecution.endTime && (
                <button
                  className="training-detail-modal__btn training-detail-modal__btn--finish"
                  onClick={handleFinish}
                  disabled={saving}>
                  Завершить
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
