import { Navigate, Outlet, useSearchParams } from "react-router-dom";
import { useAuthContext } from "@/shared/store/auth/auth-context";

export const GuestRoute = () => {
  const { isAuthenticated, state } = useAuthContext();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get("next") || "/dashboard";

  if (state.isLoading) {
    return <div className="loading">Загрузка...</div>;
  }

  if (!isAuthenticated) {
    return <Outlet />;
  }

  return <Navigate to={returnTo} replace />;
};
