// HomePage.tsx
import { useNavigate } from "react-router-dom";
import "./HomePage.scss";

export function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="home-page">
      <div className="home-page__content">
        {/* Hero */}
        <section className="hero">
          <div className="hero__body">
            <h1 className="hero__title">
              Training
              <wbr />
              <span className="hero__title-accent">Tracker.</span>
            </h1>
            <p className="hero__subtitle">Всегда рядом, всегда готов</p>
            <p className="hero__description">
              Твои тренировки — под нашим контролем: персональные планы для
              максимального прогресса, напоминания о занятиях, поддержка в
              каждом подходе. Достигай целей проще.
            </p>
            <button onClick={() => navigate("/training")} className="hero__btn">
              Создать персональный план
              <span className="hero__btn-arrow">→</span>
            </button>
          </div>
        </section>

        {/* Возможности */}
        <section className="features">
          <h2 className="features__title">Что ты получишь</h2>
          <div className="features__grid">
            <div className="features__card">
              <span className="features__card-icon">📋</span>
              <h3>Персональный план</h3>
              <p>
                Система подберёт сплит и упражнения под твои цели, пол и уровень
                подготовки
              </p>
            </div>
            <div className="features__card">
              <span className="features__card-icon">📊</span>
              <h3>Отслеживание прогресса</h3>
              <p>
                Записывай подходы и вес, следи за ростом нагрузки неделя за
                неделей
              </p>
            </div>
            <div className="features__card">
              <span className="features__card-icon">🔔</span>
              <h3>Напоминания</h3>
              <p>
                Push-уведомления о тренировках — не пропустишь ни одного занятия
              </p>
            </div>
            <div className="features__card">
              <span className="features__card-icon">📚</span>
              <h3>База упражнений</h3>
              <p>
                130+ упражнений с подробным описанием техники и
                видео-инструкциями
              </p>
            </div>
            <div className="features__card">
              <span className="features__card-icon">❤️</span>
              <h3>Избранное и нелюбимое</h3>
              <p>
                Отмечай любимые упражнения и исключай те, что не нравятся — план
                подстроится
              </p>
            </div>
            <div className="features__card">
              <span className="features__card-icon">📱</span>
              <h3>Работает как приложение</h3>
              <p>
                Установи на телефон — PWA работает офлайн и присылает
                уведомления
              </p>
            </div>
          </div>
        </section>

        {/* Как это работает */}
        <section className="how-it-works">
          <h2 className="how-it-works__title">Как начать</h2>
          <div className="how-it-works__steps">
            <div className="how-it-works__step">
              <div className="how-it-works__step-number">1</div>
              <h3>Заполни профиль</h3>
              <p>
                Укажи возраст, вес, рост, цель и образ жизни — это займёт 2
                минуты
              </p>
            </div>
            <div className="how-it-works__step">
              <div className="how-it-works__step-number">2</div>
              <h3>Выбери сплит</h3>
              <p>
                Доверься рекомендации системы или выбери подходящий сплит сам
              </p>
            </div>
            <div className="how-it-works__step">
              <div className="how-it-works__step-number">3</div>
              <h3>Тренируйся</h3>
              <p>
                Получай план на неделю, записывай результаты и отслеживай
                прогресс
              </p>
            </div>
          </div>
        </section>

        {/* Статистика */}
        <section className="stats">
          <div className="stats__item">
            <span className="stats__number">130+</span>
            <span className="stats__label">упражнений</span>
          </div>
          <div className="stats__item">
            <span className="stats__number">6</span>
            <span className="stats__label">типов сплитов</span>
          </div>
          <div className="stats__item">
            <span className="stats__number">36</span>
            <span className="stats__label">групп мышц</span>
          </div>
          <div className="stats__item">
            <span className="stats__number">24/7</span>
            <span className="stats__label">доступ</span>
          </div>
        </section>

        {/* CTA */}
        <section className="cta">
          <h2 className="cta__title">Готов начать?</h2>
          <p className="cta__subtitle">Твой персональный тренер уже ждёт</p>
          <button onClick={() => navigate("/register")} className="cta__btn">
            Зарегистрироваться бесплатно
            <span className="cta__btn-arrow">→</span>
          </button>
        </section>
        {/* PWA Guide */}
        <section className="pwa-guide">
          <h2 className="pwa-guide__title">Установи как приложение</h2>
          <p className="pwa-guide__subtitle">
            TrainingTracker работает как нативное приложение — с уведомлениями,
            офлайн-доступом и иконкой на главном экране
          </p>
          <div className="pwa-guide__steps">
            <div className="pwa-guide__step">
              <div className="pwa-guide__step-icon">📱</div>
              <h3>Открой сайт на телефоне</h3>
              <p>
                Зайди на <strong>trainingtracker.ru</strong> в Chrome или
                Яндекс.Браузере
              </p>
            </div>
            <div className="pwa-guide__step">
              <div className="pwa-guide__step-icon">⬇️</div>
              <h3>Нажми «Установить»</h3>
              <p>
                В адресной строке появится кнопка установки. Или нажми «Добавить
                на главный экран» в меню браузера
              </p>
            </div>
            <div className="pwa-guide__step">
              <div className="pwa-guide__step-icon">🔔</div>
              <h3>Включи уведомления</h3>
              <p>
                После установки открой приложение, зайди в Dashboard и включи
                напоминания о тренировках
              </p>
            </div>
            <div className="pwa-guide__step">
              <div className="pwa-guide__step-icon">🚀</div>
              <h3>Тренируйся где угодно</h3>
              <p>
                Приложение работает без интернета — планы и упражнения всегда
                под рукой, даже в зале без связи
              </p>
            </div>
          </div>
          <div className="pwa-guide__hint">
            💡 <strong>Важно:</strong> используй Chrome на Android для полной
            поддержки PWA. На iPhone открой сайт в Safari и нажми «Поделиться» →
            «На экран Домой».
          </div>
        </section>
      </div>
    </div>
  );
}
