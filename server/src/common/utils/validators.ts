import { Request, Response, NextFunction } from "express";
import { logger } from "./logger";

type ValidatorFn = (value: any) => string | null;

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
    if (!v) return null;
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
  login: registerSchema.login,
  password: (v: string): string | null => {
    if (!v) return "Пароль обязателен";
    return null;
  },
};

export function validate(schema: ValidationSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: string[] = [];
    const body = req.body as any;

    for (const [field, validator] of Object.entries(schema)) {
      const value = body[field];
      const error = validator(value);
      if (error) errors.push(`${field}: ${error}`);
    }

    if (errors.length > 0) {
      const errorMsg = `Validation failed: ${errors.join("; ")}`;
      logger.warn(errorMsg, { path: req.path, ip: req.ip });
      return res.status(400).json({
        error: "ValidationError",
        details: errors,
        message: "Проверьте правильность заполнения формы",
      });
    }

    (req as any).cleanBody = {
      login: (body.login || "").trim(),
      email: body.email ? (body.email || "").trim() : undefined,
      password: body.password,
    };

    next();
  };
}

export function isValidDate(date: unknown): date is Date {
  return date instanceof Date && !isNaN(date.getTime());
}

export function safeParseDate(dateStr: string | Date | null): Date | null {
  if (!dateStr) return null;
  if (dateStr instanceof Date) return dateStr;
  const date = new Date(dateStr);
  return isValidDate(date) ? date : null;
}

export function isValidId(id: unknown): id is string {
  return typeof id === "string" && id.length > 0;
}

export const validateRegister = validate(registerSchema);
export const validateLogin = validate(loginSchema);
