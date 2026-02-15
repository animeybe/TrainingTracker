export interface SafeUser {
  id: string;
  login: string;
  role: string;
  weight?: number;
  height?: number;
  age?: number;
  lifestyle?: string | null;
  goal?: string | null;
  bmi?: number;
  bmiCategory?: string;
}

export interface AuthResponse {
  user: SafeUser;
  token: string;
}

export interface ProfileResponse {
  id: string;
  userId: string;
  login: string;
  role: string;
  weight: number;
  height: number;
  age: number;
  lifestyle: string | null;
  goal: string | null;
  bmi: number;
  bmiCategory: string;
}

export interface AuthState {
  user: SafeUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export type AuthAction =
  | { type: "SET_USER"; payload: SafeUser }
  | { type: "LOGOUT" }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null };

export interface AuthContextType {
  state: AuthState;
  user: SafeUser | null;
  isAuthenticated: boolean;
  login: (login: string, password: string) => Promise<void>;
  register: (login: string, password: string, email?: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}
