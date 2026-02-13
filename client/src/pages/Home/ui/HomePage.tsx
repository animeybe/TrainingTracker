import "./HomePage.scss";

export function HomePage() {
  return (
    <>
      <div className="home-content">
        <div className="start-block">
          <div className="start-block-left">
            <div className="start-block-left__title">
              Training<span>Tracker.</span>
            </div>
            <div className="start-block-left__subtitle">
              Всегда рядом, всегда готов
            </div>
            <div className="start-block-left__description">
              Твои тренировки — под нашим контролем: персональные планы для
              максимального прогресса, напоминания о занятиях, поддержка в
              каждом подходе. Достигай целей проще.
            </div>
            <div className="start-block-left__btn-crt-plan">
              <span>Создать персональный план</span>
            </div>
          </div>
          <div className="start-block-right">
            <div className="start-block-right__grad"></div>
            <div className="start-block-right__man">
              <img
                src="src/assets/gymman_1.webp"
                alt="Спорстмен"
                loading="lazy"
              />
            </div>
            <div className="start-block-right__line">
              <svg
                viewBox="0 0 800 400"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="xMidYMid meet">
                <defs>
                  <filter
                    id="glow"
                    x="-20%"
                    y="-20%"
                    width="140%"
                    height="140%">
                    <feGaussianBlur stdDeviation="6" result="blur" />
                    <feComposite
                      in="SourceGraphic"
                      in2="blur"
                      operator="over"
                    />
                  </filter>
                </defs>

                <path
                  d="M50,280 
       C150,280 180,50 320,150 
       C420,230 480,380 600,280 
       C700,200 720,50 780,20 
       L785,25 
       C725,60 710,210 600,300 
       C480,400 420,250 320,170 
       C180,70 150,300 50,280 Z"
                  fill="var(--text-secondary)"
                  style={{ filter: "url(#glow)", opacity: 0.9 }}
                />
              </svg>
            </div>
          </div>
        </div>
        <div className="about-block">
          <div className="about-block__title">Вместе больше!</div>
        </div>
      </div>
    </>
  );
}
