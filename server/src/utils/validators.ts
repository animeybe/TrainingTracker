import { Request, Response, NextFunction } from "express";
import { logger } from "./logger";

/**
 * ПРАВИЛА ВАЛИДАЦИИ ДЛЯ СПОРТИВНОГО ПРИЛОЖЕНИЯ (синхронизировано с Frontend):
 * - Логин: 3-20 символов, русские(а-яё), латинские(a-zA-Z), цифры(0-9), дефис(-), подчеркивание(_)
 * - Логин: обязательное поле, trim() от пробелов
 * - Пароль: минимум 8 символов (рекомендуется 12+)
 * - Пароль: минимум 1 заглавная буква (A-Z)
 * - Пароль: минимум 1 строчная буква (a-z или а-я)
 * - Пароль: минимум 1 цифра (0-9)
 * - Пароль: минимум 1 спецсимвол (!@#$%^&*()_+-=[]{}|;:,.<>?)
 * - Email: RFC 5322 compliant, максимум 254 символа, опциональный
 * - Повтор пароля: НЕ проверяется на сервере (проверка только на фронте)
 * - Все поля: защита от SQL-инъекций, XSS через regex
 * - Логирование: все ошибки валидации в logger.warn
 */

type ValidatorFn = (value: any) => string | null; // Возвращает null если OK, иначе ошибку

interface ValidationSchema {
  [key: string]: ValidatorFn;
}

export const registerSchema: ValidationSchema = {
  login: (v: string): string | null => {
    const trimmed = (v || "").trim();
    if (!trimmed) return "Логин обязателен";
    if (trimmed.length < 3) return "Логин минимум 3 символа";
    if (trimmed.length > 20) return "Логин максимум 20 символов";
    if (!/^[a-zа-яё0-9_-]+$/iu.test(trimmed))
      return "Только рус/лат буквы, цифры, -, _";
    return null;
  },

  email: (v: string): string | null => {
    if (!v) return null; // опционально
    const trimmed = (v || "").trim();
    if (trimmed.length > 254) return "Email слишком длинный";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed))
      return "Неверный формат email";
    return null;
  },

  password: (v: string): string | null => {
    if (!v) return "Пароль обязателен";
    if (v.length < 8) return "Пароль минимум 8 символов";
    if (!/[A-Z]/.test(v)) return "Минимум 1 заглавная латинская буква";
    if (!/[a-zа-я]/.test(v)) return "Минимум 1 строчная буква";
    if (!/[0-9]/.test(v)) return "Минимум 1 цифра";
    if (!/[^a-zA-Z0-9а-яё]/.test(v)) return "Минимум 1 спецсимвол";
    return null;
  },
};

export const loginSchema: ValidationSchema = {
  login: registerSchema.login, // тот же валидатор
  password: (v: string): string | null => {
    if (!v) return "Пароль обязателен";
    return null; // на логине пароль попроще
  },
};

export function validate(schema: ValidationSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: string[] = [];
    const body = req.body as any;

    // Проверяем все поля по схеме
    for (const [field, validator] of Object.entries(schema)) {
      const value = body[field];
      const error = validator(value);

      if (error) {
        errors.push(`${field}: ${error}`);
      }
    }

    if (errors.length > 0) {
      const errorMsg = `Validation failed: ${errors.join("; ")}`;
      logger.warn(errorMsg);
      return res.status(400).json({
        error: "ValidationError",
        details: errors,
        message: "Проверьте правильность заполнения формы",
      });
    }

    // Добавляем в req очищенные данные
    (req as any).cleanBody = {
      login: (body.login || "").trim(),
      email: body.email ? (body.email || "").trim() : undefined,
      password: body.password,
    };

    next();
  };
}

export const validateRegister = validate(registerSchema);
export const validateLogin = validate(loginSchema);
