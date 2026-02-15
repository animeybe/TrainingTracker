import { useTheme } from "@/shared/store";
import "./DashboardPage.scss";
// import { useNavigate } from "react-router-dom";
import { useSafeAuthContext } from "@/shared/hooks/useSafeAuth";
import { formatRussianDate } from "@/lib/utils/dates";
import sunIcon from "@/assets/icon/sun.svg";
import moonIcon from "@/assets/icon/moon.svg";

export function DashboardPage() {
  const { theme, toggleTheme } = useTheme();
  // const navigate = useNavigate();
  const { user } = useSafeAuthContext();

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
              {formatRussianDate(user.createdAt)}
            </span>
          </div>
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
