"use client";
import { useReducer, useEffect, useCallback } from "react";
import type {
  AuthState,
  AuthAction,
  AuthContextType,
  SafeUser,
  ApiError,
} from "@/types";
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
        user: action.payload as SafeUser,
        isAuthenticated: !!action.payload,
        isLoading: false,
        error: null,
      };
    case "LOGOUT":
      return { ...initialState, isLoading: false };
    case "SET_LOADING":
      return { ...state, isLoading: !!action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload as string, isLoading: false };
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
          const profileResponse = await authApi.getProfile();
          dispatch({ type: "SET_USER", payload: profileResponse.user });
        }
      } catch (error) {
        console.error("Auth init failed:", error);
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
        dispatch({ type: "SET_ERROR", payload: null });
      } catch (error: unknown) {
        let message = "Ошибка регистрации";
        if (error && typeof error === "object" && "response" in error) {
          const apiError = error as ApiError;
          message = apiError.response?.data?.message || message;
        }
        dispatch({ type: "SET_ERROR", payload: message });
        throw new Error(message);
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
      dispatch({ type: "SET_USER", payload: response.user });
    } catch (error: unknown) {
      let message = "Ошибка входа";
      if (error && typeof error === "object" && "response" in error) {
        const apiError = error as ApiError;
        message = apiError.response?.data?.message || message;
      }
      dispatch({ type: "SET_ERROR", payload: message });
      throw new Error(message);
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
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
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    login,
    register,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
