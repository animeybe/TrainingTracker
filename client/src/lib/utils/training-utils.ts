// src/lib/utils/training-utils.ts
import type { ProfileData, Wellbeing } from "@/shared/api/types";

/**
 * Извлекает userId из JWT токена localStorage
 */
export const getUserIdFromToken = (): string | null => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.userId;
  } catch {
    console.warn("getUserIdFromToken failed - invalid token");
    return null;
  }
};

/**
 * Проверяет полноту профиля для генерации плана
 */
export const checkProfileInCompleteness = (
  profile: ProfileData | null,
): boolean => {
  if (!profile) return true;
  return (
    profile.weight != null &&
    profile.weight > 0 &&
    profile.height != null &&
    profile.height > 0 &&
    profile.age != null &&
    profile.age > 0 &&
    profile.gender != null &&
    profile.goal != null &&
    profile.lifestyle != null
  );
};

/**
 * Форматирует дату в YYYY-MM-DD (для localStorage wellbeing)
 */
export const getTodayString = (): string =>
  new Date().toISOString().split("T")[0];

/**
 * Сохраняет wellbeing в localStorage
 */
export const setStoredWellbeingToday = (wellbeing: Wellbeing): void => {
  const today = getTodayString();
  const stored = JSON.parse(localStorage.getItem("wellbeingHistory") || "{}");
  stored[today] = wellbeing;
  localStorage.setItem("wellbeingHistory", JSON.stringify(stored));
};

/**
 * Читает wellbeing за сегодня из localStorage
 */
export const getStoredWellbeingToday = (): Wellbeing | null => {
  const stored = JSON.parse(localStorage.getItem("wellbeingHistory") || "{}");
  return stored[getTodayString()] ?? null;
};

import type { DayType, TrainingSplit } from "@/shared/api/types";

/**
 * Русские названия сплитов для UI
 */
export const getSplitNameRu = (split: TrainingSplit): string => {
  switch (split) {
    case "PPL":
      return "Тяни-Толкай";
    case "FULL_BODY":
      return "ФуллБоди";
    case "UPPER_LOWER":
      return "Верх-Низ";
    case "BRO_SPLIT":
      return "Бро Сплит";
    case "STRENGTH_FOCUS":
      return "Фокус на силу";
    case "HYPERTROPHY_FOCUS":
      return "Фокус на гипертрофию";
  }
};

/**
 * Названия DayType для календаря
 */
export const getDayTypeRu = (dayType: DayType): string => {
  switch (dayType) {
    case "push":
      return "Толкай";
    case "pull":
      return "Тяни";
    case "legs":
      return "Ноги";
    case "upper":
      return "Верх";
    case "lower":
      return "Низ";
    case "full":
      return "Все мышцы";
    case "chest":
      return "Грудь";
    case "back":
      return "Спина";
    case "shoulders":
      return "Плечи";
    case "arms":
      return "Руки";
    case "core":
      return "Мышцы кора";
    case "rest":
      return "Отдых";
  }
};

/**
 * Короткие названия сплитов (для заголовков)
 */
export const getSplitShortRu = (split: TrainingSplit): string => {
  switch (split) {
    case "PPL":
      return "PPL";
    case "FULL_BODY":
      return "Фулл";
    case "UPPER_LOWER":
      return "В/Н";
    case "BRO_SPLIT":
      return "Бро";
    case "STRENGTH_FOCUS":
      return "Сила";
    case "HYPERTROPHY_FOCUS":
      return "Гиперт.";
  }
};
