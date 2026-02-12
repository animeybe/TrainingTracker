// types/auth.types.ts
export interface User {
  id: string;
  login: string;
  email: string | null;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export interface SafeUser {
  id: string;
  login: string;
  email: string | null;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export interface AuthState {
  user: SafeUser | null; // SafeUser!
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AuthAction {
  type: "SET_USER" | "LOGOUT" | "SET_LOADING" | "SET_ERROR";
  payload?: SafeUser | boolean | string | null; // SafeUser!
}

export interface AuthContextType {
  state: AuthState;
  user: SafeUser | null;
  isAuthenticated: boolean;
  login: (login: string, password: string) => Promise<void>;
  register: (login: string, password: string, email?: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}
