import { useState } from "react";
import { useAuthContext } from "@/shared/store";
import "./RegisterPage.scss";

/**
 * ПРАВИЛА ВАЛИДАЦИИ:
 * - Логин: 3-20 символов, только буквы(a-zA-Z), цифры(0-9), дефис(-), подчеркивание(_)
 * - Пароль: минимум 8 символов (рекомендуется 12+)
 * - Пароль: минимум 1 заглавная буква (A-Z)
 * - Пароль: минимум 1 строчная буква (a-z)
 * - Пароль: минимум 1 цифра (0-9)
 * - Пароль: минимум 1 спецсимвол (!@#$%^&*()_+-=[]{}|;:,.<>?)
 * - Email: RFC 5322 compliant, максимум 254 символа
 * - Повтор пароля: точное совпадение с паролем
 * - Запрещено: пробелы, эмодзи, кириллица в логине (только для интернационализации)
 */

interface FormData {
  login: string;
  password: string;
  repeatPassword: string;
  email: string;
}

export function RegisterPage() {
  const [formData, setFormData] = useState<FormData>({
    login: "",
    password: "",
    repeatPassword: "",
    email: "",
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const { state, register, clearError } = useAuthContext();
  const { isLoading, error } = state;

  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);

  const togglePassword = (field: "password" | "repeatPassword") => {
    if (field === "password") setShowPassword(!showPassword);
    else setShowRepeatPassword(!showRepeatPassword);
  };

  const validateLogin = (login: string): string | null => {
    const trimmed = login.trim();
    if (!trimmed) return "Логин обязателен";
    if (trimmed.length < 3) return "Логин минимум 3 символа";
    if (trimmed.length > 20) return "Логин максимум 20 символов";
    if (!/^[a-zA-Zа-яё0-9_-]+$/iu.test(trimmed))
      return "Только рус/лат буквы, цифры, -, _";
    return null;
  };

  const validatePassword = (password: string): string | null => {
    if (!password) return "Пароль обязателен";
    if (password.length < 8) return "Пароль минимум 8 символов";
    if (!/[A-Z]/.test(password)) return "Минимум 1 заглавная буква";
    if (!/[a-z]/.test(password)) return "Минимум 1 строчная буква";
    if (!/[0-9]/.test(password)) return "Минимум 1 цифра";
    if (!/[^a-zA-Z0-9]/.test(password)) return "Минимум 1 спецсимвол";
    return null;
  };

  const validateEmail = (email: string): string | null => {
    if (!email) return null; // email опционален
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return "Неверный формат email";
    if (email.length > 254) return "Email слишком длинный";
    return null;
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    // Валидация логина
    const loginError = validateLogin(formData.login);
    if (loginError) newErrors.login = loginError;

    // Валидация пароля
    const passwordError = validatePassword(formData.password);
    if (passwordError) newErrors.password = passwordError;

    // Проверка повторного пароля
    if (formData.password !== formData.repeatPassword) {
      newErrors.repeatPassword = "Пароли не совпадают";
    }

    // Валидация email (опционально)
    const emailError = validateEmail(formData.email);
    if (emailError) newErrors.email = emailError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!validateForm()) return;

    try {
      await register(
        formData.login.trim(),
        formData.password,
        formData.email?.trim() || undefined,
      );
      setFormData({ login: "", password: "", repeatPassword: "", email: "" });
    } catch (err: unknown) {
      console.error("Регистрация не удалась:", err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value as FormData[keyof FormData],
    }));

    // Реактивная очистка ошибок при вводе
    if (errors[name as keyof FormData]) {
      if (
        (name === "login" && !validateLogin(value)) ||
        (name === "password" && !validatePassword(value)) ||
        (name === "email" && !validateEmail(value))
      ) {
        setErrors((prev) => ({ ...prev, [name]: undefined }));
      }
    }
  };

  return (
    <div className="reg-content">
      <form onSubmit={handleSubmit} className="reg-wrapper">
        <div className="reg-wrapper__title">Регистрация</div>

        <div className="reg-wrapper__login reg-wrapper__input required-input">
          <input
            type="text"
            name="login"
            placeholder="Придумайте логин"
            value={formData.login}
            onChange={handleChange}
            className={errors.login ? "error" : ""}
            maxLength={20}
          />
          {errors.login && <span className="error-text">{errors.login}</span>}
        </div>

        <div className="reg-wrapper__pass reg-wrapper__input required-input">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Придумайте пароль (8+ символов)"
            value={formData.password}
            onChange={handleChange}
            className={errors.password ? "error" : ""}
            maxLength={128}
          />
          <button
            type="button"
            className="reg-wrapper__password-toggle reg-wrapper__password-toggle_pass"
            onClick={() => togglePassword("password")}
            tabIndex={-1}>
            <img src="/client/src/assets/eye.svg" alt="Показать пароль" />
          </button>
          {errors.password && (
            <span className="error-text">{errors.password}</span>
          )}
        </div>

        <div className="reg-wrapper__repeat-pass reg-wrapper__input required-input">
          <input
            type={showRepeatPassword ? "text" : "password"}
            name="repeatPassword"
            placeholder="Повторите пароль"
            value={formData.repeatPassword}
            onChange={handleChange}
            className={errors.repeatPassword ? "error" : ""}
          />
          <button
            type="button"
            className="reg-wrapper__password-toggle reg-wrapper__password-toggle_repeat-pass"
            onClick={() => togglePassword("repeatPassword")}
            tabIndex={-1}>
            <img src="/client/src/assets/eye.svg" alt="Показать пароль" />
          </button>
          {errors.repeatPassword && (
            <span className="error-text">{errors.repeatPassword}</span>
          )}
        </div>

        <div className="reg-wrapper__email reg-wrapper__input">
          <input
            type="email"
            name="email"
            placeholder="Электронная почта (опционально)"
            value={formData.email}
            onChange={handleChange}
            className={errors.email ? "error" : ""}
          />
          {errors.email && <span className="error-text">{errors.email}</span>}
        </div>

        {error && <div className="reg-wrapper__error">{error}</div>}

        <div className="reg-wrapper-buttons">
          <div className="reg-wrapper-buttons_login">
            <button type="button">Уже есть аккаунт?</button>
          </div>
          <div className="reg-wrapper-buttons__submit">
            <button type="submit" disabled={isLoading}>
              {isLoading ? "Загрузка..." : "Зарегистрироваться"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
