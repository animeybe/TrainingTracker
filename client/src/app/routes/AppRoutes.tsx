// AppRoutes.tsx
import { Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import { AppLayout } from "..";
import { GuestRoute } from "@/shared/guards/GuestRoute";
import { RoleGuard } from "@/shared/guards/RoleGuard";
import { InfoPage } from "@/shared/ui/components/ErrorUI/ui/InfoPage";

// Главная грузится сразу — она самая важная
import { HomePage } from "@/pages";

// Ленивая загрузка остальных страниц
const LoginPage = lazy(() =>
  import("@/pages/Auth/Login/ui/LoginPage").then((m) => ({
    default: m.LoginPage,
  })),
);

const RegisterPage = lazy(() =>
  import("@/pages/Auth/Registration/ui/RegisterPage").then((m) => ({
    default: m.RegisterPage,
  })),
);

const DashboardPage = lazy(() =>
  import("@/pages/Dashboard/ui/DashboardPage").then((m) => ({
    default: m.DashboardPage,
  })),
);

const ExerciseBasePage = lazy(() =>
  import("@/pages/ExerciseBase/ui/ExerciseBasePage").then((m) => ({
    default: m.ExerciseBasePage,
  })),
);

const RecordsPage = lazy(() =>
  import("@/pages/Records/ui/RecordsPage").then((m) => ({
    default: m.RecordsPage,
  })),
);

const TrainingPage = lazy(() =>
  import("@/pages/Training/ui/TrainingPage").then((m) => ({
    default: m.TrainingPage,
  })),
);

const AdminSettingsPage = lazy(() =>
  import("@/pages/AdminSettings/ui/AdminSettingsPage").then((m) => ({
    default: m.AdminSettingsPage,
  })),
);

// Обёртка Suspense для ленивых страниц
const LazyPage = ({ children }: { children: React.ReactNode }) => (
  <Suspense
    fallback={
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
        }}>
        <InfoPage type="loading" />
      </div>
    }>
    {children}
  </Suspense>
);

export const AppRoutes = () => {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        {/* Главная — без lazy, грузится сразу */}
        <Route index element={<HomePage />} />

        {/* Гостевые страницы */}
        <Route element={<GuestRoute />}>
          <Route
            path="/login"
            element={
              <LazyPage>
                <LoginPage />
              </LazyPage>
            }
          />
          <Route
            path="/register"
            element={
              <LazyPage>
                <RegisterPage />
              </LazyPage>
            }
          />
        </Route>

        {/* Пользовательские страницы */}
        <Route element={<RoleGuard requiredPermission="dashboard" />}>
          <Route
            path="/dashboard"
            element={
              <LazyPage>
                <DashboardPage />
              </LazyPage>
            }
          />
        </Route>

        <Route element={<RoleGuard requiredPermission="exercise-base" />}>
          <Route
            path="/exercise-base"
            element={
              <LazyPage>
                <ExerciseBasePage />
              </LazyPage>
            }
          />
        </Route>

        <Route element={<RoleGuard requiredPermission="training" />}>
          <Route
            path="/training"
            element={
              <LazyPage>
                <TrainingPage />
              </LazyPage>
            }
          />
        </Route>

        <Route element={<RoleGuard requiredPermission="health" />}>
          <Route
            path="/health"
            element={
              <LazyPage>
                <RecordsPage />
              </LazyPage>
            }
          />
        </Route>

        {/* Админские страницы */}
        <Route element={<RoleGuard requiredPermission="admin" />}>
          <Route
            path="/admin"
            element={
              <LazyPage>
                <AdminSettingsPage />
              </LazyPage>
            }
          />
        </Route>

        <Route element={<RoleGuard requiredPermission="admin/settings" />}>
          <Route
            path="/admin/settings"
            element={
              <LazyPage>
                <AdminSettingsPage />
              </LazyPage>
            }
          />
        </Route>

        {/* 404 */}
        <Route path="*" element={<InfoPage type="404" />} />
      </Route>
    </Routes>
  );
};
