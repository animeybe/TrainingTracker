import { Request, Response, NextFunction } from "express";
import { logger } from "./logger";

type ValidatorFn = (value: any) => boolean;

interface ValidationSchema {
  [key: string]: ValidatorFn;
}

export const registerSchema: ValidationSchema = {
  login: (v: string) => !!v && /^[a-zA-Z0-9_]{3,20}$/.test(v), // 3-20 символов, буквы/цифры/подчеркивание
  email: (v: string) => !v || /^\S+@\S+\.\S+$/.test(v), // Опциональный email
  password: (v: string) => !!v && v.length >= 6, // Минимум 6 символов
};

export const loginSchema: ValidationSchema = {
  login: (v: string) => !!v && /^[a-zA-Z0-9_]{3,20}$/.test(v), // Только логин
  password: (v: string) => !!v, // Пароль обязателен
};

export function validate(schema: ValidationSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: string[] = [];
    const body = req.body as any;

    // Проверяем login (обязательный)
    if (!body.login || !schema.login!(body.login)) {
      errors.push("login must be 3-20 chars (letters, numbers, underscore)");
    }

    // Проверяем остальные поля
    for (const [field, validator] of Object.entries(schema)) {
      const value = body[field];

      // Пропускаем login (уже проверен)
      if (field === "login") continue;

      if (!validator(value)) {
        errors.push(`${field} invalid`);
      }
    }

    if (errors.length > 0) {
      logger.warn(`Validation failed: ${errors.join(", ")}`);
      return res.status(400).json({
        error: "Validation failed",
        details: errors,
      });
    }

    next(); // Проходим дальше
  };
}

export const validateRegister = validate(registerSchema);
export const validateLogin = validate(loginSchema);
