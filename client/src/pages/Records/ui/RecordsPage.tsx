// RecordsPage.tsx
import "./RecordsPage.scss";
import { useCallback, useState, useEffect, useMemo, useRef } from "react";
import { useTrainingPlan } from "@/shared/hooks/useTrainingPlan";
import { useTrainingExecution } from "@/shared/hooks/useTrainingExecution";
import { useExercises } from "@/shared/hooks/useExercises";
import { useError } from "@/shared/hooks/useError";
import type {
  CreateTrainingDayExecution,
  CreateTrainingExerciseExecution,
} from "@/shared/api/types";
import { InfoPage } from "@/shared/ui/components/ErrorUI/ui/InfoPage";
import { useNavigate } from "react-router-dom";
import { addToQueue } from "@/lib/offline/offlineQueue";
import { API_BASE } from "@/shared/api";

type ExerciseRecord = {
  exerciseId: string;
  exerciseName: string;
  planSets: number;
  planReps: [number, number];
  sets: { weight: number; reps: number }[];
  orderInDay: number;
};

type PageState =
  | "loading"
  | "no-plan"
  | "not-started"
  | "in-progress"
  | "completed";

export function RecordsPage() {
  const { setError } = useError();
  const navigate = useNavigate();

  const { weekPlan, todayPlan, today, loadingPlan } = useTrainingPlan();
  const todayData = todayPlan?.data?.today ?? null;

  const {
    dayExecution,
    exerciseExecutions,
    loadingDay,
    savingExercises,
    startTraining,
    finishTraining,
    addExercises,
    updateDayExecution,
    loadExercisesByDay,
  } = useTrainingExecution(today.dayIndex);

  const { allExercises } = useExercises();

  // ─── Состояние ─────────────────────────────────────
  const [exerciseRecords, setExerciseRecords] = useState<ExerciseRecord[]>([]);
  const [dayNotes, setDayNotes] = useState("");
  const [trainingCompleted, setTrainingCompleted] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFinishWarning, setShowFinishWarning] = useState(false);

  // Ref для отслеживания уже загруженных данных с сервера
  const prevExecutionsRef = useRef<string | null>(null);

  // Уже добавленные упражнения (по ID)
  const addedIds = useMemo(
    () => new Set(exerciseRecords.map((r) => r.exerciseId)),
    [exerciseRecords],
  );

  // ─── Состояние страницы ────────────────────────────
  const pageState: PageState = useMemo(() => {
    if (loadingPlan || loadingDay) return "loading";
    if (!weekPlan) return "no-plan";
    if (trainingCompleted || dayExecution?.endTime) return "completed";
    if (!dayExecution) return "not-started";
    return "in-progress";
  }, [loadingPlan, loadingDay, weekPlan, dayExecution, trainingCompleted]);

  // ─── Синхронизация с сервером ──────────────────────
  useEffect(() => {
    if (!exerciseExecutions?.length || !dayExecution?.id) return;

    const currentKey = `${dayExecution.id}-${exerciseExecutions.length}`;
    if (prevExecutionsRef.current === currentKey) return;
    prevExecutionsRef.current = currentKey;

    const records: ExerciseRecord[] = exerciseExecutions.map((ee) => {
      const name =
        allExercises?.find((e) => e.id === ee.exerciseId)?.name || "Упражнение";
      const setsData = ee.setsData as Array<{
        set?: number;
        weight?: number;
        reps?: number;
      }>;
      const sets = (setsData || []).map((s) => ({
        weight: s.weight ?? 0,
        reps: s.reps ?? 0,
      }));

      return {
        exerciseId: ee.exerciseId,
        exerciseName: name,
        planSets: sets.length,
        planReps: [0, 0] as [number, number],
        sets,
        orderInDay: ee.orderInDay,
      };
    });

    setExerciseRecords(records);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exerciseExecutions?.length, dayExecution?.id]);

  // ─── Начать тренировку ─────────────────────────────
  const handleStart = useCallback(async () => {
    if (!weekPlan) return;

    const data: CreateTrainingDayExecution = {
      week: weekPlan.week,
      dayOfWeek: today.dayIndex,
      wellbeingToday: "NORMAL",
      notes: null,
    };

    if (!navigator.onLine) {
      addToQueue({
        url: `${API_BASE}/training-executions/days`,
        method: "POST",
        body: data as unknown as Record<string, unknown>,
      });
      setError(
        "empty",
        "📴 Тренировка сохранена локально. Отправится при подключении к сети.",
      );
      return;
    }

    try {
      const newDay = await startTraining(data);
      if (newDay?.id) {
        await loadExercisesByDay(newDay.id);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Не удалось начать тренировку";
      setError("network", message);
    }
  }, [weekPlan, today.dayIndex, setError, startTraining, loadExercisesByDay]);

  // ─── Добавить упражнение из модалки ────────────────
  const handleAddExercise = useCallback(
    (planExercise: {
      exerciseId: string;
      sets: number;
      targetRepsRange: [number, number];
    }) => {
      const name =
        allExercises?.find((e) => e.id === planExercise.exerciseId)?.name ||
        "Упражнение";

      setExerciseRecords((prev) => {
        if (prev.some((r) => r.exerciseId === planExercise.exerciseId))
          return prev;

        const emptySets = Array.from({ length: planExercise.sets }, () => ({
          weight: 0,
          reps: 0,
        }));

        return [
          ...prev,
          {
            exerciseId: planExercise.exerciseId,
            exerciseName: name,
            planSets: planExercise.sets,
            planReps: planExercise.targetRepsRange,
            sets: emptySets,
            orderInDay: prev.length,
          },
        ];
      });

      setShowAddModal(false);
    },
    [allExercises],
  );

  // ─── Обновить подход ───────────────────────────────
  const updateSet = useCallback(
    (
      exerciseIdx: number,
      setIdx: number,
      field: "weight" | "reps",
      value: number,
    ) => {
      setExerciseRecords((prev) =>
        prev.map((rec, i) =>
          i === exerciseIdx
            ? {
                ...rec,
                sets: rec.sets.map((s, j) =>
                  j === setIdx ? { ...s, [field]: value } : s,
                ),
              }
            : rec,
        ),
      );
    },
    [],
  );

  // ─── Проверить, все ли упражнения плана выполнены ──
  const isPlanCompleted = useMemo(() => {
    if (!todayData?.exercises) return true;
    return todayData.exercises.every((pe) => addedIds.has(pe.exerciseId));
  }, [todayData, addedIds]);

  // ─── Завершить тренировку ──────────────────────────
  const handleFinish = useCallback(async () => {
    if (!dayExecution) return;

    const exerciseData: CreateTrainingExerciseExecution[] = exerciseRecords.map(
      (rec) => ({
        executionId: dayExecution.id,
        exerciseId: rec.exerciseId,
        setsData: rec.sets
          .map((s, i) => ({ set: i + 1, weight: s.weight, reps: s.reps }))
          .filter((s) => s.reps > 0),
        orderInDay: rec.orderInDay,
      }),
    );

    // Если офлайн — сохраняем ВСЁ в очередь
    if (!navigator.onLine) {
      // 1. Обновление заметок
      addToQueue({
        url: `${API_BASE}/training-executions/days/${dayExecution.id}`,
        method: "PUT",
        body: { notes: dayNotes || null } as unknown as Record<string, unknown>,
      });

      // 2. Сохранение упражнений
      if (exerciseData.length > 0) {
        addToQueue({
          url: `${API_BASE}/training-executions/exercises`,
          method: "POST",
          body: exerciseData as unknown as Record<string, unknown>,
        });
      }

      // 3. Завершение тренировки
      addToQueue({
        url: `${API_BASE}/training-executions/days/${dayExecution.id}/finish`,
        method: "PUT",
        body: null,
      });

      setTrainingCompleted(true);
      setShowFinishWarning(false);
      setError(
        "empty",
        "📴 Тренировка сохранена локально. Данные отправятся при подключении к сети.",
      );
      return;
    }

    // Онлайн — отправляем сразу
    try {
      await updateDayExecution(dayExecution.id, { notes: dayNotes || null });

      if (exerciseData.length > 0) {
        await addExercises(exerciseData);
      }

      await finishTraining(dayExecution.id);

      setTrainingCompleted(true);
      setShowFinishWarning(false);
      setError("empty", "✅ Тренировка на сегодня окончена!");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Не удалось завершить тренировку";
      setError("network", message);
    }
  }, [
    dayExecution,
    exerciseRecords,
    dayNotes,
    setError,
    updateDayExecution,
    finishTraining,
    addExercises,
  ]);

  // ═══════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════

  if (pageState === "loading") return <InfoPage type="loading" />;

  if (pageState === "no-plan") {
    return (
      <div className="records-page__no-plan">
        <h2>Нет плана на сегодня</h2>
        <p>
          Создайте план тренировок, чтобы отслеживать выполнение и прогресс.
        </p>
        <button onClick={() => navigate("/training")}>🚀 Создать план</button>
      </div>
    );
  }

  return (
    <div className="records-page">
      <div className="records-page__header">
        <h1>Записи тренировок</h1>
        <p>
          {today.dayOfWeek} • Неделя {weekPlan?.week}
        </p>
      </div>

      {/* ── Не начата ─────────────────────────────── */}
      {pageState === "not-started" && (
        <div className="records-page__start">
          {!todayData || todayData.exercises.length === 0 ? (
            <>
              <p>Сегодня день отдыха — восстанавливайтесь! 🌿</p>
              <button
                className="records-page__start-btn records-page__start-btn--disabled"
                disabled
                title="Сегодня отдых">
                🚀 Начать тренировку
              </button>
            </>
          ) : (
            <>
              <p>У вас ещё нет записи тренировки за сегодня.</p>
              <button className="records-page__start-btn" onClick={handleStart}>
                🚀 Начать тренировку
              </button>
            </>
          )}
        </div>
      )}

      {/* ── В процессе ────────────────────────────── */}
      {pageState === "in-progress" && (
        <>
          <div className="records-page__info">
            <div>
              Самочувствие:{" "}
              {dayExecution?.wellbeingToday === "BAD"
                ? "😷 Плохо"
                : dayExecution?.wellbeingToday === "GOOD"
                  ? "💪 Отлично"
                  : "🙂 Нормально"}
            </div>
            <textarea
              placeholder="Заметки о тренировке..."
              value={dayNotes}
              onChange={(e) => setDayNotes(e.target.value)}
              rows={2}
            />
          </div>

          <button
            className="records-page__add-btn"
            onClick={() => setShowAddModal(true)}
            disabled={savingExercises}>
            ➕ Добавить упражнение
          </button>

          {/* Список выполненных упражнений */}
          {exerciseRecords.length > 0 && (
            <div className="records-page__exercises">
              {exerciseRecords.map((rec, ei) => {
                const plan = todayData?.exercises?.find(
                  (e) => e.exerciseId === rec.exerciseId,
                );
                return (
                  <div key={rec.exerciseId} className="records-page__exercise">
                    <h3>{rec.exerciseName}</h3>
                    <span>
                      План: {plan?.sets ?? rec.planSets} ×{" "}
                      {plan?.targetRepsRange?.[0] ?? rec.planReps[0]}–
                      {plan?.targetRepsRange?.[1] ?? rec.planReps[1]}
                    </span>

                    {rec.sets.map((s, si) => (
                      <div key={si} className="records-page__set">
                        <span>{si + 1}</span>
                        <input
                          type="number"
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
                );
              })}
            </div>
          )}

          {/* Кнопка "Закончить" */}
          {exerciseRecords.length > 0 && (
            <button
              className="records-page__finish-btn"
              onClick={() => {
                if (!isPlanCompleted) {
                  setShowFinishWarning(true);
                } else {
                  handleFinish();
                }
              }}
              disabled={savingExercises}>
              {savingExercises ? "Сохраняем..." : "💾 Закончить тренировку"}
            </button>
          )}
        </>
      )}

      {/* ── Завершена ─────────────────────────────── */}
      {pageState === "completed" && (
        <div className="records-page__completed">
          <p>✅ Тренировка на сегодня окончена.</p>
        </div>
      )}

      {/* ── Модалка: выбрать упражнение ───────────── */}
      {showAddModal && (
        <div
          className="records-page__modal-backdrop"
          onClick={() => setShowAddModal(false)}>
          <div
            className="records-page__modal"
            onClick={(e) => e.stopPropagation()}>
            <h3>Выберите упражнение</h3>
            <div>
              {todayData?.exercises
                ?.filter((ex) => !addedIds.has(ex.exerciseId))
                .map((ex) => {
                  const name =
                    allExercises?.find((e) => e.id === ex.exerciseId)?.name ||
                    "Упражнение";
                  return (
                    <button
                      key={ex.exerciseId}
                      onClick={() => handleAddExercise(ex)}>
                      {name} — {ex.sets}×{ex.targetRepsRange[0]}–
                      {ex.targetRepsRange[1]}
                    </button>
                  );
                })}
              {todayData?.exercises?.filter(
                (ex) => !addedIds.has(ex.exerciseId),
              ).length === 0 && <p>Все упражнения уже добавлены</p>}
            </div>
            <button onClick={() => setShowAddModal(false)}>Отмена</button>
          </div>
        </div>
      )}

      {/* ── Предупреждение: не все упражнения ──────── */}
      {showFinishWarning && (
        <div
          className="records-page__modal-backdrop"
          onClick={() => setShowFinishWarning(false)}>
          <div
            className="records-page__modal"
            onClick={(e) => e.stopPropagation()}>
            <p>
              ⚠️ Вы выполнили не все упражнения плана. Завершить тренировку?
            </p>
            <button onClick={handleFinish}>Да, завершить</button>
            <button onClick={() => setShowFinishWarning(false)}>Отмена</button>
          </div>
        </div>
      )}
    </div>
  );
}
