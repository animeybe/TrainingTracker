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
        <div className="dashboard-content-block dashboard-content-block_left">
          <div className="dashboard-content-block-left__greeting">
            Привет, {user.login}
          </div>
          <div
            className="dashboard-content-block-left__role"
            style={
              {
                color: user.role === "ADMIN" ? "#C74A3B" : "#6B8E23",
              } as React.CSSProperties
            }>{`[${user.role}]`}</div>
          <div className="dashboard-content-block-left-created">
            <span className="dashboard-content-block-left-created__title">
              Зарегестрирован:
            </span>
            <span className="dashboard-content-block-left-created__date">
              {formatRussianDate(user.createdAt)}
            </span>
          </div>
        </div>
        <div className="dashboard-content-block dashboard-content-block_mid"></div>
        <div className="dashboard-content-block dashboard-content-block_right">
          <div className="dashboard-content-block-right__title">Настройки</div>
          <div className="dashboard-content-block-right-settings">
            <div className="dashboard-content-block-right-settings__theme-title">
              Сменить тему:
            </div>
            <div className="dashboard-content-block-right-settings-theme-block">
              <div
                onClick={() => theme === "dark" && toggleTheme()}
                className="dashboard-content-block-right-settings-theme-block__item dashboard-content-block-right-settings-theme-block__item_light">
                <img
                  src={sunIcon}
                  alt="Сменить тему на свелую"
                  className="dashboard-content-block-right-settings-theme-block__icon"
                />
                <div className="dashboard-content-block-right-settings-theme-block__name">
                  Сетлая
                </div>
              </div>
              <div
                onClick={() => theme === "light" && toggleTheme()}
                className="dashboard-content-block-right-settings-theme-block__item dashboard-content-block-right-settings-theme-block__item_dark">
                <img
                  src={moonIcon}
                  alt="Сменить тему на Тёмную"
                  className="dashboard-content-block-right-settings-theme-block__icon"
                />
                <div className="dashboard-content-block-right-settings-theme-block__name">
                  Тёмная
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
