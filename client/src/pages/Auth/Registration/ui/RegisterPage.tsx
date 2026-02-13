"use client";
import { useState } from "react";
import { useAuthContext } from "@/shared/store";
import "./RegisterPage.scss";

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

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.login.trim()) newErrors.login = "Логин обязателен";
    else if (formData.login.length < 3)
      newErrors.login = "Логин минимум 3 символа";

    if (!formData.password) newErrors.password = "Пароль обязателен";
    else if (formData.password.length < 6)
      newErrors.password = "Пароль минимум 6 символов";

    if (formData.password !== formData.repeatPassword) {
      newErrors.repeatPassword = "Пароли не совпадают";
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Неверный email";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!validateForm()) return;

    try {
      await register(
        formData.login,
        formData.password,
        formData.email || undefined,
      );
      alert("Регистрация успешна! Теперь войдите.");
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

    // Очищаем ошибку при вводе
    if (errors[name as keyof FormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  return (
    <div className="reg-content">
      <form onSubmit={handleSubmit} className="reg-wrapper">
        <div className="reg-wrapper__title">Регистрация</div>

        <div className="reg-wrapper__login reg-wrapper__input required">
          <input
            type="text"
            name="login"
            placeholder="Придумайте логин"
            value={formData.login}
            onChange={handleChange}
            className={errors.login ? "error" : ""}
          />
          {errors.login && <span className="error-text">{errors.login}</span>}
        </div>

        <div className="reg-wrapper__pass reg-wrapper__input required">
          <input
            type="password"
            name="password"
            placeholder="Придумайте пароль"
            value={formData.password}
            onChange={handleChange}
            className={errors.password ? "error" : ""}
          />
          {errors.password && (
            <span className="error-text">{errors.password}</span>
          )}
        </div>

        <div className="reg-wrapper__repeat-pass reg-wrapper__input required">
          <input
            type="password"
            name="repeatPassword"
            placeholder="Повторите пароль"
            value={formData.repeatPassword}
            onChange={handleChange}
            className={errors.repeatPassword ? "error" : ""}
          />
          {errors.repeatPassword && (
            <span className="error-text">{errors.repeatPassword}</span>
          )}
        </div>

        <div className="reg-wrapper__email reg-wrapper__input">
          <input
            type="email"
            name="email"
            placeholder="Электронная почта"
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
