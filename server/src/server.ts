// server.ts

import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { logger } from "./common/utils";
import apiRouter from "./presentation/routes"; // /api/**, включая /api/profile
import { authenticateToken } from "./presentation/middleware/auth.middleware";

const app = express();
const PORT = process.env.PORT || 3001;

const RATE_LIMIT_WINDOW_MS =
  parseInt(process.env.RATE_LIMIT_WINDOW_MS!) || 15 * 60 * 1000;
const RATE_LIMIT_AUTH_MAX = parseInt(process.env.RATE_LIMIT_AUTH_MAX!) || 5;
const RATE_LIMIT_API_MAX = parseInt(process.env.RATE_LIMIT_API_MAX!) || 100;

const createRateLimiter = (
  windowMs: number,
  max: number,
  skipLocalhost = true,
) =>
  rateLimit({
    windowMs,
    max,
    message: {
      error: "Слишком много запросов. Попробуйте позже.",
      retryAfter: Math.ceil(windowMs / 1000),
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: skipLocalhost
      ? (req) => {
          return ["127.0.0.1", "::1", "localhost"].includes(req.ip || "");
        }
      : undefined,
  });

const authLimiter = createRateLimiter(
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_AUTH_MAX,
  true,
);
const apiLimiter = createRateLimiter(
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_API_MAX,
  true,
);

app.use(express.json({ limit: "10mb" }));

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
);

// 1. Лимиты и роуты API — ДО app.get("*", ...)
app.use("/api/auth", authLimiter);
app.use("/api", apiLimiter);
app.use("/api", apiRouter); // ✅ регистрируем все API, включая /api/profile

// 2. Если хочешь SPA — только ПОСЛЕ API; пока можно закомментировать
// import path from "path";
// const DIST_PATH = path.resolve(__dirname, "../../pwa/dist");
// app.get("*", (req, res) => {
//   if (req.path.startsWith("/api")) {
//     return res.status(404).json({ error: "API route not found" });
//   }
//   res.sendFile(path.join(DIST_PATH, "index.html"));
// });

// 3. Global error handler
app.use(
  (
    error: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    logger.error(`Global error: ${error.message}`, {
      stack: error.stack,
      path: req.path,
      method: req.method,
    });
    res.status(500).json({ error: "Внутренняя ошибка сервера" });
  },
);

app.listen(PORT, () => {
  logger.info(`🚀 Server running: http://localhost:${PORT}`);
  logger.info(
    `📊 Rate limits: auth=${RATE_LIMIT_AUTH_MAX}/15m, api=${RATE_LIMIT_API_MAX}/15m`,
  );
});
