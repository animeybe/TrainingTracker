import { useLocation, useNavigate } from "react-router-dom";
import { useAuthContext } from "@/shared/store";
import "./Header.scss";

export function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuthContext();

  const handleLogout = () => {
    localStorage.removeItem("token");
    logout();
    navigate("/", { replace: true });
  };

  return (
    <header className="header">
      {/* Логотип */}
      <div onClick={() => navigate("/")} className="header-logo">
        <div className="header-logo__item header-logo__item_training">
          TRAINING
        </div>
        <div className="header-logo__item header-logo__item_tracker">
          TRACKER
        </div>
      </div>

      {/* Навигация */}
      <div className="header-nav">
        <ul className="header-nav__list">
          <li className="header-nav__item">Тренировка</li>
          <li className="header-nav__item">Здоровье</li>
          <li
            className="header-nav__item"
            onClick={() => navigate("/exercise-base")}>
            База упражнений
          </li>
        </ul>
      </div>

      <div className="header-auth">
        {isAuthenticated && user ? (
          <div className="header-user">
            <span
              className="header-user__name"
              onClick={() => navigate("/dashboard")}>
              {user.role === "ADMIN"
                ? `${user.login}[${user.role}]`
                : `${user.login}`}
            </span>
            <button onClick={handleLogout} className="header-user__logout">
              Выйти
            </button>
          </div>
        ) : (
          /* Не авторизован → вход/регистрация */
          <ul className="header-auth__list">
            <li
              onClick={() => {
                const params = new URLSearchParams({
                  next: location.pathname,
                });
                navigate(`/login?${params.toString()}`);
              }}
              className="header-auth__item header-auth__item_login">
              Вход
            </li>
            <li
              onClick={() => navigate("/register")}
              className="header-auth__item header-auth__item_register">
              Регистрация
            </li>
          </ul>
        )}
      </div>
    </header>
  );
}
