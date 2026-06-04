// AuthProvider.tsx
/**
 * AuthProvider — контекст авторизации.
 *
 * Стратегия обновления данных:
 *   1. При монтировании: мгновенно отдаём cachedUser (быстрый UI).
 *   2. В фоне делаем запрос getMe() для актуальных данных (роль, статус).
 *   3. При успехе — обновляем cachedUser и state.
 *   4. При ошибке — если был cachedUser, оставляем его (офлайн-режим).
 *      Если cachedUser не было — сбрасываем токен.
 */

import { useReducer, useEffect, useCallback, useRef } from "react";
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
  isLoading: true, // начинаем с true — показываем загрузку только при первом входе
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
  const initDone = useRef(false);

  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;

    const initAuth = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        dispatch({ type: "SET_LOADING", payload: false });
        return;
      }

      // 1. Мгновенно отдаём кэш (быстрый UI, работает офлайн)
      const cachedUser = localStorage.getItem("cachedUser");
      if (cachedUser) {
        try {
          const parsed = JSON.parse(cachedUser);
          dispatch({ type: "SET_USER", payload: parsed });
        } catch {
          localStorage.removeItem("cachedUser");
        }
      }

      // 2. В фоне обновляем с сервера (актуальная роль, статус)
      try {
        const user = await Promise.race([
          authApi.getMe(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Timeout")), 5000),
          ),
        ]);

        localStorage.setItem("cachedUser", JSON.stringify(user));
        dispatch({ type: "SET_USER", payload: user });
      } catch (error) {
        console.warn("Auth refresh failed:", error);
        // Если не было кэша — сбрасываем токен
        if (!cachedUser) {
          localStorage.removeItem("token");
          localStorage.removeItem("cachedUser");
          dispatch({ type: "LOGOUT" });
        }
        // Если кэш был — оставляем его (офлайн-режим)
      }
    };

    initAuth();
  }, []);

  const register = useCallback(
    async (login: string, password: string, email?: string) => {
      dispatch({ type: "SET_LOADING", payload: true });
      try {
        await authApi.register(login, password, email);
        const loginResponse = await authApi.login(login, password);
        localStorage.setItem("token", loginResponse.token);
        localStorage.setItem("cachedUser", JSON.stringify(loginResponse.user));
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
      localStorage.setItem("token", response.token);
      localStorage.setItem("cachedUser", JSON.stringify(response.user));
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
    localStorage.removeItem("token");
    localStorage.removeItem("cachedUser");
    dispatch({ type: "LOGOUT" });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: "SET_ERROR", payload: null });
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const user = await authApi.getMe();
      localStorage.setItem("cachedUser", JSON.stringify(user));
      dispatch({ type: "SET_USER", payload: user });
    } catch {
      // Офлайн — оставляем текущего пользователя
    }
  }, []);

  const value: AuthContextType = {
    state,
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    login,
    register,
    logout,
    clearError,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
