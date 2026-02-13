import { Routes, Route } from "react-router-dom";
import {
  HomePage,
  LoginPage,
  RegisterPage,
  DashboardPage,
  ExerciseBasePage,
  AdminSettingsPage,
} from "@/pages";
import { AppLayout } from "..";
import { GuestRoute } from "@/shared/ui/guards/GuestRoute";
import { RoleGuard } from "@/shared/ui/guards/RoleGuard";

export const AppRoutes = () => {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        {/* ГЛАВНАЯ — ПЕРВАЯ! */}
        <Route index element={<HomePage />} />

        {/* GuestRoute */}
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* USER + ADMIN */}
        <Route element={<RoleGuard requiredPermission="dashboard" />}>
          <Route path="/dashboard" element={<DashboardPage />} />
        </Route>
        <Route element={<RoleGuard requiredPermission="exercise-base" />}>
          <Route path="/exercise-base" element={<ExerciseBasePage />} />
        </Route>

        {/* ТОЛЬКО ADMIN */}
        <Route element={<RoleGuard requiredPermission="admin" />}>
          <Route path="/admin" element={<AdminSettingsPage />} />
        </Route>
        <Route element={<RoleGuard requiredPermission="admin/settings" />}>
          <Route path="/admin/settings" element={<AdminSettingsPage />} />
        </Route>
      </Route>
    </Routes>
  );
};
