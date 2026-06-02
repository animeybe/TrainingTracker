// pages/DashboardPage.tsx
/**
 * DashboardPage — главная страница после авторизации
 *
 * Отображает:
 * - Приветствие пользователя
 * - Роль (USER/PREMIUM/ADMIN)
 * - Дату регистрации
 * - Статистику профиля (ИМТ, калории, БЖУ)
 * - Избранные/нелюбимые упражнения
 * - Текущий план тренировок
 * - Настройки (тема, уведомления)
 *
 * Кэширование профиля реализовано в useProfile (localStorage, 7 дней)
 */

import { useTheme } from "@/shared/store";
import "./DashboardPage.scss";
import { useSafeAuthContext } from "@/shared/hooks/useSafeAuth";
import { formatRussianDate } from "@/lib/utils/dates";
import sunIcon from "@/assets/icon/sun.svg";
import moonIcon from "@/assets/icon/moon.svg";
import { useState, useCallback, useMemo } from "react";
import type { ProfileData } from "@/shared/api/types";
import { ProfileEditModal } from "@/shared/ui/components/ProfileEditModal";
import { useNavigate } from "react-router-dom";
import { useProfile } from "@/shared/hooks/useProfile";
import { logger } from "@/lib/utils/logger";
import { InfoPage } from "@/shared/ui/components/ErrorUI/ui/InfoPage";
import type { ErrorType } from "@/shared/ui/components/ErrorUI/model/types";
import { useExercises } from "@/shared/hooks/useExercises";
import { useTrainingPlan } from "@/shared/hooks/useTrainingPlan";
import { usePushNotifications } from "@/shared/hooks/usePushNotifications";

// ======================================================================
// 🔧 УТИЛИТЫ
// ======================================================================

/**
 * Создает пустой профиль для fallback UI
 * Используется, когда профиль ещё не загружен или пользователь не авторизован
 */
const createEmptyProfile = (userId: string = ""): ProfileData => ({
  id: "",
  userId,
  weight: null,
  height: null,
  gender: null,
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

  // useProfile содержит кэширование профиля в localStorage (7 дней)
  const { profile, loadingProfile, reloadProfile } = useProfile();

  const { isSupported, isSubscribed, isLoading, toggle } =
    usePushNotifications();
  const { leastFavoriteExercises, favoriteExercises, loadingExercises } =
    useExercises();
  const { weekPlan, currentWeek } = useTrainingPlan();
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
   * Используется для отображения, пока реальные данные не загрузились
   */
  const effectiveProfile = useMemo(() => {
    if (profile) return profile;
    logger.debug("Using empty profile fallback");
    return createEmptyProfile(user?.id || "");
  }, [profile, user?.id]);

  /**
   * Проверка полноты профиля
   * Все поля должны быть заполнены для генерации тренировочного плана
   */
  const isProfileComplete = useMemo(() => {
    return (
      effectiveProfile.weight != null &&
      effectiveProfile.weight > 0 &&
      effectiveProfile.height != null &&
      effectiveProfile.height > 0 &&
      effectiveProfile.age != null &&
      effectiveProfile.age > 0 &&
      effectiveProfile.gender != null &&
      effectiveProfile.goal != null &&
      effectiveProfile.lifestyle != null
    );
  }, [
    effectiveProfile.weight,
    effectiveProfile.height,
    effectiveProfile.gender,
    effectiveProfile.age,
    effectiveProfile.goal,
    effectiveProfile.lifestyle,
  ]);

  /**
   * TDEE (Total Daily Energy Expenditure) и БЖУ
   * Рассчитывается по формуле Harris-Benedict Revised
   * Используется для отображения рекомендуемой калорийности и соотношения белков/жиров/углеводов
   */
  const nutritionStats = useMemo(() => {
    // Проверяем наличие всех необходимых данных
    if (
      !effectiveProfile.weight ||
      !effectiveProfile.height ||
      !effectiveProfile.age ||
      !effectiveProfile.gender
    )
      return { tdee: "—", macros: "— / — / —" };

    const weight = effectiveProfile.weight;
    const height = effectiveProfile.height;
    const age = effectiveProfile.age;
    const gender = effectiveProfile.gender;

    // Harris-Benedict Revised формула для BMR (Basal Metabolic Rate)
    let bmr: number;
    if (gender === "Male") {
      bmr = 88.362 + 13.397 * weight + 4.799 * height - 5.677 * age;
    } else if (gender === "Female") {
      bmr = 447.593 + 9.247 * weight + 3.098 * height - 4.33 * age;
    } else {
      return { tdee: "—", macros: "— / — / —" };
    }

    // Множители активности (Lifestyle)
    const multipliers: Record<string, number> = {
      IMMOBILE: 1.2,
      LIGHT: 1.375,
      AVERAGE: 1.55,
      HARD: 1.725,
    };
    const multiplier =
      multipliers[effectiveProfile.lifestyle ?? "IMMOBILE"] || 1.2;

    const tdee = Math.round(bmr * multiplier);

    // БЖУ: 30% белки, 20% жиры, 50% углеводы
    const proteins = Math.round((tdee * 0.3) / 4); // 1 г белка = 4 ккал
    const fats = Math.round((tdee * 0.2) / 9); // 1 г жира = 9 ккал
    const carbs = Math.round((tdee * 0.5) / 4); // 1 г углеводов = 4 ккал

    return {
      tdee: tdee.toString(),
      macros: `${proteins}/${fats}/${carbs}`,
    };
  }, [
    effectiveProfile.weight,
    effectiveProfile.height,
    effectiveProfile.age,
    effectiveProfile.gender,
    effectiveProfile.lifestyle,
  ]);

  /**
   * Расширенные stats для UI
   * Форматирует данные профиля для отображения
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

      favorites: `${favoriteExercises?.length} / ${leastFavoriteExercises?.length}`,
      currentPlan: `${weekPlan?.split.name} - Неделя №${currentWeek}`,
    }),
    [
      effectiveProfile.weight,
      effectiveProfile.height,
      effectiveProfile.age,
      effectiveProfile.bmi,
      effectiveProfile.goal,
      nutritionStats.tdee,
      nutritionStats.macros,
      favoriteExercises?.length,
      leastFavoriteExercises?.length,
      weekPlan?.split.name,
      currentWeek,
    ],
  );

  // ==================== EVENT HANDLERS ====================

  /**
   * Обновление профиля после закрытия модалки
   * Обновляет данные пользователя и перезагружает профиль из API
   * reloadProfile автоматически сохраняет данные в localStorage кэш
   */
  const handleProfileUpdate = useCallback(async () => {
    try {
      logger.debug("handleProfileUpdate started");
      await refreshUser(); // Обновляем данные пользователя в контексте
      await reloadProfile(); // Перезагружаем профиль из API (обновляет и кэш)
      logger.debug("Profile updated successfully");
      setIsProfileModalOpen(false); // Закрываем модалку
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
   * Открытие модалки редактирования профиля
   */
  const handleOpenModal = useCallback(() => {
    logger.debug("Opening profile modal");
    setIsProfileModalOpen(true);
  }, []);

  /**
   * Клик по роли (Admin → /admin)
   * Если пользователь имеет роль ADMIN, переходим в админку
   */
  const handleRoleClick = useCallback(() => {
    if (user?.role === "ADMIN") {
      logger.debug("Navigating to admin");
      navigate("/admin");
    }
  }, [user?.role, navigate]);

  /**
   * Переключение темы (светлая/тёмная)
   */
  const handleThemeToggle = useCallback(() => {
    logger.debug("Theme toggle", { from: theme });
    toggleTheme();
  }, [theme, toggleTheme]);

  // ==================== RENDER ====================

  // Отображаем ошибку, если она есть
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

  // Отображаем загрузку, пока данные не получены
  if (
    loadingExercises.all ||
    loadingExercises.favorites ||
    loadingExercises.leastFavorites ||
    loadingProfile
  ) {
    return (
      <div className="dashboard-loading">
        <InfoPage type="loading" />
      </div>
    );
  }

  // Основной рендер
  return (
    <div className="dashboard-content">
      {/* 👋 ЛЕВАЯ КОЛОНКА: приветствие + роль + дата */}
      <section className="dashboard-content-block dashboard-content-block__left dashboard-block-mobile">
        <div className="dashboard-content-block-left__greeting dashboard-content-block__title">
          Привет, {user?.login ?? "Гость"}!
        </div>

        <div
          className={`dashboard-content-block-left__role ${
            user?.role === "ADMIN"
              ? "dashboard-content-block-left__role--admin"
              : user?.role === "PREMIUM"
                ? "dashboard-content-block-left__role--premium"
                : "dashboard-content-block-left__role--user"
          }`}
          onClick={handleRoleClick}
          style={{
            cursor: user?.role === "ADMIN" ? "pointer" : "default",
          }}>
          {user?.role === "PREMIUM"
            ? "👑 PREMIUM"
            : `[${user?.role ?? "USER"}]`}
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
            <div className="stat-item">
              <span className="stat-item__label">Цель:</span>
              <span className="stat-item__value">{profileStats.goal}</span>
            </div>

            <div className="stat-item">
              <span className="stat-item__label">ИМТ (BMI):</span>
              <span className="stat-item__value">{profileStats.bmi}</span>
            </div>

            <div className="stat-item">
              <span className="stat-item__label">Калории/сутки:</span>
              <span className="stat-item__value">{profileStats.tdee}</span>
            </div>

            <div className="stat-item">
              <span className="stat-item__label">Суточное БЖУ:</span>
              <span className="stat-item__value">{profileStats.macros}</span>
            </div>

            <div className="stat-item">
              <span className="stat-item__label">Избранных:</span>
              <span className="stat-item__value">{profileStats.favorites}</span>
            </div>

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
          {/* 🎨 Переключение темы */}
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

          {/* 🔔 Push-уведомления */}
          <div className="dashboard-content-block-right-settings__notifications">
            <span className="dashboard-content-block-right-settings__notifications-subtitle dashboard-content-block-right__subtitles">
              Уведомления:
            </span>
            {isSupported ? (
              <label className="dashboard-content-block-right-settings__notifications-switch">
                <input
                  type="checkbox"
                  checked={isSubscribed}
                  onChange={toggle}
                  disabled={isLoading}
                />
                <span className="notifications-switch__slider"></span>
              </label>
            ) : (
              <span className="dashboard-content-block-right-settings__notifications-unsupported">
                Не поддерживаются браузером
              </span>
            )}
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
