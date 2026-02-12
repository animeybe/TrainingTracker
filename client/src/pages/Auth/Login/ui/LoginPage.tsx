"use client";
import { useState } from "react";
import { useAuthContext } from "@/shared/store"; // ✅ Правильно (shared/store)
import "./LoginPage.scss";

export function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // ✅ ПРАВИЛЬНО: useAuthContext() + state
  const { state, login, clearError } = useAuthContext();
  const { isLoading, error: authError } = state;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    clearError();

    try {
      await login(username, password);
      // Успех - редирект или сообщение
      console.log("✅ Успешный вход!");
    } catch (err: unknown) {
      let message = "Ошибка входа";
      if (err && typeof err === "object" && "message" in err) {
        message = (err as Error).message;
      }
      setError(message);
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-wrapper">
        <div className="login-wrapper__title">Вход</div>

        <div className="login-wrapper__login login-wrapper__input required">
          <input
            type="text"
            name="login"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setError("");
            }}
            placeholder="Введите логин"
            className={error ? "error" : ""}
          />
        </div>

        <div className="login-wrapper__pass login-wrapper__input required">
          <input
            type="password"
            name="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
            placeholder="Введите пароль"
            className={error ? "error" : ""}
          />
        </div>

        {(error || authError) && (
          <div className="login-error">{error || authError}</div>
        )}

        <div className="login-wrapper-buttons">
          <div className="login-wrapper-buttons_register">
            <button type="button">Нет аккаунта? Регистрация</button>
          </div>
          <div className="login-wrapper-buttons__submit">
            <button type="submit" disabled={isLoading}>
              {isLoading ? "Вход..." : "Войти"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
