import "./InfoPage.scss";
import type { InfoPageProps } from "../model/types";

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

export function InfoPage(props: InfoPageProps) {
  const config = messages[props.type] || {
    title: "Ошибка",
    message: "Что-то пошло не так",
  };

  const isLoading = props.type === "loading";

  return (
    <div className="info-page">
      <div className="info-page__content">
        <div className="info-page__icon">
          {isLoading && (
            <div className="info-page__spinner">
              <div className="info-page__spinner-ring info-page__spinner-ring--1" />
              <div className="info-page__spinner-ring info-page__spinner-ring--2" />
              <div className="info-page__spinner-ring info-page__spinner-ring--3" />
            </div>
          )}
        </div>

        <h1 className="info-page__title">{config.title}</h1>

        {props.title && <h2>{props.title}</h2>}
        {config.message && (
          <p className="info-page__message">{config.message}</p>
        )}

        {props.errorText && (
          <div className="info-page__error-text">{props.errorText}</div>
        )}

        <div className="info-page__actions">
          {props.retryAction && (
            <button
              className="info-page__btn info-page__btn--primary"
              onClick={props.retryAction}>
              🔄 Повторить
            </button>
          )}

          {props.showBackButton && (
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
