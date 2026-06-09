// TrainingPage.tsx
import "./TrainingPage.scss";

import { useProfile } from "@/shared/hooks/useProfile";
import { useTrainingPlan } from "@/shared/hooks/useTrainingPlan";
import { getSplitNameRu, getDayTypeRu } from "@/lib/utils";
import { InfoPage } from "@/shared/ui/components/ErrorUI/ui/InfoPage";
import type { ErrorType } from "@/shared/ui/components/ErrorUI/model/types";
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import type { TrainingDay, Exercise } from "@/shared/api/types";
import { requirePremium } from "@/lib/premium/premium";
import { useSafeAuthContext } from "@/shared/hooks/useSafeAuth";
import { ExerciseDetailModal } from "@/shared/ui/components/ExerciseDetailModal/ExerciseDetailModal";
import { ExercisePickerModal } from "@/shared/ui/components/ExercisePickerModal/ExercisePickerModal";
import { InfoTooltip } from "@/shared/ui/components/InfoTooltip/InfoTooltip";
import { MUSCLE_GROUP_LABELS } from "@/pages/ExerciseBase/common/utils/muscleGroupInterpreter";
import { retryWithReload } from "@/lib/utils/errorActions";
import { planApi } from "@/shared/api/planApi";
import { useExercises } from "@/shared/hooks/useExercises";
import { motion, AnimatePresence } from "framer-motion";

const SPLIT_OPTIONS = [
  {
    value: "recommended",
    label: "✨ Рекомендованный для Вас",
    description: "Система подберёт оптимальный сплит на основе вашего профиля",
  },
  {
    value: "PPL",
    label: "Push/Pull/Legs (PPL)",
    description: "Три тренировочных дня: жимовые, тяговые, ноги",
  },
  {
    value: "FULL_BODY",
    label: "Full Body (Фулбоди)",
    description: "Тренировка всего тела за одну сессию",
  },
  {
    value: "UPPER_LOWER",
    label: "Upper/Lower (Верх/Низ)",
    description: "Чередование верха и низа тела",
  },
  {
    value: "BRO_SPLIT",
    label: "Bro Split (По группам мышц)",
    description: "Каждый день — отдельная группа мышц",
  },
  {
    value: "STRENGTH_FOCUS",
    label: "Силовой фокус",
    description: "Акцент на базовые упражнения и силу",
  },
  {
    value: "HYPERTROPHY_FOCUS",
    label: "Гипертрофия (на массу)",
    description: "Акцент на объём и рост мышц",
  },
] as const;

const SPLIT_DAY_TYPES: Record<string, { value: string; label: string }[]> = {
  PPL: [
    { value: "push", label: "Push (Жимовые)" },
    { value: "pull", label: "Pull (Тяговые)" },
    { value: "legs", label: "Legs (Ноги)" },
  ],
  UPPER_LOWER: [
    { value: "upper", label: "Upper (Верх)" },
    { value: "lower", label: "Lower (Низ)" },
  ],
  FULL_BODY: [{ value: "full", label: "Full Body" }],
  BRO_SPLIT: [
    { value: "chest", label: "Грудь" },
    { value: "back", label: "Спина" },
    { value: "shoulders", label: "Плечи" },
    { value: "legs", label: "Ноги" },
    { value: "arms", label: "Руки" },
  ],
  STRENGTH_FOCUS: [
    { value: "lower", label: "Lower (Низ)" },
    { value: "push", label: "Push (Жимовые)" },
    { value: "pull", label: "Pull (Тяговые)" },
    { value: "upper", label: "Upper (Верх)" },
  ],
  HYPERTROPHY_FOCUS: [
    { value: "chest", label: "Грудь" },
    { value: "back", label: "Спина" },
    { value: "shoulders", label: "Плечи" },
    { value: "arms", label: "Руки" },
    { value: "legs", label: "Ноги" },
  ],
};

export function TrainingPage() {
  const {
    weekPlan,
    todayPlan,
    exercises,
    today,
    wellbeing,
    loadingPlan,
    loadingTodayPlan,
    isProfileIncomplete,
    generatePlan,
    refreshPlan,
    selectDay,
    showWellbeingModal,
    showWellbeingWarning,
    wellbeingWarningAction,
    handleWellbeingChange,
    confirmWellbeingChange,
    openWellbeingModal,
    isNextWeekPlanStale,
    dismissWellbeingWarning,
    deletePlan,
    setTodayPlanDirectly,
  } = useTrainingPlan();

  const { profile, loadingProfile } = useProfile();
  const { user } = useSafeAuthContext();
  const { allExercises, leastFavoriteExercises } = useExercises();

  const [planGenerationLoading, setPlanGenerationLoading] = useState(false);
  const [localError, setLocalError] = useState<{
    type: ErrorType;
    message?: string;
  } | null>(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState(today.dayIndex);
  const [selectedSplit, setSelectedSplit] = useState("recommended");
  const [showSplitSelector, setShowSplitSelector] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(
    null,
  );
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [toggleDayConfirm, setToggleDayConfirm] = useState<{
    dayIndex: number;
    isRest: boolean;
  } | null>(null);
  const [showDayTypePicker, setShowDayTypePicker] = useState(false);
  const [selectedDayType, setSelectedDayType] = useState<string>("");
  const [longPressTimer, setLongPressTimer] = useState<ReturnType<
    typeof setTimeout
  > | null>(null);

  const splitToggleRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const todayData = todayPlan?.data?.today ?? null;
  const allTrainingDays = useMemo(
    () => weekPlan?.trainingDays ?? [],
    [weekPlan],
  );
  const selectedDay: TrainingDay | null = useMemo(() => {
    if (selectedDayIndex === today.dayIndex && todayData) return todayData;
    return (
      allTrainingDays.find((d) => d.dayOfWeek === selectedDayIndex) ?? null
    );
  }, [selectedDayIndex, today.dayIndex, todayData, allTrainingDays]);

  const dayNames = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
  const dayFullNames = [
    "Понедельник",
    "Вторник",
    "Среда",
    "Четверг",
    "Пятница",
    "Суббота",
    "Воскресенье",
  ];

  const isSelectedDayTraining = selectedDay !== null;
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  // Множество ID нелюбимых упражнений для проверки forced
  const leastFavoriteIds = useMemo(
    () => new Set(leastFavoriteExercises?.map((e) => e.id) || []),
    [leastFavoriteExercises],
  );

  const availableDayTypes = useMemo(() => {
    if (!weekPlan) return [];
    return SPLIT_DAY_TYPES[weekPlan.split.name] || [];
  }, [weekPlan]);

  // Дропдаун вверх/вниз
  useEffect(() => {
    if (showSplitSelector && splitToggleRef.current && dropdownRef.current) {
      const rect = splitToggleRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const shouldFlip = spaceBelow < dropdownRef.current.scrollHeight;
      dropdownRef.current.classList.toggle("dropdown--up", shouldFlip);
      dropdownRef.current.classList.toggle("dropdown--down", !shouldFlip);
    }
  }, [showSplitSelector]);

  const handleToggleDayType = useCallback(() => {
    if (!isSelectedDayTraining) {
      if (availableDayTypes.length > 1) {
        setSelectedDayType(availableDayTypes[0].value);
        setShowDayTypePicker(true);
      } else {
        setSelectedDayType(availableDayTypes[0]?.value || "full");
        setToggleDayConfirm({ dayIndex: selectedDayIndex, isRest: false });
      }
    } else {
      setSelectedDayType("");
      setToggleDayConfirm({ dayIndex: selectedDayIndex, isRest: true });
    }
  }, [selectedDayIndex, isSelectedDayTraining, availableDayTypes]);

  const handleDayTypeSelected = useCallback(() => {
    setShowDayTypePicker(false);
    setToggleDayConfirm({ dayIndex: selectedDayIndex, isRest: false });
  }, [selectedDayIndex]);

  const confirmToggleDay = useCallback(async () => {
    if (!toggleDayConfirm || !weekPlan) return;
    try {
      const payload: { week: number; dayOfWeek: number; dayType?: string } = {
        week: weekPlan.week,
        dayOfWeek: toggleDayConfirm.dayIndex,
      };
      if (!toggleDayConfirm.isRest && selectedDayType)
        payload.dayType = selectedDayType;
      await planApi.toggleDayType(payload);
      const updatedPlan = await refreshPlan();
      if (updatedPlan) {
        const dayPlan = updatedPlan.trainingDays.find(
          (d) => d.dayOfWeek === selectedDayIndex,
        );
        setTodayPlanDirectly(dayPlan);
      }
    } catch (err) {
      console.error("Не удалось изменить тип дня:", err);
    } finally {
      setToggleDayConfirm(null);
    }
  }, [
    toggleDayConfirm,
    weekPlan,
    selectedDayType,
    selectedDayIndex,
    refreshPlan,
    setTodayPlanDirectly,
  ]);

  const handleAddExercise = useCallback(
    async (exercise: Exercise) => {
      if (!weekPlan || !selectedDay) return;
      try {
        await planApi.addExerciseToPlan({
          planId: weekPlan.planId as string,
          exerciseId: exercise.id,
          dayOfWeek: selectedDayIndex,
          sets: 3,
          repsRange: [8, 10],
        });
        setShowExercisePicker(false);
        const updatedPlan = await refreshPlan();
        if (updatedPlan)
          setTodayPlanDirectly(
            updatedPlan.trainingDays.find(
              (d) => d.dayOfWeek === selectedDayIndex,
            ),
          );
      } catch (err) {
        console.error("Не удалось добавить упражнение:", err);
      }
    },
    [
      weekPlan,
      selectedDay,
      selectedDayIndex,
      refreshPlan,
      setTodayPlanDirectly,
    ],
  );

  const handleRemoveExercise = useCallback(
    async (exerciseId: string) => {
      if (!weekPlan?.planId) return;
      try {
        await planApi.removeExerciseFromPlan(
          exerciseId,
          weekPlan.planId,
          selectedDayIndex,
        );
        const updatedPlan = await refreshPlan();
        if (updatedPlan)
          setTodayPlanDirectly(
            updatedPlan.trainingDays.find(
              (d) => d.dayOfWeek === selectedDayIndex,
            ),
          );
      } catch (err) {
        console.error("Не удалось удалить упражнение:", err);
      }
    },
    [weekPlan, refreshPlan, selectedDayIndex, setTodayPlanDirectly],
  );

  // Долгое нажатие для удаления на мобильных
  const handleTouchStart = useCallback(
    (exerciseId: string) => {
      const timer = setTimeout(() => {
        if (window.confirm("Удалить упражнение из плана?"))
          handleRemoveExercise(exerciseId);
      }, 600);
      setLongPressTimer(timer);
    },
    [handleRemoveExercise],
  );

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  }, [longPressTimer]);

  useEffect(() => {
    selectDay(selectedDayIndex);
  }, [selectedDayIndex]);
  const handleToggleSplit = useCallback(
    () => setShowSplitSelector(!showSplitSelector),
    [showSplitSelector],
  );

  if (localError)
    return (
      <InfoPage
        type={localError.type}
        message={localError.message}
        retryAction={() => retryWithReload(() => setLocalError(null))}
      />
    );
  if (loadingProfile || loadingPlan || planGenerationLoading)
    return (
      <div className="training-page__loading">
        <InfoPage type="loading" />
      </div>
    );

  if (weekPlan) {
    return (
      <div className="training-page">
        <div className="training-page__plan">
          <div className="training-page__plan-header">
            <h1 className="training-page__plan-title">
              Недельный план: {getSplitNameRu(weekPlan.split.name)}
            </h1>
            <p className="training-page__plan-subtitle">
              Неделя {weekPlan.week}
            </p>
            <div className="training-page__plan-actions">
              {isNextWeekPlanStale && (
                <button
                  className="training-page__generate-next-week-btn"
                  onClick={async () => {
                    setPlanGenerationLoading(true);
                    await generatePlan({ forcingNewWeek: false });
                    setPlanGenerationLoading(false);
                  }}
                  disabled={loadingPlan}
                  type="button">
                  Создать план на следующую неделю
                </button>
              )}
              <button
                className="training-page__delete-plan-btn"
                onClick={async () => {
                  if (
                    window.confirm(
                      "Текущий план будет удалён НАВСЕГДА. Создать новый?",
                    )
                  ) {
                    setPlanGenerationLoading(true);
                    await deletePlan();
                    setPlanGenerationLoading(false);
                  }
                }}
                type="button">
                🗑 Создать новый план
              </button>
            </div>
          </div>

          <div className="training-page__calendar">
            {dayNames.map((dayName, idx) => {
              const dayPlan = allTrainingDays.find((d) => d.dayOfWeek === idx);
              return (
                <div
                  key={idx}
                  className={`training-page__day-cell ${idx === today.dayIndex ? "training-page__day-cell--today" : ""} ${idx === selectedDayIndex ? "training-page__day-cell--selected" : ""}`}
                  onClick={() => setSelectedDayIndex(idx)}>
                  <span className="training-page__day-name">{dayName}</span>
                  {dayPlan ? (
                    <span className="training-page__day-type">
                      {getDayTypeRu(dayPlan.dayType)}
                    </span>
                  ) : (
                    <span className="training-page__day-status">Отдых</span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="training-page__today">
            <div className="training-page__today-header">
              <h2 className="training-page__today-day">
                {dayFullNames[selectedDayIndex]}
                {selectedDayIndex === today.dayIndex && " (сегодня)"}
              </h2>
              <button
                className="training-page__toggle-day-link"
                onClick={handleToggleDayType}
                type="button">
                {isSelectedDayTraining
                  ? "Отменить тренировку?"
                  : "Устроить тренировку?"}
              </button>
            </div>

            {selectedDayIndex === today.dayIndex && (
              <div className="training-page__today-controls">
                <div className="training-page__current-wellbeing">
                  <span className="training-page__current-wellbeing-label">
                    Самочувствие:
                  </span>
                  <span
                    className={`training-page__current-wellbeing-badge training-page__current-wellbeing-badge--${wellbeing.toLowerCase()}`}>
                    {wellbeing === "BAD"
                      ? "😷 Плохо"
                      : wellbeing === "NORMAL"
                        ? "🙂 Нормально"
                        : "💪 Отлично"}
                  </span>
                </div>
                <button
                  className="training-page__change-wellbeing-btn"
                  onClick={openWellbeingModal}
                  type="button">
                  Перевыбрать
                </button>
              </div>
            )}

            {loadingTodayPlan && selectedDayIndex === today.dayIndex ? (
              <p className="training-page__today-message">
                Загружаем план на сегодня...
              </p>
            ) : selectedDay ? (
              <>
                <p className="training-page__today-message">
                  План на день: {getDayTypeRu(selectedDay.dayType)}
                </p>
                {selectedDay.exercises.length > 0 ? (
                  <div className="training-page__today-exercises">
                    <AnimatePresence>
                      {selectedDay.exercises.map((ex) => {
                        const exercise = exercises.find(
                          (e) => e.id === ex.exerciseId,
                        );
                        const isForced =
                          ex.forced || leastFavoriteIds.has(ex.exerciseId);
                        const forcedMessage =
                          ex.forcedReason === "all_excluded"
                            ? "Исключено слишком много упражнений — план составлен из необходимого минимума"
                            : "Это упражнение обязательно для данного сплита и не может быть исключено";

                        return (
                          <motion.div
                            key={ex.exerciseId}
                            className="training-page__today-exercise"
                            layout
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{
                              opacity: 0,
                              x: 50,
                              height: 0,
                              margin: 0,
                              padding: 0,
                              borderWidth: 0,
                            }}
                            transition={{
                              type: "spring",
                              stiffness: 300,
                              damping: 25,
                            }}
                            onClick={() => {
                              if (exercise) setSelectedExercise(exercise);
                            }}
                            onTouchStart={() => handleTouchStart(ex.exerciseId)}
                            onTouchEnd={handleTouchEnd}
                            onTouchMove={handleTouchEnd}>
                            <div className="training-page__today-exercise-left">
                              <span className="training-page__exercise-name">
                                {exercise?.name || "Неизвестное упражнение"}
                                {isForced && !isMobile && (
                                  <InfoTooltip message={forcedMessage} />
                                )}
                              </span>
                              {isForced && isMobile && (
                                <span className="training-page__exercise-forced-badge">
                                  ⚠️ обязательно
                                </span>
                              )}
                              {exercise?.secondaryMuscles?.[0] && (
                                <span className="training-page__exercise-muscle">
                                  {MUSCLE_GROUP_LABELS[
                                    exercise.secondaryMuscles[0]
                                  ] ||
                                    MUSCLE_GROUP_LABELS[
                                      exercise.primaryMuscleGroup
                                    ]}
                                </span>
                              )}
                            </div>
                            <div className="training-page__today-exercise-right">
                              <span className="training-page__exercise-info">
                                {ex.sets}×{ex.targetRepsRange[0]}–
                                {ex.targetRepsRange[1]}
                              </span>
                              {!isMobile && (
                                <button
                                  className="training-page__exercise-remove-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveExercise(ex.exerciseId);
                                  }}
                                  type="button"
                                  title="Удалить из плана">
                                  ✕
                                </button>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                    <button
                      className="training-page__today-exercise training-page__today-exercise--add"
                      onClick={() => setShowExercisePicker(true)}
                      type="button">
                      <span className="training-page__add-icon">+</span>
                    </button>
                  </div>
                ) : (
                  <div className="training-page__today-exercises">
                    <button
                      className="training-page__today-exercise training-page__today-exercise--add"
                      onClick={() => setShowExercisePicker(true)}
                      type="button">
                      <span className="training-page__add-icon">+</span>
                    </button>
                  </div>
                )}
              </>
            ) : (
              <p className="training-page__today-rest">
                Отдых — можно бег, прогулку или лёгкую растяжку 🌿
              </p>
            )}
          </div>
        </div>

        {/* Модалки — без изменений */}
        {showWellbeingModal && (
          <div className="training-page__modal-overlay">
            <div className="training-page__modal">
              <h2 className="training-page__modal-title">
                Как самочувствие сегодня?
              </h2>
              <div className="training-page__modal-buttons">
                <button
                  className={`training-page__modal-btn ${wellbeing === "BAD" ? "training-page__modal-btn--selected" : ""}`}
                  onClick={() => handleWellbeingChange("BAD")}
                  type="button">
                  😷 Плохо
                </button>
                <button
                  className={`training-page__modal-btn ${wellbeing === "NORMAL" ? "training-page__modal-btn--selected" : ""}`}
                  onClick={() => handleWellbeingChange("NORMAL")}
                  type="button">
                  🙂 Нормально
                </button>
                <button
                  className={`training-page__modal-btn ${wellbeing === "GOOD" ? "training-page__modal-btn--selected" : ""}`}
                  onClick={() => handleWellbeingChange("GOOD")}
                  type="button">
                  💪 Отлично
                </button>
              </div>
            </div>
          </div>
        )}
        {showWellbeingWarning && (
          <div className="training-page__warning-overlay">
            <div className="training-page__warning-modal">
              <p className="training-page__warning-text">
                {wellbeingWarningAction === "GOOD"
                  ? "План станет сложнее. Продолжить?"
                  : "План станет проще. Продолжить?"}
              </p>
              <div className="training-page__warning-buttons">
                <button
                  className="training-page__warning-btn training-page__warning-btn--confirm"
                  onClick={confirmWellbeingChange}>
                  Да
                </button>
                <button
                  className="training-page__warning-btn"
                  onClick={dismissWellbeingWarning}>
                  Нет
                </button>
              </div>
            </div>
          </div>
        )}
        {selectedExercise && (
          <ExerciseDetailModal
            exercise={selectedExercise}
            onClose={() => setSelectedExercise(null)}
            forced={
              selectedDay?.exercises.find(
                (e) => e.exerciseId === selectedExercise.id,
              )?.forced
            }
            forcedReason={
              selectedDay?.exercises.find(
                (e) => e.exerciseId === selectedExercise.id,
              )?.forcedReason
            }
          />
        )}
        {showExercisePicker && (
          <ExercisePickerModal
            exercises={allExercises || []}
            onSelect={handleAddExercise}
            onClose={() => setShowExercisePicker(false)}
            existingExerciseIds={
              selectedDay?.exercises.map((e) => e.exerciseId) || []
            }
          />
        )}
        {showDayTypePicker && (
          <div className="training-page__modal-overlay">
            <div className="training-page__modal">
              <h2 className="training-page__modal-title">
                Какой тип тренировки?
              </h2>
              <p className="training-page__modal-subtitle">
                Выберите тип тренировки для этого дня
              </p>
              <div className="training-page__modal-buttons">
                {availableDayTypes.map((dayType) => (
                  <button
                    key={dayType.value}
                    className={`training-page__modal-btn ${selectedDayType === dayType.value ? "training-page__modal-btn--selected" : ""}`}
                    onClick={() => setSelectedDayType(dayType.value)}
                    type="button">
                    {dayType.label}
                  </button>
                ))}
              </div>
              <div className="training-page__modal-actions">
                <button
                  className="training-page__warning-btn training-page__warning-btn--confirm"
                  onClick={handleDayTypeSelected}
                  type="button">
                  Продолжить
                </button>
                <button
                  className="training-page__warning-btn"
                  onClick={() => setShowDayTypePicker(false)}
                  type="button">
                  Отмена
                </button>
              </div>
            </div>
          </div>
        )}
        {toggleDayConfirm && (
          <div
            className="training-page__warning-overlay"
            onClick={() => setToggleDayConfirm(null)}>
            <div
              className="training-page__warning-modal"
              onClick={(e) => e.stopPropagation()}>
              <p className="training-page__warning-text">
                {toggleDayConfirm.isRest
                  ? `⚠️ В плане у Вас день отдыха. Добавление дополнительной тренировки ${selectedDayType ? `типа "${selectedDayType}"` : ""} может сказаться на восстановлении организма. Продолжить?`
                  : "⚠️ Текущий план на этот день будет удалён. Сделать этот день выходным?"}
              </p>
              <div className="training-page__warning-buttons">
                <button
                  className="training-page__warning-btn training-page__warning-btn--confirm"
                  onClick={confirmToggleDay}>
                  Да
                </button>
                <button
                  className="training-page__warning-btn"
                  onClick={() => {
                    setToggleDayConfirm(null);
                    setSelectedDayType("");
                  }}>
                  Нет
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const selectedOption = SPLIT_OPTIONS.find((s) => s.value === selectedSplit);
  return (
    <div className="training-page__no-plan">
      <div className="training-page__profile">
        <h3 className="training-page__profile-title">Ваши данные</h3>
        <div className="training-page__profile-grid">
          <div className="training-page__profile-card">
            <span className="training-page__profile-card-icon">🎂</span>
            <span className="training-page__profile-card-label">Возраст</span>
            <span
              className={`training-page__profile-card-value ${!profile?.age ? "training-page__profile-card-value--empty" : ""}`}>
              {profile?.age ? `${profile.age} лет` : "Не указан"}
            </span>
          </div>
          <div className="training-page__profile-card">
            <span className="training-page__profile-card-icon">⚖️</span>
            <span className="training-page__profile-card-label">Вес</span>
            <span
              className={`training-page__profile-card-value ${!profile?.weight ? "training-page__profile-card-value--empty" : ""}`}>
              {profile?.weight ? `${profile.weight} кг` : "Не указан"}
            </span>
          </div>
          <div className="training-page__profile-card">
            <span className="training-page__profile-card-icon">📏</span>
            <span className="training-page__profile-card-label">Рост</span>
            <span
              className={`training-page__profile-card-value ${!profile?.height ? "training-page__profile-card-value--empty" : ""}`}>
              {profile?.height ? `${profile.height} см` : "Не указан"}
            </span>
          </div>
          <div className="training-page__profile-card">
            <span className="training-page__profile-card-icon">🎯</span>
            <span className="training-page__profile-card-label">Цель</span>
            <span
              className={`training-page__profile-card-value ${!profile?.goal ? "training-page__profile-card-value--empty" : ""}`}>
              {profile?.goal ?? "Не указана"}
            </span>
          </div>
          <div className="training-page__profile-card">
            <span className="training-page__profile-card-icon">🚶</span>
            <span className="training-page__profile-card-label">
              Образ жизни
            </span>
            <span
              className={`training-page__profile-card-value ${!profile?.lifestyle ? "training-page__profile-card-value--empty" : ""}`}>
              {profile?.lifestyle ?? "Не указан"}
            </span>
          </div>
          <div
            className={`training-page__profile-card ${!profile?.bmi ? "training-page__profile-card--warning" : ""}`}>
            <span className="training-page__profile-card-icon">📊</span>
            <span className="training-page__profile-card-label">BMI</span>
            <span
              className={`training-page__profile-card-value ${!profile?.bmi ? "training-page__profile-card-value--empty" : ""}`}>
              {profile?.bmi
                ? `${profile.bmi.toFixed(1)} (${profile.bmiCategory})`
                : "Не рассчитан"}
            </span>
          </div>
        </div>
      </div>
      {isProfileIncomplete && (
        <p className="training-page__error">
          Перед тем как создать план — полностью заполните профиль
        </p>
      )}
      <div className="training-page__controls">
        <div className="training-page__split-selector">
          <button
            ref={splitToggleRef}
            className="training-page__split-toggle"
            onClick={handleToggleSplit}
            type="button">
            <span className="training-page__split-toggle-label">
              Тип сплита:
            </span>
            <span className="training-page__split-toggle-value">
              {selectedOption?.label}
            </span>
            <span
              className={`training-page__split-toggle-arrow ${showSplitSelector ? "open" : ""}`}>
              ▼
            </span>
          </button>
          {showSplitSelector && (
            <div
              ref={dropdownRef}
              className="training-page__split-dropdown dropdown--down">
              {SPLIT_OPTIONS.map((split) => (
                <button
                  key={split.value}
                  className={`training-page__split-option ${selectedSplit === split.value ? "selected" : ""}`}
                  onClick={() => {
                    if (
                      split.value !== "recommended" &&
                      !requirePremium(user?.role)
                    )
                      return;
                    setSelectedSplit(split.value);
                    setShowSplitSelector(false);
                  }}
                  type="button">
                  <span className="training-page__split-option-label">
                    {split.label}
                  </span>
                  <span className="training-page__split-option-desc">
                    {split.description}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          className="training-page__generate-btn"
          onClick={async () => {
            setPlanGenerationLoading(true);
            await generatePlan({
              forcingNewWeek: false,
              preferredSplit:
                selectedSplit === "recommended" ? undefined : selectedSplit,
            });
            setPlanGenerationLoading(false);
          }}
          disabled={loadingPlan || isProfileIncomplete}
          type="button">
          {loadingPlan
            ? "Создаём план..."
            : isProfileIncomplete
              ? "План не доступен — профиль не заполнен"
              : selectedSplit === "recommended"
                ? "✨ Создать индивидуальный план на неделю"
                : `Создать план (${selectedOption?.label})`}
        </button>
      </div>
    </div>
  );
}
