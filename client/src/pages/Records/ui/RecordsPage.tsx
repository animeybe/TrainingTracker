// RecordsPage.tsx
/**
 * RecordsPage — страница записи тренировки.
 *
 * Архитектура:
 *   1. Сервер — источник истины. При онлайне данные из API.
 *   2. localStorage — офлайн-фолбек для exerciseRecords, dayNotes и _completed флага.
 *   3. При старте тренировки офлайн — создаётся локальный dayExecution (id: local-...).
 *   4. При завершении офлайн — finishTraining локально проставляет endTime.
 *   5. _completed флаг проверяется напрямую из localStorage — всегда актуален.
 *   6. _completed удаляется только при смене дня (новый storageKey) или вручную.
 *   7. При появлении сети — processQueue отправляет очередь, UI обновляется через handleOnline.
 *   8. Один день = одна тренировка. Повторный старт блокируется.
 *   9. RecentTrainings — таблица последних 7 тренировок с возможностью редактирования.
 */

import "./RecordsPage.scss";
import { useCallback, useState, useEffect, useMemo } from "react";
import { useTrainingPlan } from "@/shared/hooks/useTrainingPlan";
import { useTrainingExecution } from "@/shared/hooks/useTrainingExecution";
import { useExercises } from "@/shared/hooks/useExercises";
import { useError } from "@/shared/hooks/useError";
import type {
  CreateTrainingDayExecution,
  CreateTrainingExerciseExecution,
  Exercise,
  TrainingExerciseExecution,
} from "@/shared/api/types";
import { InfoPage } from "@/shared/ui/components/ErrorUI/ui/InfoPage";
import { RecentTrainings } from "@/shared/ui/blocks/RecentTrainings/RecentTrainings";
import { trainingExecutionApi } from "@/shared/api";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { getQueue } from "@/lib/offline/offlineQueue";

// ─── Типы ────────────────────────────────────────────────
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

// ─── Утилиты localStorage ────────────────────────────────
const getStorageKey = (dayIndex: number, week?: number) =>
  `training_progress_${dayIndex}_${week ?? 1}`;

interface LocalTrainingData {
  dayExecutionId?: string | null;
  records?: ExerciseRecord[];
  notes?: string;
}

function getLocalData(storageKey: string): LocalTrainingData {
  const saved = localStorage.getItem(storageKey);
  if (!saved) return {};
  try {
    return JSON.parse(saved);
  } catch {
    return {};
  }
}

function saveLocalData(storageKey: string, data: LocalTrainingData): void {
  localStorage.setItem(storageKey, JSON.stringify(data));
}

function clearLocalData(storageKey: string): void {
  localStorage.removeItem(storageKey);
}

function buildServerRecords(
  exerciseExecutions: TrainingExerciseExecution[],
  allExercises: Exercise[] | null,
): ExerciseRecord[] {
  return exerciseExecutions.map((ee) => {
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
}

export function RecordsPage() {
  const { setError } = useError();
  const navigate = useNavigate();
  const { weekPlan, todayPlan, today, loadingPlan, currentWeek } =
    useTrainingPlan();
  const todayData = todayPlan?.data?.today ?? null;

  const {
    dayExecution,
    exerciseExecutions,
    weekExecutions,
    loadingDay,
    savingExercises,
    startTraining,
    finishTraining,
    addExercises,
    updateDayExecution,
    loadExercisesByDay,
    serverResponded,
    loadWeekExecutions,
  } = useTrainingExecution(today.dayIndex);

  const { allExercises } = useExercises();

  const [weekExerciseData, setWeekExerciseData] = useState<
    Record<string, TrainingExerciseExecution[]>
  >({});

  // Загружаем упражнения для всех тренировок недели
  useEffect(() => {
    if (!weekExecutions.length) return;
    let cancelled = false;
    const loadAll = async () => {
      const data: Record<string, TrainingExerciseExecution[]> = {};
      for (const exe of weekExecutions) {
        try {
          const exercises = await trainingExecutionApi.getExercisesByDay(
            exe.id,
          );
          data[exe.id] = exercises;
        } catch {
          data[exe.id] = [];
        }
      }
      if (!cancelled) setWeekExerciseData(data);
    };
    loadAll();
    return () => {
      cancelled = true;
    };
  }, [weekExecutions]);

  // Сортируем тренировки: сверху самые новые
  const sortedExecutions = useMemo(() => {
    return [...weekExecutions].sort(
      (a, b) =>
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
    );
  }, [weekExecutions]);

  const storageKey = useMemo(() => {
    const week =
      (currentWeek ?? Number(localStorage.getItem("currentWeek"))) || 1;
    return getStorageKey(today.dayIndex, week);
  }, [today.dayIndex, currentWeek]);

  const serverRecords = useMemo(() => {
    if (!exerciseExecutions?.length || !dayExecution?.id) return null;
    return buildServerRecords(exerciseExecutions, allExercises);
  }, [exerciseExecutions, dayExecution?.id, allExercises]);

  const localData = useMemo(() => {
    if (serverRecords) return {};
    return getLocalData(storageKey);
  }, [serverRecords, storageKey]);

  const [exerciseRecords, setExerciseRecords] = useState<ExerciseRecord[]>(
    () => serverRecords ?? localData.records ?? [],
  );
  const [dayNotes, setDayNotes] = useState(() => localData.notes || "");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFinishWarning, setShowFinishWarning] = useState(false);

  if (serverRecords && serverRecords.length > 0) {
    const currentIds = JSON.stringify(
      exerciseRecords.map((r) => r.exerciseId).sort(),
    );
    const serverIds = JSON.stringify(
      serverRecords.map((r) => r.exerciseId).sort(),
    );
    if (currentIds !== serverIds) setExerciseRecords(serverRecords);
  }

  if (!loadingDay && dayExecution === null && exerciseExecutions.length === 0) {
    if (serverResponded) {
      localStorage.removeItem(storageKey + "_completed");
    }
    if (exerciseRecords.length > 0 || dayNotes) {
      clearLocalData(storageKey);
      setExerciseRecords([]);
      setDayNotes("");
    }
  }

  const addedIds = useMemo(
    () => new Set(exerciseRecords.map((r) => r.exerciseId)),
    [exerciseRecords],
  );

  const handleSaveTraining = useCallback(
    async (
      executionId: string,
      data: { notes?: string; exercises?: TrainingExerciseExecution[] },
    ) => {
      try {
        if (data.notes !== undefined)
          await updateDayExecution(executionId, { notes: data.notes });
        if (data.exercises) await addExercises(data.exercises);
        toast.success("✅ Изменения сохранены");
        await loadWeekExecutions(currentWeek ?? 1);
      } catch {
        toast.error("Не удалось сохранить изменения");
      }
    },
    [updateDayExecution, addExercises, loadWeekExecutions, currentWeek],
  );

  const handleFinishTraining = useCallback(
    async (executionId: string) => {
      try {
        await finishTraining(executionId);
        toast.success("✅ Тренировка завершена!");
        await loadWeekExecutions(currentWeek ?? 1);
      } catch {
        toast.error("Не удалось завершить тренировку");
      }
    },
    [finishTraining, loadWeekExecutions, currentWeek],
  );

  const pageState: PageState = useMemo(() => {
    if (loadingPlan || loadingDay) return "loading";
    if (!weekPlan) return "no-plan";
    if (
      dayExecution?.endTime ||
      localStorage.getItem(storageKey + "_completed") === "true"
    )
      return "completed";
    if (dayExecution || exerciseRecords.length > 0) return "in-progress";
    return "not-started";
  }, [
    loadingPlan,
    loadingDay,
    weekPlan,
    dayExecution,
    exerciseRecords.length,
    storageKey,
  ]);

  useEffect(() => {
    if (exerciseRecords.length > 0 || dayNotes) {
      saveLocalData(storageKey, {
        dayExecutionId: dayExecution?.id ?? null,
        records: exerciseRecords,
        notes: dayNotes,
      });
    }
  }, [exerciseRecords, dayNotes, dayExecution?.id, storageKey]);

  const handleStart = useCallback(async () => {
    if (!weekPlan) return;
    if (dayExecution?.id && !dayExecution.id.startsWith("local-")) {
      toast.error("Тренировка на сегодня уже начата!");
      return;
    }
    if (exerciseRecords.length > 0) {
      toast.error("У вас уже есть активная тренировка!");
      return;
    }
    if (localStorage.getItem(storageKey + "_completed") === "true") {
      toast.error("Дождитесь синхронизации с сервером");
      return;
    }
    try {
      const queue = await getQueue();
      if (
        queue.some(
          (item) =>
            item.url.includes("/training-executions/days") &&
            item.method === "POST",
        )
      ) {
        toast.error("Дождитесь синхронизации предыдущей тренировки");
        return;
      }
    } catch {
      /* IndexedDB недоступен */
    }
    const data: CreateTrainingDayExecution = {
      week: weekPlan.week,
      dayOfWeek: today.dayIndex,
      wellbeingToday: "NORMAL",
      notes: null,
    };
    try {
      const newDay = await startTraining(data);
      if (newDay?.id && !newDay.id.startsWith("local-"))
        await loadExercisesByDay(newDay.id);
    } catch {
      /* startTraining сам показывает toast */
    }
  }, [
    weekPlan,
    today.dayIndex,
    dayExecution,
    exerciseRecords.length,
    storageKey,
    startTraining,
    loadExercisesByDay,
  ]);

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

  const isPlanCompleted = useMemo(() => {
    if (!todayData?.exercises?.length) return true;
    return todayData.exercises.every((pe) => addedIds.has(pe.exerciseId));
  }, [todayData, addedIds]);

  const handleFinish = useCallback(async () => {
    if (!dayExecution) return;
    const exerciseData: CreateTrainingExerciseExecution[] = exerciseRecords.map(
      (rec) => ({
        executionId: dayExecution.id,
        exerciseId: rec.exerciseId,
        setsData: rec.sets.map((s, i) => ({
          set: i + 1,
          weight: s.weight,
          reps: s.reps,
        })),
        orderInDay: rec.orderInDay,
      }),
    );
    let hasError = false;
    try {
      await updateDayExecution(dayExecution.id, { notes: dayNotes || null });
    } catch {
      hasError = true;
    }
    try {
      if (exerciseData.length > 0) await addExercises(exerciseData);
    } catch {
      hasError = true;
    }
    try {
      await finishTraining(dayExecution.id);
    } catch {
      hasError = true;
    }
    clearLocalData(storageKey);
    setExerciseRecords([]);
    setDayNotes("");
    setShowFinishWarning(false);
    localStorage.setItem(storageKey + "_completed", "true");
    if (hasError) {
      toast.success(
        `📴 Тренировка за ${today.dayOfWeek} будет отправлена на сервер при появлении сети`,
        { duration: 4000, position: "bottom-right" },
      );
    } else {
      setError("empty", "✅ Тренировка на сегодня окончена!");
    }
    await loadWeekExecutions(currentWeek ?? 1);
  }, [
    dayExecution,
    exerciseRecords,
    dayNotes,
    storageKey,
    today.dayOfWeek,
    setError,
    updateDayExecution,
    finishTraining,
    addExercises,
    loadWeekExecutions,
    currentWeek,
  ]);

  // ═══════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════
  if (pageState === "loading") return <InfoPage type="loading" />;
  if (pageState === "no-plan") {
    return (
      <div className="records-page__no-plan">
        <h2>Нет плана на сегодня</h2>
        <p>Создайте план тренировок.</p>
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

      {pageState === "not-started" && (
        <div className="records-page__start">
          {!todayData ? (
            <>
              <p>Сегодня день отдыха 🌿</p>
              <button className="records-page__start-btn" disabled>
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
          {exerciseRecords.length > 0 && (
            <button
              className="records-page__finish-btn"
              onClick={() =>
                isPlanCompleted ? handleFinish() : setShowFinishWarning(true)
              }
              disabled={savingExercises}>
              {savingExercises ? "Сохраняем..." : "💾 Закончить тренировку"}
            </button>
          )}
        </>
      )}

      <RecentTrainings
        executions={sortedExecutions}
        exerciseExecutions={weekExerciseData}
        allExercises={allExercises}
        onSave={handleSaveTraining}
        onFinish={handleFinishTraining}
        showTodayBadge={pageState === "completed"}
      />

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
