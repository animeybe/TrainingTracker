"use client";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/shared/store";
import "./Header.scss";

export function Header() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthContext();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="header">
      {/* Логотип */}
      <div onClick={() => navigate("/")} className="header__logo">
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
          <li className="header-nav__item">База упражнений</li>
        </ul>
      </div>

      {/* АВТОРИЗАЦИЯ / НИК ПОЛЬЗОВАТЕЛЯ */}  
      <div className="header-auth">
        {isAuthenticated && user ? (
          /* Пользователь авторизован → показываем ник + выход */
          <div className="header-user">
            <span className="header-user__name">{user.login}</span>
            <button onClick={handleLogout} className="header-user__logout">
              Выйти
            </button>
          </div>
        ) : (
          /* Не авторизован → вход/регистрация */
          <ul className="header-auth__list">
            <li
              onClick={() => navigate("/login")}
              className="header-auth__item header-auth__item_login">
              Вход
            </li>
            <li
              onClick={() => navigate("/registration")}
              className="header-auth__item header-auth__item_register">
              Регистрация
            </li>
          </ul>
        )}
      </div>
    </header>
  );
}
