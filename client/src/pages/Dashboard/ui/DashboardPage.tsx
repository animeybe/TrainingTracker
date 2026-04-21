// pages/DashboardPage.tsx
import { useTheme } from "@/shared/store";
import "./DashboardPage.scss";
import { useSafeAuthContext } from "@/shared/hooks/useSafeAuth";
import { formatRussianDate } from "@/lib/utils/dates";
import sunIcon from "@/assets/icon/sun.svg";
import moonIcon from "@/assets/icon/moon.svg";
import { useState, useCallback, useMemo } from "react";
import type { ProfileData } from "@/shared/api/types";
import { ProfileEditModal } from "@/shared/ui/blocks/ProfileEditModal";
import { useNavigate } from "react-router-dom";
import { useProfile } from "@/shared/hooks/useProfile";
import { logger } from "@/lib/utils/logger";
import { InfoPage } from "@/shared/ui/components/ErrorUI/ui/InfoPage";
import type { ErrorType } from "@/shared/ui/components/ErrorUI/model/types";

// ======================================================================
// 🔧 УТИЛИТЫ
// ======================================================================

/**
 * Создает пустой профиль для fallback UI
 */
const createEmptyProfile = (userId: string = ""): ProfileData => ({
  id: "",
  userId,
  weight: null,
  height: null,
  age: null,
  lifestyle: null!,
  goal: null!,
  bmi: null,
  bmiCategory: "NOT_SET",
  isWeightSet: false,
  isHeightSet: false,
  isAgeSet: false,
  isLifestyleSet: false,
  isGoalSet: false,
  createdAt: "",
  updatedAt: "",
});

// ======================================================================
// 🎯 ОСНОВНОЙ КОМПОНЕНТ
// ======================================================================

export function DashboardPage() {
  // ==================== CONTEXTS & HOOKS ====================
  const { theme, toggleTheme } = useTheme();
  const { user, refreshUser } = useSafeAuthContext();
  const { profile, loading, reloadProfile } = useProfile();
  const navigate = useNavigate();

  // ==================== STATE ====================
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [localError, setLocalError] = useState<{
    type: ErrorType;
    message?: string;
  } | null>(null);

  // ==================== COMPUTED ====================
  /**
   * Эффективный профиль (реальный или fallback)
   */
  const effectiveProfile = useMemo(() => {
    if (profile) return profile;
    logger.debug("Using empty profile fallback");
    return createEmptyProfile(user?.id || "");
  }, [profile, user?.id]);

  /**
   * Проверка полноты профиля
   */
  const isProfileComplete = useMemo(() => {
    return (
      effectiveProfile.weight != null &&
      effectiveProfile.weight > 0 &&
      effectiveProfile.height != null &&
      effectiveProfile.height > 0 &&
      effectiveProfile.age != null &&
      effectiveProfile.age > 0 &&
      effectiveProfile.goal != null &&
      effectiveProfile.lifestyle != null
    );
  }, [
    effectiveProfile.weight,
    effectiveProfile.height,
    effectiveProfile.age,
    effectiveProfile.goal,
    effectiveProfile.lifestyle,
  ]);

  /**
   * TDEE + БЖУ
   */
  const nutritionStats = useMemo(() => {
    if (
      !effectiveProfile.weight ||
      !effectiveProfile.height ||
      !effectiveProfile.age
    )
      return { tdee: "—", macros: "— / — / —" };

    const weight = effectiveProfile.weight;
    const height = effectiveProfile.height;
    const age = effectiveProfile.age;

    // !!! ЗАГЛУШКА: сдлеано для МУЖЧИНА !!!
    // TODO: Добавить gender!
    const bmr = 88.362 + 13.397 * weight + 4.799 * height - 5.677 * age;

    const multipliers = {
      SEDENTARY: 1.2,
      LIGHT: 1.375,
      MODERATE: 1.55,
      ACTIVE: 1.725,
      VERY_ACTIVE: 1.9,
    };
    const multiplier =
      multipliers[effectiveProfile.lifestyle as keyof typeof multipliers] ||
      1.2;

    const tdee = Math.round(bmr * multiplier);

    const proteins = Math.round((tdee * 0.3) / 4);
    const fats = Math.round((tdee * 0.2) / 9);
    const carbs = Math.round((tdee * 0.5) / 4);

    return {
      tdee: tdee.toString(),
      macros: `${proteins}/${fats}/${carbs}`,
    };
  }, [
    effectiveProfile.weight,
    effectiveProfile.height,
    effectiveProfile.age,
    effectiveProfile.lifestyle,
  ]);

  /**
   * Расширенные stats для UI
   */
  const profileStats = useMemo(
    () => ({
      weight:
        effectiveProfile.weight != null && effectiveProfile.weight > 0
          ? `${effectiveProfile.weight} кг`
          : "Не заполнено",
      height:
        effectiveProfile.height != null && effectiveProfile.height > 0
          ? `${effectiveProfile.height} см`
          : "Не заполнено",
      age:
        effectiveProfile.age != null && effectiveProfile.age > 0
          ? `${effectiveProfile.age} лет`
          : "Не заполнено",
      bmi:
        effectiveProfile.bmi != null && effectiveProfile.bmi > 0
          ? `ИМТ ${effectiveProfile.bmi.toFixed(1)}`
          : "ИМТ не рассчитан",
      goal: effectiveProfile.goal ?? "Не выбрана",

      tdee: nutritionStats.tdee,
      macros: nutritionStats.macros,

      favorites: "12",
      currentPlan: "PPL • Неделя 1",
    }),
    [
      effectiveProfile.weight,
      effectiveProfile.height,
      effectiveProfile.age,
      effectiveProfile.bmi,
      effectiveProfile.goal,
      nutritionStats.tdee,
      nutritionStats.macros,
    ],
  );

  // ==================== EVENT HANDLERS ====================
  /**
   * Обновление профиля после модалки
   */
  const handleProfileUpdate = useCallback(async () => {
    try {
      logger.debug("handleProfileUpdate started");
      await refreshUser();
      await reloadProfile();
      logger.debug("Profile updated successfully");
      setIsProfileModalOpen(false);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logger.error("handleProfileUpdate failed", { error: errorMessage });
      setLocalError({
        type: "network",
        message: "Не удалось обновить профиль",
      });
    }
  }, [refreshUser, reloadProfile]);

  /**
   * Открытие модалки профиля
   */
  const handleOpenModal = useCallback(() => {
    logger.debug("Opening profile modal");
    setIsProfileModalOpen(true);
  }, []);

  /**
   * Клик по роли (Admin → /admin)
   */
  const handleRoleClick = useCallback(() => {
    if (user?.role === "ADMIN") {
      logger.debug("Navigating to admin");
      navigate("/admin");
    }
  }, [user?.role, navigate]);

  /**
   * Toggle theme
   */
  const handleThemeToggle = useCallback(() => {
    logger.debug("Theme toggle", { from: theme });
    toggleTheme();
  }, [theme, toggleTheme]);

  // ==================== RENDER ====================
  if (localError) {
    return (
      <InfoPage
        type={localError.type}
        message={localError.message}
        retryAction={() => {
          setLocalError(null);
          reloadProfile();
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="dashboard-loading">
        <InfoPage type="loading" />
      </div>
    );
  }

  return (
    <div className="dashboard-content">
      {/* 👋 ЛЕВАЯ КОЛОНКА: приветствие + роль + дата */}
      <section className="dashboard-content-block dashboard-content-block__left dashboard-block-mobile">
        <div className="dashboard-content-block-left__greeting dashboard-content-block__title">
          Привет, {user?.login ?? "Гость"}!
        </div>

        <div
          className="dashboard-content-block-left__role"
          onClick={handleRoleClick}
          style={
            {
              color:
                user?.role === "ADMIN"
                  ? "var(--boolean-false)"
                  : "var(--boolean-true)",
              cursor: user?.role === "ADMIN" ? "pointer" : "default",
            } as React.CSSProperties
          }>
          [{user?.role ?? "USER"}]
        </div>

        <div className="dashboard-content-block-left__created">
          <span className="dashboard-content-block-left__created-subtitle">
            Зарегистрирован:
          </span>
          <span className="dashboard-content-block-left__created-date">
            {user?.createdAt ? formatRussianDate(user.createdAt) : "Недавно"}
          </span>
        </div>

        <button
          type="button"
          onClick={handleOpenModal}
          className="dashboard-content-block-left__update-data"
          disabled={!user}>
          Изменить данные
        </button>
      </section>

      {/* 📊 СРЕДНЯЯ КОЛОНКА: статистика профиля */}
      <section className="dashboard-content-block dashboard-content-block__mid dashboard-block-mobile">
        <div className="dashboard-content-block__mid-title dashboard-content-block__title">
          Информация о пользователе:
        </div>

        {isProfileComplete ? (
          <div className="dashboard-profile-stats">
            {/* 🎯 Цель */}
            <div className="stat-item">
              <span className="stat-item__label">Цель:</span>
              <span className="stat-item__value">{profileStats.goal}</span>
            </div>

            {/* ⚖️ ИМТ */}
            <div className="stat-item">
              <span className="stat-item__label">ИМТ (BMI):</span>
              <span className="stat-item__value">{profileStats.bmi}</span>
            </div>

            {/* 🔥 Калории */}
            <div className="stat-item">
              <span className="stat-item__label">Калории/сутки:</span>
              <span className="stat-item__value">{profileStats.tdee}</span>
            </div>

            {/* 🍽️ БЖУ */}
            <div className="stat-item">
              <span className="stat-item__label">Суточное БЖУ:</span>
              <span className="stat-item__value">{profileStats.macros}</span>
            </div>

            {/* ⭐ Избранные */}
            <div className="stat-item">
              <span className="stat-item__label">Избранных:</span>
              <span className="stat-item__value">{profileStats.favorites}</span>
            </div>

            {/* 💪 План */}
            <div className="stat-item">
              <span className="stat-item__label">Текущий план:</span>
              <span className="stat-item__value">
                {profileStats.currentPlan}
              </span>
            </div>
          </div>
        ) : (
          <div className="dashboard-profile-empty">
            Профиль неполный — заполните данные для тренировок
            <button
              onClick={handleOpenModal}
              type="button"
              className="dashboard-profile-empty__btn">
              Заполнить профиль
            </button>
          </div>
        )}
      </section>

      {/* ⚙️ ПРАВАЯ КОЛОНКА: настройки */}
      <section className="dashboard-content-block dashboard-content-block-right dashboard-block-mobile">
        <div className="dashboard-content-block-right__title dashboard-content-block__title">
          Настройки:
        </div>

        <div className="dashboard-content-block-right-settings">
          {/* 🎨 Theme toggle */}
          <div className="dashboard-content-block-right-settings__theme-subtitle dashboard-content-block-right__subtitles">
            Сменить тему:
          </div>
          <fieldset className="dashboard-content-block-right-settings-theme-block">
            <button
              type="button"
              role="radio"
              aria-label="Светлая тема"
              aria-checked={theme === "light"}
              onClick={handleThemeToggle}
              disabled={theme === "light"}
              className="dashboard-content-block-right-settings-theme-block__item dashboard-content-block-right-settings-theme-block__item--light">
              <img
                src={sunIcon}
                alt="Светлая"
                className="dashboard-content-block-right-settings-theme-block__icon"
              />
              <legend className="dashboard-content-block-right-settings-theme-block__name">
                Светлая
              </legend>
            </button>
            <button
              type="button"
              role="radio"
              aria-label="Тёмная тема"
              aria-checked={theme === "dark"}
              onClick={handleThemeToggle}
              disabled={theme === "dark"}
              className="dashboard-content-block-right-settings-theme-block__item dashboard-content-block-right-settings-theme-block__item--dark">
              <img
                src={moonIcon}
                alt="Тёмная"
                className="dashboard-content-block-right-settings-theme-block__icon"
              />
              <legend className="dashboard-content-block-right-settings-theme-block__name">
                Тёмная
              </legend>
            </button>
          </fieldset>

          {/* 🔔 Notifications (placeholder) */}
          <div className="dashboard-content-block-right-settings__notifications">
            <span className="dashboard-content-block-right-settings__notifications-subtitle dashboard-content-block-right__subtitles">
              Уведомления:
            </span>
            <label className="dashboard-content-block-right-settings__notifications-switch">
              <input type="checkbox" title="В разработке" />
              <span className="notifications-switch__slider"></span>
            </label>
          </div>
        </div>
      </section>

      {/* ✏️ МОДАЛКА РЕДАКТИРОВАНИЯ ПРОФИЛЯ */}
      <ProfileEditModal
        profile={effectiveProfile}
        user={user}
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onSuccess={handleProfileUpdate}
      />
    </div>
  );
}
