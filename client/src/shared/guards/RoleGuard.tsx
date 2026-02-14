import {
  Navigate,
  Outlet,
  useLocation,
  useSearchParams,
} from "react-router-dom";
import { useAuthContext } from "@/shared/store/auth/auth-context";
import { hasPermission, type RoleGuardProps } from "@/types/permissions";
import { InfoPage } from "@/pages/InfoPage";

export const RoleGuard = ({ requiredPermission }: RoleGuardProps) => {
  const { isAuthenticated, state, user } = useAuthContext();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const returnToFromParams = searchParams.get("next");
  const safeReturnTo = returnToFromParams
    ? decodeURIComponent(returnToFromParams)
    : null;

  if (state.isLoading) {
    return <InfoPage type="loading" />;
  }

  if (!isAuthenticated || !user) {
    const fromPath = safeReturnTo || location.pathname;
    return (
      <Navigate to={`/login?next=${encodeURIComponent(fromPath)}`} replace />
    );
  }

  if (!user?.role) {
    const fromPath = safeReturnTo || location.pathname;
    return (
      <Navigate to={`/login?next=${encodeURIComponent(fromPath)}`} replace />
    );
  }

  const hasAccess = hasPermission(user.role, requiredPermission);

  if (!hasAccess) {
    if (
      safeReturnTo &&
      hasPermission(user.role, safeReturnTo.split("/").pop() || "")
    ) {
      return <Navigate to={safeReturnTo} replace />;
    }

    return <Navigate to="/" replace />;
  }
  return <Outlet />;
};
