// TrainingPage.tsx
import "./TrainingPage.scss";

import { useProfile } from "@/shared/hooks/useProfile";
import { useTrainingPlan } from "@/shared/hooks/useTrainingPlan";
import { getSplitNameRu, getDayTypeRu } from "@/lib/utils";
import { InfoPage } from "@/shared/ui/components/ErrorUI/ui/InfoPage";
import type { ErrorType } from "@/shared/ui/components/ErrorUI/model/types";
import { useCallback, useState } from "react";

/**
 * Страница просмотра недельного плана и тренировок на сегодня.
 *
 * Поведение:
 * - Если план не сгенерирован → профиль и кнопка “Создать план”.
 * - Если план есть → календарь + “План на сегодня”.
 * - Если с момента создания плана прошло более 7 дней → кнопка
 *   “Создать план на следующую неделю”.
 */
export function TrainingPage() {
  const {
    // Текущий план и день
    weekPlan,
    todayPlan,
    exercises,
    today,
    wellbeing,
    // Статусы загрузки
    loadingPlan,
    loadingTodayPlan,
    // Логика формы
    isProfileIncomplete,
    // Работа с планами
    generatePlan,
    selectDay,
    // Wellbeing‑модалки
    showWellbeingModal,
    showWellbeingWarning,
    wellbeingWarningAction,
    handleWellbeingChange,
    confirmWellbeingChange,
    openWellbeingModal,
    // Логика устаревания плана
    isNextWeekPlanStale,
  } = useTrainingPlan();

  const { profile, loadingProfile } = useProfile();

  // ==================== STATE: локальные ошибки ====================
  const [localError, setLocalError] = useState<{
    type: ErrorType;
    message?: string;
  } | null>(null);

  // ==================== RETRY ====================
  const handleRetry = useCallback(() => {
    setLocalError(null);
    window.location.reload();
  }, []);

  // ==================== ERROR VIEW ====================
  if (localError) {
    return (
      <InfoPage
        type={localError.type}
        message={localError.message}
        retryAction={handleRetry}
      />
    );
  }

  // ==================== LOADING STATES ====================
  if (loadingProfile || loadingPlan) {
    return (
      <div className="training-page__loading">
        <InfoPage type="loading" />
      </div>
    );
  }

  // ==================== RENDER: ПЛАН СГЕНЕРИРОВАН ====================
  if (weekPlan) {
    return (
      <div className="training-page">
        <div className="training-page__plan">
          {/* Заголовок плана */}
          <div className="training-page__plan-header">
            <h1 className="training-page__plan-title">
              Недельный план: {getSplitNameRu(weekPlan.split.name)}
            </h1>
            <p className="training-page__plan-subtitle">
              Неделя {weekPlan.week}
            </p>

            {/* Кнопка: если прошло >7 дней от создания плана */}
            {isNextWeekPlanStale && (
              <button
                className="training-page__generate-next-week-btn"
                onClick={() => generatePlan({ forcingNewWeek: true })}
                disabled={loadingPlan}
                type="button">
                Создать план на следующую неделю
              </button>
            )}
          </div>

          {/* Блок «План на сегодня» */}
          <div className="training-page__today">
            <h2 className="training-page__today-day">
              {todayPlan?.today
                ? [
                    "Понедельник",
                    "Вторник",
                    "Среда",
                    "Четверг",
                    "Пятница",
                    "Суббота",
                    "Воскресенье",
                  ][todayPlan.today.dayIndex]
                : "Неизвестный день"}
            </h2>

            {/* Wellbeing — только если это сегодня */}
            {todayPlan?.today?.dayIndex === today.dayIndex && (
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

            {loadingTodayPlan ? (
              <p className="training-page__today-message">
                Загружаем план на сегодня...
              </p>
            ) : (
              <p className="training-page__today-message">
                {todayPlan?.today?.exercises.length
                  ? "План на сегодня:"
                  : "Сегодня можете отдохнуть :)"}
              </p>
            )}

            {/* Упражнения на сегодня */}
            <div className="training-page__today-exercises">
              {todayPlan?.today?.exercises?.length ? (
                todayPlan.today.exercises.map((ex, idx) => {
                  const exercise = exercises.find(
                    (e) => e.id === ex.exerciseId,
                  );
                  return (
                    <div key={idx} className="training-page__today-exercise">
                      <span className="training-page__exercise-name">
                        {exercise?.name || "Неизвестное упражнение"}
                      </span>
                      <span className="training-page__exercise-info">
                        {ex.sets} подхода × {ex.targetRepsRange[0]}–
                        {ex.targetRepsRange[1]} повторений
                      </span>
                    </div>
                  );
                })
              ) : (
                <p className="training-page__today-rest">
                  Отдых — можно бег, прогулку или лёгкую растяжку 🌿
                </p>
              )}
            </div>
          </div>

          {/* Календарь недели */}
          <div className="training-page__calendar">
            {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((dayName, idx) => {
              const dayIndex = idx;
              const dayPlan = weekPlan.trainingDays?.find(
                (day) => day.dayOfWeek === dayIndex,
              );

              return (
                <div
                  key={dayIndex}
                  className={`training-page__day-cell ${
                    todayPlan?.today?.dayIndex === dayIndex
                      ? "training-page__day-cell--selected"
                      : ""
                  }`}
                  onClick={() => selectDay(dayIndex)}>
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
        </div>

        {/* Wellbeing модалки */}
        {showWellbeingModal && (
          <div
            className="training-page__modal-overlay"
            onClick={() => {
              /* управление внутри хука */
            }}>
            <div className="training-page__modal">
              <h2 className="training-page__modal-title">
                Как самочувствие сегодня?
              </h2>
              <div className="training-page__modal-buttons">
                <button
                  className={`training-page__modal-btn ${
                    wellbeing === "BAD"
                      ? "training-page__modal-btn--selected"
                      : ""
                  }`}
                  onClick={() => handleWellbeingChange("BAD")}
                  type="button">
                  😷 Плохо
                </button>
                <button
                  className={`training-page__modal-btn ${
                    wellbeing === "NORMAL"
                      ? "training-page__modal-btn--selected"
                      : ""
                  }`}
                  onClick={() => handleWellbeingChange("NORMAL")}
                  type="button">
                  🙂 Нормально
                </button>
                <button
                  className={`training-page__modal-btn ${
                    wellbeing === "GOOD"
                      ? "training-page__modal-btn--selected"
                      : ""
                  }`}
                  onClick={() => handleWellbeingChange("GOOD")}
                  type="button">
                  💪 Отлично
                </button>
              </div>
            </div>
          </div>
        )}

        {showWellbeingWarning && (
          <div
            className="training-page__warning-overlay"
            onClick={() => {
              /* управление внутри хука */
            }}>
            <div className="training-page__warning-modal">
              <p className="training-page__warning-text">
                {wellbeingWarningAction === "GOOD"
                  ? "План станет сложнее?"
                  : "План станет проще?"}
              </p>
              <button
                className="training-page__warning-btn"
                onClick={confirmWellbeingChange}>
                Да
              </button>
              <button
                className="training-page__warning-btn"
                onClick={() => {
                  /* управление внутри хука */
                }}>
                Нет
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==================== RENDER: ПЛАН НЕ СГЕНЕРИРОВАН ====================
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
          onClick={() => generatePlan({ forcingNewWeek: false })}
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
