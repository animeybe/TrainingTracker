"use client";
import { useReducer, useEffect, useCallback } from "react";
import type {
  AuthState,
  AuthAction,
  AuthContextType,
  User,
} from "./auth-context";
import { AuthContext } from "./auth-context";
import { authApi } from "@/shared/api";

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
      return {
        ...initialState,
        isLoading: false,
      };
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload, isLoading: false };
    default:
      return state;
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // ✅ Восстановление пользователя из localStorage/JWT
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          dispatch({ type: "SET_LOADING", payload: true });
          const { authApi } = await import("@/shared/api");
          const user = await authApi.getProfile();
          dispatch({ type: "SET_USER", payload: user });
        }
      } catch {
        localStorage.removeItem("token");
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    };
    initAuth();
  }, []);

  // ✅ Регистрация (НЕ логинит автоматически)
  const register = useCallback(async (username: string, password: string) => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      await authApi.register(username, password);
      dispatch({ type: "SET_ERROR", payload: null });
    } catch (error: unknown) {
      let message = "Ошибка регистрации";
      if (error && typeof error === "object" && "response" in (error as any)) {
        const err = error as { response: { data: { message?: string } } };
        message = err.response?.data?.message || message;
      }
      dispatch({ type: "SET_ERROR", payload: message });
      throw new Error(message);
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, []);

  // ✅ Логин с сохранением пользователя
  const login = useCallback(async (username: string, password: string) => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const response = await authApi.login(username, password);
      const user: User = response.user; // ✅ Сервер возвращает user
      localStorage.setItem("token", response.token);
      dispatch({ type: "SET_USER", payload: user });
    } catch (error: unknown) {
      let message = "Ошибка входа";
      if (error && typeof error === "object" && "response" in (error as any)) {
        const err = error as { response: { data: { message?: string } } };
        message = err.response?.data?.message || message;
      }
      dispatch({ type: "SET_ERROR", payload: message });
      throw new Error(message);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    dispatch({ type: "LOGOUT" });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: "SET_ERROR", payload: null });
  }, []);

  const value: AuthContextType = {
    state,
    user: state.user, // ✅ Прямой доступ
    isAuthenticated: state.isAuthenticated,
    login,
    register,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
