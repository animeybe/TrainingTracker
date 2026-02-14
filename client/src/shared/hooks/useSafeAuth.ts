import type { AuthContextType, SafeUser } from "@/types";
import { useAuthContext } from "../store";

type SafeAuthContextType = Omit<AuthContextType, "user"> & {
  user: SafeUser;
  isAuthenticated: true;
};

export const useSafeAuthContext = (): SafeAuthContextType => {
  const context = useAuthContext();

  if (!context.user) {
    throw new Error(
      // Пользователь должен просто быть + быть аутентифицированным
      "useSafeAuth: user не загружен. Только для защищённых роутов!",
    );
  }

  return context as SafeAuthContextType;
};
