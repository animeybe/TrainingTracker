import { useTheme } from "@/shared/store";
import "./DashboardPage.scss";
import { useSafeAuthContext } from "@/shared/hooks/useSafeAuth";
import { profileApi } from "@/shared/api";
import { formatRussianDate } from "@/lib/utils/dates";
import sunIcon from "@/assets/icon/sun.svg";
import moonIcon from "@/assets/icon/moon.svg";
import { useState, useCallback } from "react";
import type { ProfileData } from "@/shared/api/types";
import { ProfileEditModal } from "@/shared/ui/blocks/ProfileEditModal";
import { useNavigate } from "react-router-dom";

export function DashboardPage() {
  const { theme, toggleTheme } = useTheme();
  const { user, refreshUser } = useSafeAuthContext();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const navigate = useNavigate();

  const loadProfile = useCallback(async () => {
    if (!user?.id) return;

    try {
      const profileResponse = await profileApi.getProfile();
      setProfile(profileResponse);
    } catch {
      setProfile({
        weight: -1,
        height: -1,
        age: -1,
        lifestyle: null,
        goal: null,
        bmi: null,
        bmiCategory: "NOT_SET",
        isWeightSet: false,
        isHeightSet: false,
        isAgeSet: false,
        isLifestyleSet: false,
        isGoalSet: false,
        createdAt: "",
        updatedAt: "",
        id: "",
        userId: user.id,
      });
    }
  }, [user]);

  const handleProfileUpdate = useCallback(async () => {
    await Promise.allSettled([loadProfile(), refreshUser()]);
    setIsProfileModalOpen(false);
  }, [loadProfile, refreshUser]);

  const handleOpenModal = useCallback(async () => {
    console.log("🚪 OPEN MODAL - user:", {
      id: user?.id,
      login: user?.login,
      email: user?.email,
      emailType: typeof user?.email,
    });

    try {
      await refreshUser();
      await loadProfile();
    } catch (error) {
      console.error("refreshUser ERROR:", error);
    }

    setIsProfileModalOpen(true);
  }, [refreshUser, loadProfile, user]);

  return (
    <div className="dashboard-content">
      <section className="dashboard-content-block dashboard-content-block_left">
        <div className="dashboard-content-block-left__greeting dashboard-content-block__title">
          Привет, {user?.login ?? "Гость"}
        </div>
        <div
          className="dashboard-content-block-left__role"
          onClick={() => {
            if (user?.role === "ADMIN") navigate("/admin");
          }}
          style={
            {
              color:
                user?.role === "ADMIN"
                  ? "var(--boolean-false)"
                  : "var(--boolean-true)",
              cursor: user?.role === "ADMIN" && "pointer",
            } as React.CSSProperties
          }>
          [{user?.role ?? "USER"}]
        </div>

        <div className="dashboard-content-block-left-created">
          <span className="dashboard-content-block-left-created__subtitle">
            Зарегистрирован:
          </span>
          <span className="dashboard-content-block-left-created__date">
            {user?.createdAt ? formatRussianDate(user.createdAt) : "Недавно"}
          </span>
        </div>

        <button
          onClick={handleOpenModal}
          className="dashboard-content-block-left__update-data">
          Изменить данные
        </button>
      </section>

      <section className="dashboard-content-block dashboard-content-block_mid">
        <div className="dashboard-content-block-mid__title dashboard-content-block__title">
          Статистика:
        </div>
      </section>

      <section className="dashboard-content-block dashboard-content-block_right">
        <div className="dashboard-content-block-right__title dashboard-content-block__title">
          Настройки:
        </div>
        <div className="dashboard-content-block-right-settings">
          <div className="dashboard-content-block-right-settings__theme-subtitle dashboard-content-block-right-settings__subtitles">
            Сменить тему:
          </div>
          <fieldset className="dashboard-content-block-right-settings-theme-block">
            <button
              type="button"
              role="radiogroup"
              aria-label="Светлая тема"
              aria-checked={theme === "light"}
              onClick={() => theme === "dark" && toggleTheme()}
              className="dashboard-content-block-right-settings-theme-block__item dashboard-content-block-right-settings-theme-block__item_light">
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
              role="radiogroup"
              aria-label="Тёмная тема"
              aria-checked={theme === "dark"}
              onClick={() => theme === "light" && toggleTheme()}
              className="dashboard-content-block-right-settings-theme-block__item dashboard-content-block-right-settings-theme-block__item_dark">
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
          <div className="dashboard-content-block-right-settings__notifications">
            <span className="dashboard-content-block-right-settings__notifications-subtitle dashboard-content-block-right-settings__subtitles">
              Уведомления:
            </span>
            <label className="dashboard-content-block-right-settings__notifications-switch">
              <input type="checkbox" />
              <span className="notifications-switch__slider"></span>
            </label>
          </div>
        </div>
      </section>

      <ProfileEditModal
        profile={profile}
        user={user}
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onSuccess={handleProfileUpdate}
      />
    </div>
  );
}
