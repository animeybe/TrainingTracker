import "./RecordsPage.scss";
import { useCallback, useState, useEffect, useMemo } from "react";
import { useTrainingPlan } from "@/shared/hooks/useTrainingPlan";
import { useTrainingExecution } from "@/shared/hooks/useTrainingExecution";
import { useExercises } from "@/shared/hooks/useExercises";
import { useError } from "@/shared/hooks/useError";
import type {
  CreateTrainingDayExecution,
  CreateTrainingExerciseExecution,
} from "@/shared/api/trainingExecutionApi";
import { InfoPage } from "@/shared/ui/components/ErrorUI/ui/InfoPage";
import { useNavigate } from "react-router-dom";

// Локальное состояние = один список упражнений с кол‑вом подходов и повторов
type ExerciseRecord = {
  exerciseId: string;
  exerciseName: string;
  sets: number; // план: сколько подходов
  targetReps: [number, number]; // диапазон повторов по плану, например [8, 10]
  actualSets: number; // сколько реально сделано подходов
  actualReps: number[]; // массив повторов по каждому подходу
  orderInDay: number;
  notes?: string;
};

type RecordsPageState = "loading" | "no-plan" | "no-day" | "existing-day";

export function RecordsPage() {
  const { setError } = useError();
  const navigate = useNavigate();

  const { weekPlan, todayPlan, today, loadingPlan, loadingTodayPlan } =
    useTrainingPlan();

  const {
    dayExecution,
    exerciseExecutions,
    loadingDay,
    loadingExercises,
    savingExercises,
    saveDayExecution,
    saveExerciseExecutions,
    updateDayExecution,
    loadExercisesByDay,
  } = useTrainingExecution(today.dayIndex);

  const { allExercises } = useExercises();

  // 1. Локальное состояние
  const [exerciseRecords, setExerciseRecords] = useState<ExerciseRecord[]>([]);
  const [dayNotes, setDayNotes] = useState("");
  const [trainingCompleted, setTrainingCompleted] = useState(false);
  const [isAddExerciseModalOpen, setIsAddExerciseModalOpen] = useState(false);
  const [exerciseToAdd, setExerciseToAdd] = useState<{
    exerciseId: string;
    name: string;
    sets: number;
    targetReps: [number, number];
  } | null>(null);

  const addedExerciseIds = useMemo(
    () => new Set(exerciseRecords.map((r) => r.exerciseId)),
    [exerciseRecords],
  );

  // 2. Состояние UI
  const pageState: RecordsPageState = useMemo(() => {
    if (loadingPlan || loadingDay || loadingExercises || loadingTodayPlan) {
      return "loading";
    }
    if (!weekPlan) {
      return "no-plan";
    }
    if (!dayExecution) {
      return "no-day";
    }
    return "existing-day";
  }, [
    weekPlan,
    dayExecution,
    loadingPlan,
    loadingDay,
    loadingExercises,
    loadingTodayPlan,
  ]);

  // 3. Начать тренировку → создать `dayExecution`
  const handleStartTraining = useCallback(async () => {
    if (!todayPlan?.today || !weekPlan) return;

    const dayData: CreateTrainingDayExecution = {
      week: weekPlan.week,
      dayOfWeek: today.dayIndex,
      executionDate: new Date().toISOString(),
      wellbeingToday: "NORMAL",
      notes: "",
    };

    try {
      const newDay = await saveDayExecution(dayData);
      if (!newDay) {
        throw new Error("Сервер вернул пустой dayExecution");
      }

      setDayNotes(newDay.notes ?? "");
      setTrainingCompleted(false);

      if (newDay.id) {
        await loadExercisesByDay(newDay.id);
      }
    } catch (error) {
      setError(
        "network",
        error instanceof Error ? error.message : "Не удалось начать тренировку",
      );
    }
  }, [
    todayPlan?.today,
    weekPlan,
    today.dayIndex,
    saveDayExecution,
    loadExercisesByDay,
    setError,
  ]);

  // 4. Обновить `notes` дня
  const handleUpdateNotes = useCallback((notes: string) => {
    setDayNotes(notes);
  }, []);

  // 5. Обновить число повторов в одном подходе
  const updateSetReps = useCallback(
    (exerciseIndex: number, setIndex: number, reps: number) => {
      setExerciseRecords((prev) =>
        prev.map((record, idx) =>
          idx === exerciseIndex
            ? {
                ...record,
                actualSets: Math.max(record.actualSets, setIndex + 1),
                actualReps: record.actualReps.map((r, i) =>
                  i === setIndex ? reps : r,
                ),
              }
            : record,
        ),
      );
    },
    [],
  );

  // 6. Добавить упражнение из модалки
  const handleAddExercise = useCallback(() => {
    if (!exerciseToAdd) return;

    const targetReps = exerciseToAdd.targetReps;
    const actualReps = Array(exerciseToAdd.sets || 3).fill(0);

    setExerciseRecords((prev) => {
      if (prev.some((r) => r.exerciseId === exerciseToAdd.exerciseId)) {
        return prev;
      }

      return [
        ...prev,
        {
          exerciseId: exerciseToAdd.exerciseId,
          exerciseName: exerciseToAdd.name,
          sets: exerciseToAdd.sets,
          targetReps,
          actualSets: exerciseToAdd.sets,
          actualReps,
          orderInDay: prev.length,
          notes: "",
        },
      ];
    });

    setIsAddExerciseModalOpen(false);
    setExerciseToAdd(null);
  }, [exerciseToAdd]);

  // 7. Сохранить тренировку
  const handleSaveTraining = useCallback(async () => {
    console.log("📝 Saving notes:", dayNotes);
    console.log(
      "📝 actualReps:",
      exerciseRecords.map((r) => r.actualReps),
    );

    if (!dayExecution || exerciseRecords.length === 0) return;

    try {
      // 1. Обновить notes дня
      await updateDayExecution(dayExecution.id, { notes: dayNotes });
      console.log("✅ Day notes updated");

      // 2. Создать/обновить выполнения упражнений
      const exerciseData: CreateTrainingExerciseExecution[] = exerciseRecords
        .map((record) => {
          const totalReps = record.actualReps.reduce(
            (sum, reps) => sum + reps,
            0,
          );
          return {
            executionId: dayExecution.id,
            exerciseId: record.exerciseId,
            sets: record.actualSets,
            reps: totalReps, // Int – сумма повторов по всем сетам
            orderInDay: record.orderInDay,
            notes: record.notes ?? "",
          };
        })
        .filter((item) => item.sets > 0);

      if (exerciseData.length > 0) {
        await saveExerciseExecutions(exerciseData);
        console.log("✅ Exercises saved");
      }

      setTrainingCompleted(true);
      setError("empty", "✅ Тренировка на сегодня окончена!");
    } catch (error) {
      setError(
        "network",
        error instanceof Error
          ? error.message
          : "Не удалось сохранить тренировку",
      );
    }
  }, [
    dayExecution,
    exerciseRecords,
    dayNotes,
    updateDayExecution,
    saveExerciseExecutions,
    setError,
  ]);

  // 8. Мердж с уже сохранёнными `exerciseExecutions`
  useEffect(() => {
    if (!dayExecution || exerciseExecutions.length === 0) return;

    const recordMap = new Map(exerciseRecords.map((r) => [r.exerciseId, r]));

    const merged = exerciseExecutions.map((ee) => {
      const local = recordMap.get(ee.exerciseId) || {
        exerciseId: ee.exerciseId,
        exerciseName: "",
        sets: 0,
        targetReps: [0, 0] as [number, number],
        actualSets: 0,
        actualReps: [] as number[],
        orderInDay: 0,
        notes: "",
      };

      const exName =
        allExercises?.find((e) => e.id === ee.exerciseId)?.name ||
        local.exerciseName;

      return {
        ...local,
        exerciseName: exName,
        actualSets: ee.sets,
        orderInDay: ee.orderInDay,
        notes: ee.notes,
      };
    });

    setExerciseRecords(merged);
  }, [exerciseExecutions, dayExecution, exerciseRecords, allExercises]);

  // 9. Подготовка записей с актуальными именами упражнений
  const exerciseRecordsWithNames = useMemo(
    () =>
      exerciseRecords.map((record) => ({
        ...record,
        exerciseName:
          allExercises?.find((e) => e.id === record.exerciseId)?.name ||
          "Неизвестное упражнение",
      })),
    [exerciseRecords, allExercises],
  );

  // 10. БЭМ‑префикс
  const bem = "records-page";

  // =============== RENDER ===============

  if (pageState === "loading") {
    return <InfoPage type="loading" />;
  }

  if (pageState === "no-plan") {
    return (
      <div className={`${bem}__no-plan`}>
        <div className={`${bem}__no-plan-content`}>
          <h2 className={`${bem}__no-plan-title`}>Нет плана на сегодня</h2>
          <p className={`${bem}__no-plan-text`}>
            Создайте план тренировок, чтобы отслеживать выполнение и прогресс.
          </p>
          <div className={`${bem}__no-plan-cta`}>
            <button
              className={`${bem}__no-plan-btn`}
              onClick={() => navigate("/training", { replace: true })}>
              🚀 Создать план
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={bem}>
      {/* Заголовок */}
      <div className={`${bem}__header`}>
        <h1 className={`${bem}__title`}>Записи тренировок</h1>
        <p className={`${bem}__subtitle`}>
          {today.dayOfWeek} • Неделя {weekPlan?.week}
        </p>
      </div>

      {/* Нет записи дня → показать кнопку "Начать тренировку" */}
      {pageState === "no-day" && (
        <div className={`${bem}__start-section`}>
          <p className={`${bem}__info-text`}>
            У вас ещё нет записи тренировки за сегодня.
          </p>
          <button
            className={`${bem}__start-btn`}
            onClick={handleStartTraining}
            disabled={!todayPlan?.today?.exercises.length}>
            🚀 Начать тренировку
          </button>
        </div>
      )}

      {/* Есть запись дня, тренировка ещё не завершена */}
      {pageState === "existing-day" && dayExecution && !trainingCompleted && (
        <>
          {/* Информация о дне и заметки */}
          <div className={`${bem}__day-info`}>
            <div className={`${bem}__wellbeing`}>
              <span>Самочувствие:</span>
              <span
                className={`${bem}__wellbeing-badge wellbeing-${dayExecution.wellbeingToday.toLowerCase()}`}>
                {dayExecution.wellbeingToday === "BAD"
                  ? "😷 Плохо"
                  : dayExecution.wellbeingToday === "NORMAL"
                    ? "🙂 Нормально"
                    : "💪 Отлично"}
              </span>
            </div>
            <textarea
              className={`${bem}__day-notes`}
              placeholder="Заметки о тренировке..."
              value={dayNotes}
              onChange={(e) => handleUpdateNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Кнопка "Сделать упражнение" и модалка */}
          <div className={`${bem}__day-actions`}>
            <button
              className={`${bem}__add-exercise-btn`}
              onClick={() => setIsAddExerciseModalOpen(true)}
              disabled={savingExercises}>
              ➕ Сделать упражнение
            </button>
          </div>

          {/* Список упражнений с полями повторений */}
          <div className={`${bem}__exercises`}>
            {exerciseRecordsWithNames.length === 0 && (
              <p className={`${bem}__no-exercise-records`}>
                Нет упражнений для записи.
              </p>
            )}

            {exerciseRecordsWithNames.map((record, exerciseIdx) => (
              <div key={record.exerciseId} className={`${bem}__exercise`}>
                <div className={`${bem}__exercise-header`}>
                  <h3>{record.exerciseName}</h3>
                  <span>
                    По плану: {record.sets} × {record.targetReps[0]}–
                    {record.targetReps[1]}
                  </span>
                </div>

                <div className={`${bem}__sets`}>
                  {record.actualReps.map((_, setIdx) => (
                    <div key={setIdx} className={`${bem}__set`}>
                      <span className={`${bem}__set-number`}>{setIdx + 1}</span>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={record.actualReps[setIdx] || ""}
                        onChange={(e) =>
                          updateSetReps(
                            exerciseIdx,
                            setIdx,
                            parseInt(e.target.value) || 0,
                          )
                        }
                        className={`${bem}__set-input`}
                        placeholder="повт"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Кнопка сохранения */}
          {exerciseRecords.length > 0 && (
            <div className={`${bem}__save-section`}>
              <button
                className={`${bem}__save-btn`}
                onClick={handleSaveTraining}
                disabled={savingExercises}>
                {savingExercises ? "Сохраняем..." : "💾 Записать тренировку"}
              </button>
            </div>
          )}
        </>
      )}

      {/* Тренировка завершена */}
      {trainingCompleted && (
        <div className={`${bem}__completed`}>
          <p className={`${bem}__completed-message`}>
            ✅ Тренировка на сегодня окончена.
          </p>
        </div>
      )}

      {/* Модалка "Сделать упражнение" */}
      {isAddExerciseModalOpen && (
        <div className={`${bem}__modal-backdrop`}>
          <div className={`${bem}__modal-content`}>
            <h3 className={`${bem}__modal-title`}>Выберите упражнение</h3>
            <div className={`${bem}__modal-body`}>
              {(() => {
                const availableExercises = todayPlan?.today?.exercises.filter(
                  (ex) => !addedExerciseIds.has(ex.exerciseId),
                );

                if (!availableExercises || availableExercises.length === 0) {
                  return (
                    <p className={`${bem}__no-exercises-in-modal`}>
                      Все упражнения уже добавлены в тренировку
                    </p>
                  );
                }

                return availableExercises.map((ex) => {
                  const exData = allExercises?.find(
                    (e) => e.id === ex.exerciseId,
                  );
                  const targetReps = ex.targetRepsRange ?? [10, 12];
                  return (
                    <button
                      key={ex.exerciseId}
                      className={`${bem}__modal-exercise`}
                      onClick={() => {
                        setExerciseToAdd({
                          exerciseId: ex.exerciseId,
                          name: exData?.name || "Неизвестное",
                          sets: ex.sets,
                          targetReps,
                        });
                      }}>
                      {`${exData?.name || "Неизвестное"} × ${targetReps[0]}–${targetReps[1]}`}
                    </button>
                  );
                });
              })()}
            </div>
            <div className={`${bem}__modal-actions`}>
              <button
                className={`${bem}__modal-btn-cancel`}
                onClick={() => {
                  setIsAddExerciseModalOpen(false);
                  setExerciseToAdd(null);
                }}>
                Отмена
              </button>
              <button
                className={`${bem}__modal-btn-add`}
                disabled={!exerciseToAdd}
                onClick={handleAddExercise}>
                Добавить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
