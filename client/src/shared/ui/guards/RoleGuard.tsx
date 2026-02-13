import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthContext } from "@/shared/store/auth/auth-context";
import { hasPermission, type RoleGuardProps } from "@/types/permissions";

export const RoleGuard = ({
  requiredPermission,
  fallbackPath = "/dashboard",
}: RoleGuardProps) => {
  const { isAuthenticated, state, user } = useAuthContext();
  const location = useLocation();

  const isCurrentPath = location.pathname === `/${requiredPermission}`;

  if (isCurrentPath && (state.isLoading || !isAuthenticated || !user?.role)) {
    return <div>Проверка доступа...</div>;
  }

  if (!user?.role) {
    return <Navigate to="/login" replace />;
  }

  const hasAccess = hasPermission(user.role, requiredPermission);
  if (!hasAccess) {
    return <Navigate to={fallbackPath} replace />;
  }
  
  return <Outlet />;
};
