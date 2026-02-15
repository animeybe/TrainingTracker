import type { SafeUser } from "@/types/auth.types";

export const parseUser = (apiUser: Record<string, unknown>): SafeUser => ({
  id: (apiUser.id as string) || (apiUser.userId as string),
  login: apiUser.login as string,
  role: (apiUser.role as string) || "USER",
  weight: apiUser.weight ? Number(apiUser.weight) : undefined,
  height: apiUser.height ? Number(apiUser.height) : undefined,
  age: apiUser.age ? Number(apiUser.age) : undefined,
  lifestyle: apiUser.lifestyle as string | null,
  goal: apiUser.goal as string | null,
  bmi: apiUser.bmi ? Number(apiUser.bmi) : undefined,
  bmiCategory: apiUser.bmiCategory as string,
});
