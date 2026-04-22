// pages/common/InfoPage.tsx (или где сейчас InfoPage)
import { Spinner } from "@/shared/ui/blocks/Spinner/Spinner";
import type { InfoPageProps } from "../model/types";
import "./InfoPage.scss";

const messages: Record<string, { title: string; message: string }> = {
  loading: { title: "Загрузка...", message: "Подождите немного" },
  empty: { title: "Пусто", message: "Здесь пока ничего нет" },
  "404": { title: "404", message: "Страница не найдена" },
  "500": {
    title: "500",
    message: "Сервер временно недоступен\nПопробуйте через минуту",
  },
  "503": { title: "503", message: "Сервис на техработах" },
  network: { title: "Нет соединения", message: "Проверьте интернет" },
  auth: { title: "401", message: "Не авторизован" },
  "permission-denied": { title: "403", message: "Нет доступа" },
};

export function InfoPage({
  type,
  title,
  errorText,
  retryAction,
  showBackButton,
}: InfoPageProps) {
  const config = messages[type] || {
    title: "Ошибка",
    message: "Что-то пошло не так",
  };

  const isLoading = type === "loading";

  return (
    <div className="info-page">
      <div className="info-page__content">
        <div className="info-page__icon">
          {isLoading ? (
            <Spinner size="lg" />
          ) : (
            <span className="info-page__icon-static">
              {/* можно сюда поставить статический икон‑застрех или svg */}
            </span>
          )}
        </div>

        <h1 className="info-page__title">{config.title}</h1>

        {title && <h2>{title}</h2>}

        {config.message && (
          <p className="info-page__message">{config.message}</p>
        )}

        {errorText && <div className="info-page__error-text">{errorText}</div>}

        <div className="info-page__actions">
          {retryAction && (
            <button
              className="info-page__btn info-page__btn--primary"
              onClick={retryAction}>
              🔄 Повторить
            </button>
          )}

          {showBackButton && (
            <button
              className="info-page__btn info-page__btn--secondary"
              onClick={() => window.history.back()}>
              ← Назад
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
