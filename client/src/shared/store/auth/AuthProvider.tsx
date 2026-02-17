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
        if (!token) return dispatch({ type: "SET_LOADING", payload: false });

        const cachedUser = localStorage.getItem("cachedUser");
        if (cachedUser) {
          try {
            const parsed = JSON.parse(cachedUser);
            const user = {
              ...parsed,
              createdAt: parsed.createdAt
                ? new Date(parsed.createdAt)
                : undefined,
              updatedAt: parsed.updatedAt
                ? new Date(parsed.updatedAt)
                : undefined,
            };
            dispatch({ type: "SET_USER", payload: user });
            return;
          } catch {
            localStorage.removeItem("cachedUser");
          }
        }

        const user = await Promise.race([
          authApi.getMe(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Timeout")), 3000),
          ),
        ]);

        localStorage.setItem(
          "cachedUser",
          JSON.stringify({
            ...user,
            createdAt: user.createdAt?.toISOString(),
            updatedAt: user.updatedAt?.toISOString(),
          }),
        );

        dispatch({ type: "SET_USER", payload: user });
      } catch (error) {
        console.warn("Auth restore failed:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("cachedUser");
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
      localStorage.setItem("token", response.token);
      localStorage.setItem(
        "cachedUser",
        JSON.stringify({
          ...response.user,
          createdAt: response.user.createdAt?.toISOString(),
        }),
      );
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
      logout();
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
