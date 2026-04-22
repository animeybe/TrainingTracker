import "./TrainingPage.scss";
import { useProfile } from "@/shared/hooks/useProfile";
import { useTrainingPlan } from "@/shared/hooks/useTrainingPlan";
import { getSplitNameRu, getDayTypeRu } from "@/lib/utils";
import { InfoPage } from "@/shared/ui/components/ErrorUI/ui/InfoPage";
import type { ErrorType } from "@/shared/ui/components/ErrorUI/model/types";
// import type { ProfileData, Exercise } from "@/shared/api/types";
// import { logger } from "@/lib/utils/logger";
import { useCallback, useState } from "react";

export function TrainingPage() {
  // 🔥 ХУКИ — вся логика здесь!
  const { profile, loadingProfile } = useProfile();
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
  } = useTrainingPlan(1);

  // ==================== ERROR STATE ====================
  const [localError, setLocalError] = useState<{
    type: ErrorType;
    message?: string;
  } | null>(null);

  // ==================== RETRY ====================
  const handleRetry = useCallback(() => {
    setLocalError(null);
    window.location.reload(); // Простой рестарт
  }, []);

  if (localError) {
    return (
      <InfoPage
        type={localError.type}
        message={localError.message}
        retryAction={handleRetry}
      />
    );
  }

  // ==================== LOADING ====================
  if (loadingProfile || loadingPlan) {
    return (
      <div className="training-page__loading">
        <InfoPage type="loading" />
      </div>
    );
  }

  // ==================== RENDER ====================
  return (
    <div className="training-page">
      {/* 1️⃣ ПЛАН ЕСТЬ = календарь + today */}
      {weekPlan ? (
        <div className="training-page__plan">
          {/* Заголовок плана */}
          <div className="training-page__plan-header">
            <h1 className="training-page__plan-title">
              Недельный план: {getSplitNameRu(weekPlan.split.name)}
            </h1>
            <p className="training-page__plan-subtitle">
              Неделя {weekPlan.week}
            </p>
          </div>

          {/* 📅 Сегодняшний день */}
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

            {/* Перевыбрать wellbeing (только сегодня) */}
            {todayPlan?.today?.dayIndex === today.dayIndex && (
              <div className="training-page__today-controls">
                <div className="training-page__current-wellbeing">
                  <span className="current-wellbeing-label">Самочувствие:</span>
                  <span
                    className={`current-wellbeing-badge wellbeing-${wellbeing.toLowerCase()}`}>
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

            {/* Упражнения */}
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

          {/* 📊 Календарь */}
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
      ) : (
        /* 2️⃣ ПЛАНА НЕТ = профиль + кнопка генерации */
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
              onClick={generatePlan}
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
      )}

      {/* 🩺 МОДАЛКА WELLBEING */}
      {showWellbeingModal && (
        <div
          className="training-page__modal-overlay"
          onClick={() => {} /* Хук управляет */}>
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

      {/* ⚠️ ПОДТВЕРЖДЕНИЕ BAD/GOOD */}
      {showWellbeingWarning && (
        <div
          className="training-page__warning-overlay"
          onClick={() => {} /* Хук управляет */}>
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
              onClick={() => {} /* Хук управляет */}>
              Нет
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
