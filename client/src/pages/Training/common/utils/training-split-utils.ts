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
