import { useCallback } from "react";
import { useAuthContext } from "@/shared/store/auth/auth-context";
import {
  hasPermission,
  isAdmin,
  isUser,
  type RoutePermission,
} from "@/types/permissions";

export const usePermissions = () => {
  const { user } = useAuthContext();

  // Проверка доступа к маршруту
  const canAccess = useCallback(
    (permission: RoutePermission): boolean => {
      return hasPermission(user?.role, permission);
    },
    [user?.role],
  );

  // Быстрые проверки ролей
  const isAdminUser = useCallback((): boolean => {
    return isAdmin(user?.role);
  }, [user?.role]);

  const isRegularUser = useCallback((): boolean => {
    return isUser(user?.role);
  }, [user?.role]);

  // Роль пользователя
  const userRole = user?.role || null;

  return {
    canAccess,
    isAdmin: isAdminUser,
    isUser: isRegularUser,
    userRole,
    user,
  };
};
