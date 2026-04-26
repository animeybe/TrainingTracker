import { useNavigate } from "react-router-dom";
import "./HomePage.scss";

export function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="home-page">
      <div className="home-page__content">
        <div className="hero">
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
        </div>

        <div className="home-page__about">
          <h2 className="home-page__about-title">Вместе больше!</h2>
        </div>
      </div>
    </div>
  );
}
