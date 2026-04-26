import { Header, Footer } from "@/shared/ui";
import { Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import { AnimatedBackgroundCircle } from "@/shared/ui/blocks/AnimatedBackgroundCircle/AnimatedBackgroundCircle";
import "./AppLayout.scss";

function getCircleCount(width: number): number {
  if (width < 480) return 6;
  if (width < 768) return 8;
  if (width < 1024) return 12;
  return 18;
}

export const AppLayout = () => {
  const [circleCount, setCircleCount] = useState(() =>
    getCircleCount(window.innerWidth),
  );

  useEffect(() => {
    const handler = () => setCircleCount(getCircleCount(window.innerWidth));
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  return (
    <div className="app-layout">
      {/* Фон на всё приложение */}
      <AnimatedBackgroundCircle
        count={circleCount}
        minSize={40}
        maxSize={280}
        minOpacity={0.06}
        maxOpacity={0.3}
      />

      <Header />
      <main className="app-main">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};
