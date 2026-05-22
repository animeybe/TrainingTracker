// TrainingPage.tsx
import "./TrainingPage.scss";

import { useProfile } from "@/shared/hooks/useProfile";
import { useTrainingPlan } from "@/shared/hooks/useTrainingPlan";
import { getSplitNameRu, getDayTypeRu } from "@/lib/utils";
import { InfoPage } from "@/shared/ui/components/ErrorUI/ui/InfoPage";
import type { ErrorType } from "@/shared/ui/components/ErrorUI/model/types";
import { useCallback, useState, useMemo } from "react";
import type { TrainingDay } from "@/shared/api/types";

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
    selectDay,
    showWellbeingModal,
    showWellbeingWarning,
    wellbeingWarningAction,
    handleWellbeingChange,
    confirmWellbeingChange,
    openWellbeingModal,
    isNextWeekPlanStale,
    dismissWellbeingWarning,
  } = useTrainingPlan();

  const { profile, loadingProfile } = useProfile();

  const [planGenerationLoading, setPlanGenerationLoading] =
    useState<boolean>(false);

  const [localError, setLocalError] = useState<{
    type: ErrorType;
    message?: string;
  } | null>(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(
    today.dayIndex,
  );

  const handleRetry = useCallback(() => {
    setLocalError(null);
    window.location.reload();
  }, []);

  // Извлекаем данные из обёрток
  const todayData = todayPlan?.data?.today ?? null;

  // Все тренировочные дни из плана
  const allTrainingDays = useMemo(
    () => weekPlan?.trainingDays ?? [],
    [weekPlan],
  );

  // Выбранный день (из календаря или сегодня)
  const selectedDay: TrainingDay | null = useMemo(() => {
    if (selectedDayIndex === today.dayIndex && todayData) {
      return todayData;
    }
    return (
      allTrainingDays.find((d) => d.dayOfWeek === selectedDayIndex) ?? null
    );
  }, [selectedDayIndex, today.dayIndex, todayData, allTrainingDays]);

  // Дни недели для календаря
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

  if (localError) {
    return (
      <InfoPage
        type={localError.type}
        message={localError.message}
        retryAction={handleRetry}
      />
    );
  }

  if (loadingProfile || loadingPlan || planGenerationLoading) {
    return (
      <div className="training-page__loading">
        <InfoPage type="loading" />
      </div>
    );
  }

  // ==================== ПЛАН СГЕНЕРИРОВАН ====================
  if (weekPlan) {
    return (
      <div className="training-page">
        <div className="training-page__plan">
          {/* Заголовок */}
          <div className="training-page__plan-header">
            <h1 className="training-page__plan-title">
              Недельный план: {getSplitNameRu(weekPlan.split.name)}
            </h1>
            <p className="training-page__plan-subtitle">
              Неделя {weekPlan.week}
            </p>

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
          </div>

          {/* Календарь недели */}
          <div className="training-page__calendar">
            {dayNames.map((dayName, idx) => {
              const dayPlan = allTrainingDays.find((d) => d.dayOfWeek === idx);
              const isToday = idx === today.dayIndex;
              const isSelected = idx === selectedDayIndex;

              return (
                <div
                  key={idx}
                  className={`training-page__day-cell ${isToday ? "training-page__day-cell--today" : ""} ${isSelected ? "training-page__day-cell--selected" : ""}`}
                  onClick={() => {
                    setSelectedDayIndex(idx);
                    selectDay(idx);
                  }}>
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

          {/* Выбранный день */}
          <div className="training-page__today">
            <h2 className="training-page__today-day">
              {dayFullNames[selectedDayIndex]}
              {selectedDayIndex === today.dayIndex && " (сегодня)"}
            </h2>

            {/* Wellbeing — только для сегодня */}
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
                  {selectedDay.exercises.length > 0
                    ? `План на день: ${getDayTypeRu(selectedDay.dayType)}`
                    : "День отдыха"}
                </p>

                {/* Упражнения выбранного дня */}
                {selectedDay.exercises.length > 0 && (
                  <div className="training-page__today-exercises">
                    {selectedDay.exercises.map((ex, idx) => {
                      const exercise = exercises.find(
                        (e) => e.id === ex.exerciseId,
                      );
                      return (
                        <div
                          key={idx}
                          className="training-page__today-exercise">
                          <span className="training-page__exercise-name">
                            {exercise?.name || "Неизвестное упражнение"}
                          </span>
                          <span className="training-page__exercise-info">
                            {ex.sets} подхода × {ex.targetRepsRange[0]}–
                            {ex.targetRepsRange[1]} повторений
                          </span>
                        </div>
                      );
                    })}
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

        {/* Wellbeing модалка */}
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

        {/* Wellbeing предупреждение */}
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
      </div>
    );
  }

  // ==================== ПЛАН НЕ СГЕНЕРИРОВАН ====================
  return (
    <div className="training-page__no-plan">
      <div className="training-page__profile">
        <h3 className="training-page__profile-title">Ваши данные</h3>
        <div className="training-page__profile-row">
          <span className="training-page__profile-label">Возраст:</span>
          <span>{profile?.age ?? "Пока пусто"}</span>
        </div>
        <div className="training-page__profile-row">
          <span className="training-page__profile-label">Вес:</span>
          <span>{profile?.weight ?? "Пока пусто"} кг</span>
        </div>
        <div className="training-page__profile-row">
          <span className="training-page__profile-label">Рост:</span>
          <span>{profile?.height ?? "Пока пусто"} см</span>
        </div>
        <div className="training-page__profile-row">
          <span className="training-page__profile-label">Цель:</span>
          <span>{profile?.goal ?? "Пока не указана"}</span>
        </div>
        <div className="training-page__profile-row">
          <span className="training-page__profile-label">Образ жизни:</span>
          <span>{profile?.lifestyle ?? "Пока не указан"}</span>
        </div>
        <div className="training-page__profile-row">
          <span className="training-page__profile-label">BMI:</span>
          <span>
            {profile?.bmi?.toFixed(1) ?? "Не расчитан"} (
            {profile?.bmiCategory ?? "–"})
          </span>
        </div>
      </div>

      {isProfileIncomplete && (
        <p className="training-page__error">
          Перед тем как создать план — полностью заполните профиль
        </p>
      )}

      <div className="training-page__controls">
        <button
          className="training-page__generate-btn"
          onClick={async () => {
            setPlanGenerationLoading(true);
            await generatePlan({ forcingNewWeek: false });
            setPlanGenerationLoading(false);
          }}
          disabled={loadingPlan || isProfileIncomplete}
          type="button">
          {loadingPlan
            ? "Создаём план..."
            : isProfileIncomplete
              ? "План не доступен — профиль не заполнен"
              : "Создать индивидуальный план на неделю"}
        </button>
      </div>
    </div>
  );
}
