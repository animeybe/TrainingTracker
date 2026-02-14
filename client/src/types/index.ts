export type {
  User,
  SafeUser,
  AuthState,
  AuthAction,
  AuthContextType,
  ApiError,
  AuthResponse,
  ProfileResponse,
} from "./auth.types";

export type { RoutePermission, RoleGuardProps } from "./permissions";

export const ROUTE_PERMISSIONS = {
  dashboard: ["USER", "ADMIN"],
  "exercise-base": ["USER", "ADMIN"],
  admin: ["ADMIN"],
  "admin/settings": ["ADMIN"],
} as const;

export { hasPermission, isAdmin, isUser } from "./permissions";

export type { 
  ErrorBoundaryProps, 
  ErrorBoundaryState, 
  ErrorInfo 
} from './error.types';
