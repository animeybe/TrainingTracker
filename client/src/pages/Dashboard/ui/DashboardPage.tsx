import { useTheme } from "@/shared/store";
import "./DashboardPage.scss";
import { useSafeAuthContext } from "@/shared/hooks/useSafeAuth";
import { profileApi } from "@/shared/api/authApi";
import { formatRussianDate } from "@/lib/utils/dates";
import sunIcon from "@/assets/icon/sun.svg";
import moonIcon from "@/assets/icon/moon.svg";
import { useEffect, useState } from "react";
import type { ProfileData } from "@/types/profile.types";
import { favoriteApi } from "@/shared/api/authApi";
import type { FavoriteListResponse } from "@/types/favorite.type";

export function DashboardPage() {
  const { theme, toggleTheme } = useTheme();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const { user, refreshUser } = useSafeAuthContext();
  const [favoriteList, setFavoriteList] = useState<
    FavoriteListResponse["data"]
  >([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);

  useEffect(() => {
    if (user) {
      profileApi.getProfile().then(setProfile);
    }
  }, [user]);

  // 2. Загрузка избранного (опционально, graceful degradation)
  useEffect(() => {
    const loadFavorites = async (retries = 2) => {
      setLoadingFavorites(true);
      try {
        const response = await favoriteApi.getFavorites();
        setFavoriteList(response.data);
      } catch (error) {
        if (retries > 0) {
          setTimeout(() => loadFavorites(retries - 1), 1000);
        } else {
          console.warn("Избранное недоступно:", error);
          setFavoriteList([]);
        }
      } finally {
        setLoadingFavorites(false);
      }
    };

    loadFavorites();
  }, []);

  return (
    <>
      <div className="dashboard-content">
        <section className="dashboard-content-block dashboard-content-block_left">
          <div className="dashboard-content-block-left__greeting dashboard-content-block__title">
            Привет, {user.login}
          </div>
          <div
            className="dashboard-content-block-left__role"
            style={
              {
                color:
                  user.role === "ADMIN"
                    ? "var(--boolean-false)"
                    : "var(--boolean-true)",
              } as React.CSSProperties
            }>{`[${user.role}]`}</div>
          <div className="dashboard-content-block-left-created">
            <span className="dashboard-content-block-left-created__subtitle">
              Зарегестрирован:
            </span>
            <span className="dashboard-content-block-left-created__date">
              {user.createdAt ? formatRussianDate(user.createdAt) : "Недавно"}
            </span>
          </div>
          <div className="dashboard-content-block-left-add-data">
            <span className="dashboard-content-block-left-add-data__weight">
              Вес: {profile?.weight} кг
            </span>
            <span className="dashboard-content-block-left-add-data__height">
              Рост: {profile?.height} см
            </span>
            <span className="dashboard-content-block-left-add-data__age">
              Возраст: {profile?.age} лет
            </span>
            <span className="dashboard-content-block-left-add-data__bmi">
              BMI: {profile?.bmi} ({profile?.bmiCategory})
            </span>
          </div>
          <button
            onClick={refreshUser}
            className="dashboard-content-block-left__update-data">
            Изменить
          </button>
        </section>
        <section className="dashboard-content-block dashboard-content-block_mid">
          <div className="dashboard-content-block-mid__title dashboard-content-block__title">
            Статистика:
          </div>
          <ul className="dashboard-content-block-mid__favorite-list">
            {loadingFavorites && <li>Избранное пусто</li>}
            {!loadingFavorites &&
              favoriteList.map((favorite) => (
                <li key={favorite.id} className="favorite-item">
                  {favorite.name}
                </li>
              ))}
          </ul>
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
                  alt="Сменить тему на свелую"
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
                  alt="Сменить тему на Тёмную"
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
      </div>
    </>
  );
}
