import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthContext } from "@/shared/store/auth/auth-context";

export const GuestRoute = () => {
  const { isAuthenticated, state } = useAuthContext();
  const location = useLocation();

  if (state.isLoading) {
    return <div className="loading">Загрузка...</div>;
  }

  // Если НЕ авторизован - показываем страницу логина/регистрации
  if (!isAuthenticated) {
    return <Outlet />;
  }

  // Если авторизован - редирект на дашборд (сохраняем откуда пришел)
  return <Navigate to="/dashboard" state={{ from: location }} replace />;
};
