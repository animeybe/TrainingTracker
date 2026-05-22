import { useLocation, useNavigate } from "react-router-dom";
import { useAuthContext } from "@/shared/store";
import { useState, useEffect } from "react";
import "./Header.scss";

export function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuthContext();

  // 📱 Mobile menu state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // 📱 Detect mobile (ширина < 1024px)
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    logout();
    navigate("/", { replace: true });
    setIsMobileMenuOpen(false);
  };

  // 📱 Burger click
  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  if (!isMobile) {
    // 💻 Desktop Header (оригинал)
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
            <li
              className="header-nav__item"
              onClick={() => navigate("/training")}>
              Тренировочный план
            </li>
            <li
              className="header-nav__item"
              onClick={() => navigate("/health")}>
              Записи тренировок
            </li>
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
                  : user.login}
              </span>
              <button onClick={handleLogout} className="header-user__logout">
                Выйти
              </button>
            </div>
          ) : (
            <ul className="header-auth__list">
              <li
                className="header-auth__item header-auth__item_login"
                onClick={() => {
                  const params = new URLSearchParams({
                    next: location.pathname,
                  });
                  navigate(`/login?${params.toString()}`);
                }}>
                Вход
              </li>
              <li
                className="header-auth__item header-auth__item_register"
                onClick={() => navigate("/register")}>
                Регистрация
              </li>
            </ul>
          )}
        </div>
      </header>
    );
  }

  // 📱 Mobile: FAB Burger (нижний правый)
  return (
    <>
      {/* Плавающая кнопка бургер */}
      <button
        className="mobile-burger-fab"
        onClick={toggleMobileMenu}
        aria-label="Меню"
        aria-expanded={isMobileMenuOpen}>
        <div className="burger-icon">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </button>

      {/* 📱 Overlay + Slide Menu */}
      {isMobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={toggleMobileMenu}>
          <div className="mobile-menu">
            {/* Логотип сверху */}
            <div className="mobile-menu-header">
              <div
                onClick={() => {
                  navigate("/");
                  toggleMobileMenu();
                }}
                className="header-logo-mobile">
                <div className="header-logo__item header-logo__item_training">
                  TRAINING
                </div>
                <div className="header-logo__item header-logo__item_tracker">
                  TRACKER
                </div>
              </div>
              <button className="mobile-menu-close" onClick={toggleMobileMenu}>
                ×
              </button>
            </div>

            {/* Навигация */}
            <ul className="mobile-menu-nav">
              <li
                onClick={() => {
                  navigate("/training");
                  toggleMobileMenu();
                }}>
                Тренировка
              </li>
              <li
                onClick={() => {
                  navigate("/health");
                  toggleMobileMenu();
                }}>
                Записи тренировок
              </li>
              <li
                onClick={() => {
                  navigate("/exercise-base");
                  toggleMobileMenu();
                }}>
                База упражнений
              </li>
              <li
                onClick={() => {
                  navigate("/dashboard");
                  toggleMobileMenu();
                }}>
                Профиль
              </li>
            </ul>

            {/* Auth */}
            <div className="mobile-menu-auth">
              {isAuthenticated && user ? (
                <div className="mobile-user">
                  <span className="mobile-user__name">{user.login}</span>
                  <button
                    onClick={handleLogout}
                    className="mobile-user__logout">
                    Выйти
                  </button>
                </div>
              ) : (
                <>
                  <button
                    className="mobile-auth-btn"
                    onClick={() => {
                      const params = new URLSearchParams({
                        next: location.pathname,
                      });
                      navigate(`/login?${params.toString()}`);
                      toggleMobileMenu();
                    }}>
                    Вход
                  </button>
                  <button
                    className="mobile-auth-btn primary"
                    onClick={() => {
                      navigate("/register");
                      toggleMobileMenu();
                    }}>
                    Регистрация
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
