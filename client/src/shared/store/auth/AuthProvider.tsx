import { useReducer, useEffect, useCallback } from "react";
import type {
  AuthState,
  AuthAction,
  AuthContextType,
} from "@/types/auth.types";
import { AuthContext } from "./auth-context";
import { authApi } from "@/shared/api/authApi";

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case "SET_USER":
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        isLoading: false,
        error: null,
      };
    case "LOGOUT":
      return { ...initialState, isLoading: false };
    case "SET_LOADING":
      return { ...state, isLoading: !!action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload, isLoading: false };
    default:
      return state;
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const initAuth = async () => {
      dispatch({ type: "SET_LOADING", payload: true });
      try {
        const token = localStorage.getItem("token");
        if (token) {
          const user = await authApi.getProfile();
          dispatch({ type: "SET_USER", payload: user });
        }
      } catch (error) {
        console.error("Auth init failed:", error);
        localStorage.removeItem("token");
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    };
    initAuth();
  }, []);

  const register = useCallback(
    async (login: string, password: string, email?: string) => {
      dispatch({ type: "SET_LOADING", payload: true });
      try {
        await authApi.register(login, password, email);
        // Автологин после регистрации
        const loginResponse = await authApi.login(login, password);
        dispatch({ type: "SET_USER", payload: loginResponse.user });
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Ошибка регистрации";
        dispatch({ type: "SET_ERROR", payload: message });
        throw error;
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    },
    [],
  );

  const login = useCallback(async (login: string, password: string) => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const response = await authApi.login(login, password);
      dispatch({ type: "SET_USER", payload: response.user });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Ошибка входа";
      dispatch({ type: "SET_ERROR", payload: message });
      throw error;
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, []);

  const logout = useCallback(() => {
    authApi.logout();
    dispatch({ type: "LOGOUT" });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: "SET_ERROR", payload: null });
  }, []);

  const value: AuthContextType = {
    state,
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    login,
    register,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
