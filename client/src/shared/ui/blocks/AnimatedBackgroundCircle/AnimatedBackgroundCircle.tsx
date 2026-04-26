import { useMemo } from "react";
import "./AnimatedBackgroundCircle.scss";

interface CircleConfig {
  id: number;
  size: number;
  x: number;
  y: number;
  opacity: number;
  gradientAngle: number;
  color: "accent" | "secondary" | "primary";
  duration: number;
  delay: number;
  reverse: boolean;
}

interface AnimatedBackgroundCircleProps {
  count?: number;
  minSize?: number;
  maxSize?: number;
  minOpacity?: number;
  maxOpacity?: number;
}

type GradientColor = "accent" | "secondary" | "primary";
const COLORS: GradientColor[] = ["accent", "secondary", "primary"];

function getGradient(color: GradientColor): string {
  switch (color) {
    case "accent":
      return "var(--bg-accent)";
    case "secondary":
      return "var(--text-secondary)";
    case "primary":
      return "var(--text-primary)";
  }
}

// ✅ Равномерное распределение по сетке + случайное смещение
function generateCircles(
  count: number,
  minSize: number,
  maxSize: number,
  minOpacity: number,
  maxOpacity: number,
): CircleConfig[] {
  // Определяем количество колонок и строк для равномерной сетки
  const cols = Math.ceil(Math.sqrt(count * 1.5)); // чуть больше колонок, чем строк
  const rows = Math.ceil(count / cols);

  return Array.from({ length: count }, (_, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);

    // Базовая позиция по сетке
    const baseX = (col / (cols - 1)) * 100;
    const baseY = (row / (rows - 1)) * 100;

    // Случайное смещение в пределах ячейки (±25% от размера ячейки)
    const offsetX = (Math.random() - 0.5) * (100 / cols) * 1.2;
    const offsetY = (Math.random() - 0.5) * (100 / rows) * 1.2;

    // Не выходим за края (5%-95%)
    const x = Math.max(5, Math.min(95, baseX + offsetX));
    const y = Math.max(5, Math.min(95, baseY + offsetY));

    const color = COLORS[i % COLORS.length];
    const angle = Math.random() * 360;

    return {
      id: i,
      size: minSize + Math.random() * (maxSize - minSize),
      x,
      y,
      opacity: minOpacity + Math.random() * (maxOpacity - minOpacity),
      gradientAngle: angle,
      color,
      duration: 20 + Math.random() * 20,
      delay: Math.random() * 5,
      reverse: Math.random() > 0.5,
    };
  });
}

export function AnimatedBackgroundCircle(props: AnimatedBackgroundCircleProps) {
  const {
    count = 18,
    minSize = 40,
    maxSize = 280,
    minOpacity = 0.06,
    maxOpacity = 0.12,
  } = props;

  const circles = useMemo(
    () => generateCircles(count, minSize, maxSize, minOpacity, maxOpacity),
    [count, minSize, maxSize, minOpacity, maxOpacity],
  );

  return (
    <div className="animated-bg" aria-hidden="true">
      {circles.map((c) => (
        <div
          key={c.id}
          className="animated-bg-circle"
          style={{
            width: c.size,
            height: c.size,
            left: `${c.x}%`,
            top: `${c.y}%`,
            opacity: c.opacity,
            background: `linear-gradient(${c.gradientAngle}deg, ${getGradient(c.color)}, transparent)`,
            animationDuration: `${c.duration}s`,
            animationDelay: `${c.delay}s`,
            animationDirection: c.reverse ? "reverse" : "normal",
          }}
        />
      ))}
    </div>
  );
}
