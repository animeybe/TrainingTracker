import { useState } from "react";
import { useAuthContext } from "@/shared/store";
import "./LoginPage.scss";
import EyeIcon from "@/assets/icon/eye.svg";
import { useNavigate } from "react-router-dom";

interface FormData {
  login: string;
  password: string;
}

export function LoginPage() {
  const [formData, setFormData] = useState<FormData>({
    login: "",
    password: "",
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const { state, login, clearError } = useAuthContext();
  const { isLoading, error } = state;

  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  const validateLogin = (login: string): string | null => {
    const trimmed = login.trim();
    if (!trimmed) return "Логин обязателен";
    if (trimmed.length < 3) return "Логин минимум 3 символа";
    if (trimmed.length > 20) return "Логин максимум 20 символов";
    if (!/^[a-zA-Z0-9_-]+$/i.test(trimmed))
      return "Только лат. буквы, цифры, -, _";
    return null;
  };

  const validatePassword = (password: string): string | null => {
    if (!password) return "Пароль обязателен";
    if (password.length < 8) return "Пароль минимум 8 символов";
    return null;
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    const loginError = validateLogin(formData.login);
    if (loginError) newErrors.login = loginError;

    const passwordError = validatePassword(formData.password);
    if (passwordError) newErrors.password = passwordError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    clearError();

    if (!validateForm()) return;

    try {
      await login(formData.login.trim(), formData.password);
      setFormData({ login: "", password: "" });
    } catch (err: unknown) {
      console.error("Вход не удался:", err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value as FormData[keyof FormData],
    }));

    if (errors[name as keyof FormData]) {
      if (
        (name === "login" && !validateLogin(value)) ||
        (name === "password" && !validatePassword(value))
      ) {
        setErrors((prev) => ({ ...prev, [name]: undefined }));
      }
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-wrapper">
        <div className="login-wrapper__title">Вход</div>

        <div className="login-wrapper__login login-wrapper__input required-input">
          <input
            type="text"
            name="login"
            placeholder="Логин"
            value={formData.login}
            onChange={handleChange}
            className={errors.login ? "error" : ""}
            maxLength={20}
          />
          {errors.login && <span className="error-text">{errors.login}</span>}
        </div>

        <div className="login-wrapper__pass login-wrapper__input required-input">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Пароль"
            value={formData.password}
            onChange={handleChange}
            className={errors.password ? "error" : ""}
            maxLength={128}
          />
          <button
            type="button"
            className="login-wrapper__password-toggle login-wrapper__password-toggle_pass"
            onClick={togglePassword}
            tabIndex={-1}>
            <img src={EyeIcon} alt="Показать пароль" />
          </button>
          {errors.password && (
            <span className="error-text">{errors.password}</span>
          )}
        </div>

        {error && <div className="login-error">{error}</div>}

        <div className="login-wrapper-buttons">
          <div className="login-wrapper-buttons_register">
            <button onClick={() => navigate("/register")} type="button">
              Нет аккаунта?
            </button>
          </div>
          <div className="login-wrapper-buttons__submit">
            <button type="submit" disabled={isLoading}>
              {isLoading ? "Загрузка..." : "Войти"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
