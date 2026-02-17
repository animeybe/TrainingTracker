export type {
  SafeUser,
  AuthState,
  AuthAction,
  AuthContextType,
  AuthResponse,
  ProfileResponse,
} from "./auth.types";

export type { RoutePermission, RoleGuardProps } from "./permissions";

export { hasPermission, isAdmin, isUser } from "./permissions";

export type { 
  ErrorBoundaryProps, 
  ErrorBoundaryState, 
  ErrorInfo 
} from './error.types';
