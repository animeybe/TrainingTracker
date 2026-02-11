import { useNavigate } from "react-router-dom";
import "./Header.scss";

export function Header() {
  const navigate = useNavigate();

  return (
    <header className="header">
      <div onClick={() => navigate("/")} className="header__logo">
        <div className="header-logo__item header-logo__item_training">
          TRAINING
        </div>
        <div className="header-logo__item header-logo__item_tracker">
          TRACKER
        </div>
      </div>
      <div className="header-nav">
        <ul className="header-nav__list">
          <li className="header-nav__item">Тренировка</li>
          <li className="header-nav__item">Здоровье</li>
          <li className="header-nav__item">База упражнений</li>
        </ul>
      </div>
      <div className="header-auth">
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
      </div>
    </header>
  );
}
